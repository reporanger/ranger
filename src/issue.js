const Queue = require('bee-queue')
const ms = require('ms')

const { closeIssue } = require('./api')

const DEFAULT_CLOSE_TIME = ms('7 days')

const closableLabels = new Set([
  'duplicate',
  'wontfix',
  'invalid',
  'stale'
])

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
    const owner = context.payload.repository.owner.login
    const repo = context.payload.repository.name

    if (context.payload.issue.state === 'closed') {
      return
    }

    const withClosableLabels = await Promise.all(
      context.payload.issue.labels
        .filter(l => closableLabels.has(l.name))
        .map(({ name }) => context.github.issues.getLabel({
          owner,
          repo,
          name,
          headers: {
            'Accept': 'application/vnd.github.symmetra-preview+json'
          }
        }))
    ).then(arr => arr.map(_ => _.data))

    if (withClosableLabels.length) {
      const number = context.payload.issue.number

      const job = {
        owner,
        repo,
        number,
        installation_id: context.payload.installation.id
      }

      const time = Math.min(...(
        withClosableLabels
          .map(l => l.description)
          .map(d => {
            const match = d.match(/\[(.+)\]/)
            return (match && match[1] && ms(match[1])) || DEFAULT_CLOSE_TIME
          })
      ))

      queue
        .createJob(job)
        .setId(`${owner}:${repo}:${number}`)
        .delayUntil(Date.now() + time)
        .save()
    }
  }
}

module.exports.queue = queue
