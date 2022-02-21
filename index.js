const Queue = require('bee-queue')
const Sentry = require('@sentry/node')

const analytics = require('./src/analytics')

const threadLabeled = require('./src/thread/labeled')
const threadOpened = require('./src/thread/opened')
const issueLabeled = require('./src/issue/labeled')
const pullLabeled = require('./src/pull/labeled')
const pullMerged = require('./src/pull/merged')
const pullSynchronized = require('./src/pull/synchronized')
const threadClosed = require('./src/thread/closed')
const commentDeleted = require('./src/comment/deleted')
const commentCreated = require('./src/comment/created')
const installationCreated = require('./src/installation/created')
const installationAdded = require('./src/installation/added')

const { CLOSE, MERGE, COMMENT, LOCK } = require('./src/constants')

const verifyPaymentPlan = require('./src/verify-payment-plan')

// Probot will also send errors to Sentry DNS: https://probot.github.io/docs/configuration/
Sentry.init({ dsn: process.env.SENTRY_DSN })

module.exports = async ({ app, getRouter }) => {
  const router = getRouter('/')
  router.get('/health', (req, res) => res.send('OK'))

  if (process.env.NODE_ENV !== 'test') {
    process.on('uncaughtException', (e) => {
      app.log.error(e)
    })
    process.on('unhandledRejection', (e) => {
      app.log.error(e)
    })
  }

  const queue = new Queue('issues', {
    removeOnSuccess: true,
    removeOnFailure: true,
    activateDelayedJobs: true,
    redis: {
      db: 0,
      url: process.env.REDIS_URL,
    },
  })

  queue.process(async (job) => {
    analytics.track(() => ({
      userId: job.data.installation_id,
      event: `Processing job`,
      properties: job.data,
    }))
    try {
      switch (job.data.action) {
        case MERGE:
          return await pullLabeled.process(app)(job)
        case LOCK:
          return await threadClosed.process(app)(job)
        case COMMENT:
        case CLOSE:
        default:
          return await threadLabeled.process(app)(job)
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        app.log(error, job)
      }
      throw error
    }
  })

  queue.on('succeeded', (job, result) => {
    app.log.debug(`Job ${job.id} succeeded with result: ${JSON.stringify(result, null, 2)}`)
  })

  queue.on('failed', (job, err) => {
    if (err.message === 'Retry job') {
      return
    }
    app.log.error(
      `Job ${job.id} with data ${JSON.stringify(job.data, null, 2)} failed with error ${
        err.message
      }`
    )
    Sentry.configureScope((scope) => {
      if (job.data.owner) {
        scope.setUser({ ...job.data, username: job.data.owner })
      }
      Sentry.captureException(err)
    })
  })

  function wrapPaymentCheck(fn) {
    return async (context) => {
      if (await verifyPaymentPlan(app, context)) {
        fn(context)
      }
    }
  }

  // Listeners
  // TODO combine first 2 listeners
  app.on(
    // All pull requests are issues in GitHub REST V3
    ['issues.labeled', 'issues.unlabeled', 'pull_request.labeled', 'pull_request.unlabeled'],
    wrapPaymentCheck(threadLabeled(queue))
  )
  app.on(
    ['issues.labeled', 'issues.unlabeled', 'pull_request.labeled', 'pull_request.unlabeled'],
    wrapPaymentCheck(issueLabeled(queue))
  )

  app.on(['issues.opened', 'pull_request.opened'], wrapPaymentCheck(threadOpened(queue)))

  app.on(
    [
      'pull_request.labeled',
      'pull_request.unlabeled',
      'pull_request.synchronize',
      'pull_request_review.submitted',
      // `pull_request.edited`
    ],
    wrapPaymentCheck(pullLabeled(queue))
  )
  // TODO rerun pull labeled job on `check_suite.completed`

  app.on(['issue_comment.created', 'issue_comment.edited'], wrapPaymentCheck(commentCreated()))

  app.on('pull_request.closed', wrapPaymentCheck(pullMerged.deleteBranch()))
  app.on('pull_request.closed', wrapPaymentCheck(pullMerged.createTag()))

  app.on(['pull_request.opened', 'pull_request.synchronize'], wrapPaymentCheck(pullSynchronized()))

  // Kill job when issue/pull is closed
  app.on(['issues.closed', 'pull_request.closed'], threadClosed(queue))

  app.on('issue_comment.deleted', commentDeleted(queue))

  app.on(['installation.created'], installationCreated(app))
  app.on(['installation_repositories.added', 'installation.created'], installationAdded(app))
  // TODO 'marketplace_purchase.purchased'

  // TODO use status updates to retrigger merge jobs
  // robot.on('status', c => console.log(c.payload))

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/

  app.queue = queue
  app.analytics = analytics
}
