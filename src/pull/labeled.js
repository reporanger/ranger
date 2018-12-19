const getId = require('../get-job-id')
const getConfig = require('../config')
const { MERGE } = require('../constants')

const { getPullRequest } = require('../api')

const RETRY_PERIOD = 60 * 1000

module.exports = queue => async context => {
  const ID = getId(context)

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
  const withMergeableLabels = thread.labels.filter(
    l => config.labels[l.name] && config.labels[l.name].action === MERGE.toLowerCase()
  )

  if (withMergeableLabels.length) {
    return (
      queue
        .createJob({
          ...context.issue({ installation_id: context.payload.installation.id }),
          action: MERGE
        })
        .setId(ID)
        .retries((60 * 60 * 1000) / RETRY_PERIOD)
        // TODO use 'exponential'?
        .backoff('fixed', RETRY_PERIOD)
        .save()
    )
  }

  // If closable labels are removed, delete job for this pull
  return queue.removeJob(ID)
}

module.exports.process = robot => async ({
  id,
  data: { installation_id, owner, repo, number }
}) => {
  let github
  let pull
  try {
    github = await robot.auth(installation_id)

    pull = await getPullRequest(github, { owner, repo, number })
  } catch (error) {
    robot.log.error(error)
    // Don't retry if auth or fetch fail
    return
  }

  const isMergeable = pull.mergeable && !pull.merged && pull.mergeable_state === 'clean'

  if (isMergeable) {
    await github.pullRequests.merge({
      owner,
      repo,
      number,
      sha: pull.head.sha
      /*
      merge_method: merge | rebase | squash
      commit_title,
      commit_message,
      */
    })
  } else {
    throw new Error('Retry job')
  }
}
