const Queue = require('bee-queue')
const ms = require('ms')

const { closeIssue } = require('./api')

const CONFIG_FILE = 'maintainence.yml'
const DEFAULT_COMMENT = '⚠️ This issue has been marked to be closed in $CLOSE_TIME.'
const DEFAULT_CLOSE_TIME = ms('7 days')
const DEFAULT_LABELS = [
  'duplicate',
  'wontfix',
  'invalid',
  'stale'
]

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

  return async (context) => {
    const { owner, repo, number } = context.issue()
    const ID = `${owner}:${repo}:${number}`

    if (context.payload.issue.state === 'closed') {
      return
    }

    const config = await context.config(CONFIG_FILE, {
      labels: DEFAULT_LABELS,
      delayTime: DEFAULT_CLOSE_TIME,
      comment: DEFAULT_COMMENT,
      labelComments: {}
    })

    const closableLabels = new Set(config.labels)

    const withClosableLabels = await Promise.all(
      context.payload.issue.labels
        .filter(l => closableLabels.has(l.name))
        .map(({ name }) => context.github.issues.getLabel(
          context.repo({
            name,
            headers: {
              'Accept': 'application/vnd.github.symmetra-preview+json'
            }
          })
        ))
    ).then(arr => arr.map(_ => _.data))

    if (withClosableLabels.length) {
      const { label, time } = withClosableLabels.reduce((accum, label) => {
        const match = label.description.match(/\[(.+)\]/)
        const time = timeToNumber((match && match[1]) || config.delayTime)
        if (time < accum.time) {
          return { label, time }
        }
        return accum
      }, { label: null, time: Infinity })

      if (context.payload.action.indexOf('labeled') > -1) {
        const comment = config.labelComments[label.name] || config.comment
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

    queue.removeJob(ID).catch(() => {})
  }
}

module.exports.queue = queue
