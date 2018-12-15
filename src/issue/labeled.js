/*
 * context.issue() is used for both issues and PRs
 */
const ms = require('ms')

const { closeIssue } = require('../api')
const { getId, getLabelConfig, getEffectiveLabel } = require('./util')
const getConfig = require('../config')
const { CLOSE } = require('../constants')

module.exports = queue => async context => {
  const ID = getId(context)

  // Pull requests are issues, but info is set under `pull_request` field
  const thread = context.payload.issue || context.payload.pull_request

  if (thread.state === 'closed') {
    return
  }

  const config = await getConfig(context)

  const closableLabels = new Set(config.labels)

  const withClosableLabels = thread.labels.filter(l => closableLabels.has(l.name))

  if (withClosableLabels.length) {
    const { label, time } = getEffectiveLabel(config, withClosableLabels)

    const jobExists = await queue.getJob(ID)
    if (!jobExists) {
      const { comment } = getLabelConfig(config, label.name)

      if (comment && comment.trim() !== 'false') {
        const body = comment
          .replace('$CLOSE_TIME', ms(time, { long: true }))
          .replace('$LABEL', label.name)
        context.github.issues.createComment(context.issue({ body }))
      }
    }

    return queue
      .createJob({
        ...context.issue({ installation_id: context.payload.installation.id }),
        action: CLOSE
      })
      .setId(ID)
      .delayUntil(Date.now() + time)
      .save()
  }

  // If closable labels are removed, delete job for this issue
  return queue.removeJob(ID)
}

module.exports.process = robot => async ({ id, data }) => {
  switch (data.action) {
    case CLOSE:
    default:
      try {
        const github = await robot.auth(data.installation_id)
        return closeIssue(github, data)
      } catch (e) {
        robot.log.error(e)
      }
  }
}
