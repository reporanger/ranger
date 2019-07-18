const ms = require('ms')

const getId = require('../get-job-id')
const getConfig = require('../config')
const { MERGE } = require('../constants')
const analytics = require('../analytics')

const { getPullRequest } = require('../api')

const RETRY_PERIOD = ms('2m')
const RETRY_HORIZON = ms('6h')

// https://developer.github.com/v4/enum/mergestatestatus/
const STATUS = {
  BEHIND: 'behind', // sometimes good to merge, depending on repo config
  BLOCKED: 'blocked', // cannot merge
  CLEAN: 'clean', // good to go 👍
  DIRTY: 'dirty', // merge conflicts
  HAS_HOOKS: 'has_hooks', // good-to-go, even with extra checks
  UNKNOWN: 'unknown', // in between states
  UNSTABLE: 'unstable', // can merge, but build is failing 🚫
  DRAFT: 'draft'
}

// https://developer.github.com/v4/enum/statusstate/
const STATE = {
  SUCCESS: 'success',
  PENDING: 'pending',
  FAILURE: 'failure',
  ERROR: 'error',
  EXPECTED: 'expected'
}

// https://developer.github.com/v4/enum/checkconclusionstate/
const CONCLUSION = {
  ACTION_REQUIRED: 'action_required', // The check suite or run requires action.
  CANCELLED: 'cancelled', // The check suite or run has been cancelled.
  FAILURE: 'failure', // The check suite or run has failed.
  NEUTRAL: 'neutral', // The check suite or run was neutral.
  SUCCESS: 'success', // The check suite or run has succeeded.
  TIMED_OUT: 'timed_out' // The check suite or run has timed out.
}

const methods = ['merge', 'squash', 'rebase']

module.exports = queue => async context => {
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
  const mergeableLabels = (thread.labels || []).filter(l => {
    if (typeof config.labels !== 'object') return false
    if (!config.labels[l.name]) return false

    const action =
      typeof config.labels[l.name] === 'string'
        ? config.labels[l.name]
        : config.labels[l.name].action

    return action && action.trim().toLowerCase() === MERGE
  })

  if (mergeableLabels.length) {
    const method = mergeableLabels.find(({ name }) => name.match(/rebase/i))
      ? 'rebase'
      : mergeableLabels.find(({ name }) => name.match(/squash/i))
      ? 'squash'
      : 'merge'

    analytics.track({
      userId: context.payload.installation.id,
      event: `Merge job created`,
      properties: context.issue()
    })
    return queue
      .createJob({
        ...context.issue({ installation_id: context.payload.installation.id }),
        action: MERGE,
        method
      })
      .setId(ID)
      .retries(RETRY_HORIZON / RETRY_PERIOD)
      .backoff('fixed', RETRY_PERIOD)
      .save()
  }

  // If closable labels are removed, delete job for this pull
  return queue.removeJob(ID)
}

module.exports.process = robot => async ({
  data: { installation_id, owner, repo, number, method = 'merge' }
}) => {
  let github
  let pull
  try {
    github = await robot.auth(installation_id)

    pull = await getPullRequest(github, { owner, repo, number })
  } catch (error) {
    const Sentry = require('@sentry/node')
    robot.log('Get pull request failed', error, { installation_id, owner, repo, number, method })
    Sentry.configureScope(scope => {
      scope.setUser({ id: installation_id })
      Sentry.captureException(error)
    })
    // Don't retry if auth or fetch fail
    return
  }

  // || pull.mergeable_state === status.HAS_HOOKS
  const isMergeable = pull.mergeable && !pull.merged && pull.mergeable_state === STATUS.CLEAN

  if (isMergeable) {
    const sha = pull.head.sha
    const ref = sha
    const {
      data: { state, statuses }
    } = await github.repos.getCombinedStatusForRef({ owner, repo, ref })

    // If no CI is set up, state is pending but statuses === []
    const okStatus = state === STATE.SUCCESS || (state === STATE.PENDING && statuses.length === 0)
    if (!okStatus) {
      throw new Error('Retry job')
    }

    const {
      data: { total_count, check_suites }
    } = await github.checks.listSuitesForRef({
      owner,
      repo,
      ref,
      headers: {
        Accept: 'application/vnd.github.antiope-preview+json'
      }
    })

    if (
      total_count > 0 &&
      check_suites.find(
        s =>
          s.conclusion !== CONCLUSION.SUCCESS &&
          s.conclusion !== CONCLUSION.NEUTRAL &&
          // TODO remove this. Currently check suites like https://github.com/NLog/NLog/pull/3296/checks are being
          // queued and never concluding. You can see that in this API response:
          // https://api.github.com/repos/NLog/Nlog/commits/2c8f7471648f22fa5dc9bf6db53e96fae061fc0a/check-suites
          // Corresponding issue: https://github.com/mfix22/ranger/issues/60
          s.conclusion !== null
      )
    ) {
      throw new Error('Retry job')
    }

    const initialIndex = methods.findIndex(m => m === method)

    const mergeAttempt = i =>
      github.pullRequests.merge({
        owner,
        repo,
        pull_number: number,
        sha,
        merge_method: methods[(initialIndex + i) % methods.length]
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
  } else if (pull.mergeable_state === STATUS.DIRTY) {
    // don't retry if there are merge conflicts
    return
  } else {
    throw new Error('Retry job')
  }
}
