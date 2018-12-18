const Queue = require('bee-queue')

const labeled = require('./src/issue/labeled')
const closed = require('./src/issue/closed')

const privacyPolicy = require('fs').readFileSync('site/privacy.html', { encoding: 'utf8' })

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

function getMaxRepositories(plan) {
  // e.g. ['Unlimited public repositories', '5 private repositories']
  const privateRepoBullet = plan.bullets.find(b => b.match(/(\d+).+?private repo/i))

  if (privateRepoBullet) {
    return Number(privateRepoBullet.match(/(\d+).+?private repo/i)[1])
  }

  return 0
}

// TODO add DEV flag
async function verifyPaymentPlan(robot, context) {
  if (!context.payload.repository.private) {
    return true
  }

  try {
    const github = await robot.auth()

    const { data: account } = await github.apps.checkAccountIsAssociatedWithAny({
      account_id: context.payload.repository.owner.id
    })

    if (!(account && account.marketplace_purchase)) {
      return false
    }

    if (account.type !== context.payload.repository.owner.type) {
      return false
    }

    if (account.marketplace_purchase.on_free_trial) {
      return true
    }

    if (account.marketplace_purchase.plan.number === 1) {
      return false
    }

    const { data } = await context.github.apps.listRepos({ per_page: 100 })

    const count = data.repositories.filter(r => r.private).length

    const max = getMaxRepositories(account.marketplace_purchase.plan)

    if (max === 100 && count === 100) {
      return false
    }

    return count <= max
  } catch (error) {
    robot.log.error(error)
    return false
  }
}

module.exports = async (robot, queue = setup()) => {
  robot.route('/').get('/privacy', (req, res) => res.send(privacyPolicy))

  queue.process(labeled.process(robot))

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
    wrapPaymentCheck(labeled(queue))
  )
  // Kill job when issue/pull is closed
  robot.on(['issues.closed', 'pull_request.closed'], closed(queue))

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
