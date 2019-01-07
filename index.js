const Queue = require('bee-queue')

const threadLabeled = require('./src/thread/labeled')
const issueLabeled = require('./src/issue/labeled')
const pullLabeled = require('./src/pull/labeled')
const threadClosed = require('./src/thread/closed')
const commentDeleted = require('./src/comment/deleted')
const installationAdded = require('./src/installation/added')

const { CLOSE, MERGE } = require('./src/constants')

const verifyPaymentPlan = require('./src/verify-payment-plan')

module.exports = async robot => {
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

  queue.process(job => {
    switch (job.data.action) {
      case MERGE:
        return pullLabeled.process(robot)(job)
      case CLOSE:
      default:
        return issueLabeled.process(robot)(job)
    }
  })

  queue.on('succeeded', (job, result) => {
    robot.log.debug(`Job ${job.id} succeeded with result: ${JSON.stringify(result, null, 2)}`)
  })

  queue.on('failed', (job, err) => {
    robot.log.error(`Job ${job.id} failed with error ${err.message}`)
  })

  function wrapPaymentCheck(fn) {
    return async context => {
      if (await verifyPaymentPlan(robot, context)) {
        fn(context)
      }
    }
  }

  // Listeners
  robot.on(
    // All pull requests are issues in GitHub REST V3
    ['issues.labeled', 'issues.unlabeled', 'pull_request.labeled', 'pull_request.unlabeled'],
    wrapPaymentCheck(threadLabeled(queue))
  )

  robot.on(['issues.labeled', 'issues.unlabeled'], wrapPaymentCheck(issueLabeled(queue)))

  robot.on(
    // All pull requests are issues in GitHub REST V3
    [
      'pull_request.labeled',
      'pull_request.unlabeled',
      'pull_request.synchronize',
      'pull_request_review.submitted'
      // `pull_request.edited`
    ],
    wrapPaymentCheck(pullLabeled(queue))
  )

  // Kill job when issue/pull is closed
  robot.on(['issues.closed', 'pull_request.closed'], threadClosed(queue))

  robot.on('issue_comment.deleted', commentDeleted(queue))

  robot.on(['installation_repositories.added', 'installation.created'], installationAdded(robot))

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/

  return {
    queue
  }
}
