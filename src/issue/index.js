const ms = require('ms')

const { getId, getLabelConfig, getEffectiveLabel } = require('./util')
const getConfig = require('../config')

module.exports = queue => async context => {
  const ID = getId(context)

  if (context.payload.issue.state === 'closed') {
    return
  }

  const config = await getConfig(context)

  const closableLabels = new Set(config.labels)

  const withClosableLabels = context.payload.issue.labels
    .filter(l => closableLabels.has(l.name))

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
      .createJob(context.issue({ installation_id: context.payload.installation.id }))
      .setId(ID)
      .delayUntil(Date.now() + time)
      .save()
  }

  // If closable labels are removed, delete job for this issue
  return queue.removeJob(ID)
}

module.exports.close = queue => context => {
  const ID = getId(context)

  return queue.removeJob(ID)
}
