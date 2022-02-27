const ms = require('ms')

const { getId } = require('../util')
const getConfig = require('../config')
const { MERGE, PULL_REQUEST_MERGE_DELAY } = require('../constants')
const analytics = require('../analytics')
const { labelsByAction } = require('../thread/util')
const { getPullRequest } = require('../api')

const RETRY_PERIOD = ms('1m')
const RETRY_HORIZON = ms('3h')

const { STATUS, STATE, CONCLUSION } = require('../constants')

const methods = ['merge', 'squash', 'rebase']

class Retry extends Error {
  constructor() {
    super('Retry job')
  }
}

module.exports = (queue) => async (context) => {
  const ID = getId(context, { action: MERGE })

  const thread = context.payload.pull_request

  if (thread.state === 'closed') {
    return
  }

  const jobExists = await queue.getJob(ID)

  if (jobExists) {
    // restart job if new label event occurs
    queue.removeJob(ID)
  }

  const config = await getConfig(context)
  const actionableLabels = (thread.labels || []).filter(labelsByAction(config, MERGE))

  if (actionableLabels.length) {
    const method = actionableLabels.find(({ name }) => name.match(/rebase/i))
      ? 'rebase'
      : actionableLabels.find(({ name }) => name.match(/squash/i))
      ? 'squash'
      : 'merge'

    return (
      queue
        .createJob(
          context.pullRequest({
            installation_id: context.payload.installation.id,
            action: MERGE,
            method,
          })
        )
        .setId(ID)
        // https://github.com/reporanger/feedback/issues/1
        .delayUntil(Date.now() + PULL_REQUEST_MERGE_DELAY)
        .retries(RETRY_HORIZON / RETRY_PERIOD)
        .backoff('fixed', RETRY_PERIOD)
        .save()
        .then((job) => {
          analytics.track(() => ({
            userId: context.payload.installation.id,
            event: `Merge job created`,
            properties: {
              ...job.data,
              id: job.id,
            },
          }))
          return job
        })
    )
  }

  // If closable labels are removed, delete job for this pull
  return queue.removeJob(ID)
}

module.exports.process = (robot) => async ({
  data: { installation_id, owner, repo, number, pull_number, method = 'merge' },
}) => {
  let github
  let pull

  // TODO change this to just use number
  const the_number = pull_number || number

  try {
    github = await robot.auth(installation_id)

    pull = await getPullRequest(github, { owner, repo, pull_number: the_number })
  } catch (error) {
    const Sentry = require('@sentry/node')
    Sentry.configureScope((scope) => {
      scope.setUser({ username: owner, id: installation_id })
      Sentry.captureException(error)
    })
    // Don't retry if auth or fetch fail
    return
  }

  // || pull.mergeable_state === status.HAS_HOOKS
  const isMergeable = pull.mergeable && !pull.merged && pull.mergeable_state === STATUS.CLEAN

  analytics.track(() => ({
    userId: installation_id,
    event: `Merge job processing`,
    properties: {
      owner,
      repo,
      number,
      method,
      mergeable: pull.mergeable,
      mergeable_state: pull.mergeable_state,
    },
  }))

  if (isMergeable) {
    const sha = pull.head.sha
    const ref = sha
    const {
      data: { state, statuses },
    } = await github.repos.getCombinedStatusForRef({ owner, repo, ref })

    // If no CI is set up, state is pending but statuses === []
    const okStatus = state === STATE.SUCCESS || (state === STATE.PENDING && statuses.length === 0)
    if (!okStatus) {
      throw new Retry()
    }

    const {
      data: { total_count, check_suites },
    } = await github.checks.listSuitesForRef({
      owner,
      repo,
      ref,
      headers: {
        Accept: 'application/vnd.github.antiope-preview+json',
      },
    })

    if (
      total_count > 0 &&
      check_suites.find(
        (s) =>
          s.conclusion !== CONCLUSION.SUCCESS &&
          s.conclusion !== CONCLUSION.NEUTRAL &&
          s.conclusion !== CONCLUSION.SKIPPED &&
          // TODO remove this. Currently check suites like https://github.com/NLog/NLog/pull/3296/checks are being
          // queued and never concluding. You can see that in this API response:
          // https://api.github.com/repos/NLog/Nlog/commits/2c8f7471648f22fa5dc9bf6db53e96fae061fc0a/check-suites
          // Corresponding issue: https://github.com/mfix22/ranger/issues/60
          s.conclusion !== null
      )
    ) {
      throw new Retry()
    }

    const initialIndex = methods.findIndex((m) => m === method)

    const mergeAttempt = (i) =>
      github.pulls.merge({
        owner,
        repo,
        pull_number: the_number,
        sha,
        merge_method: methods[(initialIndex + i) % methods.length],
      })

    try {
      await mergeAttempt(0)
    } catch (e) {
      try {
        await mergeAttempt(1)
      } catch (e) {
        await mergeAttempt(2)
      }
    }
  } else if (pull.mergeable_state === STATUS.BEHIND) {
    // TODO use getBranchProtection?
    const { data: branch } = await github.repos.getBranch({
      owner: pull.base.user.login,
      repo: pull.base.repo.name,
      branch: pull.base.ref,
    })
    if (
      branch.protected &&
      branch.protection &&
      branch.protection.enabled &&
      branch.protection.required_status_checks &&
      branch.protection.required_status_checks.enforcement_level !== 'off' &&
      branch.protection.required_status_checks.contexts.length
    ) {
      return await github.pulls.updateBranch({
        owner,
        repo,
        pull_number: the_number,
        expected_head_sha: pull.head.sha,
        headers: {
          accept: 'application/vnd.github.lydian-preview+json',
        },
      })
    }
  } else if (pull.mergeable_state === STATUS.DIRTY) {
    // don't retry if there are merge conflicts
    return
  } else {
    throw new Retry()
  }
}
