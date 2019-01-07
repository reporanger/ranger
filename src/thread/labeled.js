/*
 * context.issue() is used for both issues and PRs
 */
const ms = require('ms')
const getId = require('../get-job-id')
const getConfig = require('../config')
const { COMMENT } = require('../constants')

function getLabelConfig(config, labelName) {
  if (typeof config.labels[labelName] === 'object') {
    return config.labels[labelName]
  }

  return config.default.comment
}

module.exports = queue => async context => {
  const ID = getId(context, { action: COMMENT })

  const thread = context.payload.pull_request || context.payload.issue

  const config = await getConfig(context)

  const commentableLabels = thread.labels.filter(
    l =>
      config.labels[l.name] &&
      (config.labels[l.name].action || config.labels[l.name]).trim().toLowerCase() === COMMENT
  )

  commentableLabels.forEach(async label => {
    const jobId = `${ID}:${label.name}`
    const jobExists = await queue.getJob(jobId)

    // Don't create a comment if one already exist
    if (!jobExists) {
      const { message } = getLabelConfig(config, label.name)

      if (message && message.trim() !== 'false') {
        const body = message.replace('$LABEL', label.name)

        await queue
          .createJob({ action: COMMENT })
          .setId(jobId)
          // allow comment to be commented again after 30 days
          .delayUntil(Date.now() + ms('30d'))
          .save()

        return context.github.issues.createComment(context.issue({ body }))
      }
    }
  })
}
