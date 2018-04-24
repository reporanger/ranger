const Queue = require('bee-queue')
const ms = require('ms')

const { closeIssue } = require('./api')
const getConfig = require('./config')

const queue = new Queue('issues', {
  removeOnSuccess: true,
  removeOnFailure: true,
  activateDelayedJobs: true,
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    db: 0,
    password: process.env.REDIS_PASSWORD,
    options: { password: process.env.REDIS_PASSWORD }
  }
})

const timeToNumber = time => {
  return isNaN(time) ? ms(time.trim()) : time
}

module.exports = (robot) => {
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
    const { owner, repo, number } = context.issue()
    const ID = `${owner}:${repo}:${number}`

    if (context.payload.issue.state === 'closed') {
      return
    }

    const config = await getConfig(context)

    const closableLabels = new Set(config.labels)

    const withClosableLabels = context.payload.issue.labels
      .filter(l => closableLabels.has(l.name))

    if (withClosableLabels.length) {
      const { label, time } = withClosableLabels.reduce((accum, label) => {
        const time = timeToNumber(
          (config.labelConfig[label.name] && config.labelConfig[label.name].delayTime) || config.delayTime
        )
        if (time < accum.time) {
          return { label, time }
        }
        return accum
      }, { label: null, time: Infinity })

      // TODO move into separate handler
      const job = await queue.getJob(ID)
      if (!job && context.payload.action.indexOf('labeled') > -1) {
        const comment = (config.labelConfig[label.name] && config.labelConfig[label.name].comment) || config.comment
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

    return queue.removeJob(ID).catch(() => {})
  }
}

module.exports.close = function close (context) {
  const { owner, repo, number } = context.issue()
  const ID = `${owner}:${repo}:${number}`

  return queue.removeJob(ID)
}

module.exports.queue = queue
