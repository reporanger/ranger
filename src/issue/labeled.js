/*
 * context.issue() is used for both issues and PRs
 */
const ms = require('ms')

const { getLabelConfig, getEffectiveLabel } = require('../thread/util')
const { getId } = require('../util')
const { closeIssue } = require('../api')
const getConfig = require('../config')
const { CLOSE } = require('../constants')
const analytics = require('../analytics')

function getLabelByAction(config, actionName) {
  return (label) => {
    if (typeof config.labels !== 'object') return false
    if (!config.labels[label.name]) return false

    const action =
      typeof config.labels[label.name] === 'string'
        ? config.labels[label.name]
        : config.labels[label.name].action

    return action && action.trim().toLowerCase() === actionName
  }
}

module.exports = (queue) => async (context) => {
  const ID = getId(context, { action: CLOSE })

  const thread = context.payload.issue

  if (thread.state === 'closed') {
    return
  }

  const config = await getConfig(context)

  const withClosableLabels = thread.labels.filter(getLabelByAction(config, CLOSE))

  if (withClosableLabels.length) {
    const { label, time } = getEffectiveLabel(config, withClosableLabels)

    const jobExists = await queue.getJob(ID)
    if (!jobExists) {
      const { comment } = getLabelConfig(config, label.name, CLOSE)

      if (comment && comment.trim() !== 'false') {
        const body = comment
          .replace('$DELAY', time == null ? '' : ms(time, { long: true }))
          .replace('$LABEL', label.name)
          .replace('$USER', thread.user.login)
          .replace('$AUTHOR', thread.user.login)
        context.github.issues.createComment(context.repo({ body, issue_number: thread.number }))
      }
    }

    if (time >= 0) {
      return queue
        .createJob({
          ...context.issue({ installation_id: context.payload.installation.id }),
          action: CLOSE,
        })
        .setId(ID)
        .delayUntil(Date.now() + time)
        .save()
        .then((job) => {
          analytics.track(() => ({
            userId: context.payload.installation.id,
            event: `Close job created`,
            properties: {
              ...job.data,
              id: job.id,
            },
          }))
          return job
        })
    }
  }

  // If closable labels are removed, delete job for this issue
  return queue.removeJob(ID)
}

module.exports.process = (robot) => async ({ data /* id */ }) => {
  const github = await robot.auth(data.installation_id)
  return await closeIssue(github, data)
}
