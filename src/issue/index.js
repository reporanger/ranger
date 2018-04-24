const ms = require('ms')

const { closeIssue } = require('./api')
const { getId, getLabelConfig, getEffectiveLabel } = require('./util')
const getConfig = require('../config')

module.exports = (robot, queue) => {
  queue.process(async ({ id, data }) => {
    try {
      const github = await robot.auth(data.installation_id)
      return await closeIssue(github, data)
    } catch (e) {
      robot.log.error(e)
    }
  })

  queue.on('succeeded', (job, result) => {
    robot.log.debug(`Job ${job.id} succeeded with result: ${JSON.stringify(result, null, 2)}`)
  })

  queue.on('failed', (job, err) => {
    robot.log.error(`Job ${job.id} failed with error ${err.message}`)
  })

  return async (context) => {
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

    return queue.removeJob(ID)
  }
}

module.exports.close = (robot, queue) => context => {
  const ID = getId(context)

  return queue.removeJob(ID)
}
