const Queue = require('bee-queue')

const labeled = require('./src/issue/labeled')
const closed = require('./src/issue/closed')

function wrapPaymentCheck(fn) {
  return context => {
    if (context.payload.repository.private) {
      // TODO support in paid plans
      return
    }
    return fn(context)
  }
}

const setup = () =>
  new Queue('issues', {
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

module.exports = async (robot, queue = setup()) => {
  queue.process(labeled.process(robot))

  queue.on('succeeded', (job, result) => {
    robot.log.debug(`Job ${job.id} succeeded with result: ${JSON.stringify(result, null, 2)}`)
  })

  queue.on('failed', (job, err) => {
    robot.log.error(`Job ${job.id} failed with error ${err.message}`)
  })

  // Listeners
  robot.on(
    // All pull requests are issues in GitHub REST V3
    ['issues.labeled', 'issues.unlabeled', 'pull_request.labeled', 'pull_request.unlabeled'],
    wrapPaymentCheck(labeled(queue))
  )
  // Kill job when issue/pull is closed
  robot.on(['issues.closed', 'pull_request.closed'], wrapPaymentCheck(closed(queue)))

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
