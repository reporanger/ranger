/*
 * context.issue() is used for both issues and PRs
 */
const ms = require('ms')

const { getLabelConfig, getEffectiveLabel } = require('./util')
const getId = require('../get-job-id')
const { closeIssue } = require('../api')
const getConfig = require('../config')
const { CLOSE } = require('../constants')

module.exports = queue => async context => {
  const ID = getId(context, { action: CLOSE })

  const thread = context.payload.issue

  if (thread.state === 'closed') {
    return
  }

  const config = await getConfig(context)

  const withClosableLabels = thread.labels.filter(
    l =>
      config.labels[l.name] &&
      (config.labels[l.name].action || config.labels[l.name]).trim().toLowerCase() === CLOSE
  )

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

    if (time >= 0 && isFinite(time)) {
      return queue
        .createJob({
          ...context.issue({ installation_id: context.payload.installation.id }),
          action: CLOSE
        })
        .setId(ID)
        .delayUntil(Date.now() + time)
        .save()
    }
  }

  // If closable labels are removed, delete job for this issue
  return queue.removeJob(ID)
}

module.exports.process = robot => async ({ data /* id */ }) => {
  try {
    const github = await robot.auth(data.installation_id)
    return closeIssue(github, data)
  } catch (e) {
    robot.log.error(e)
  }
}
