const Sentry = require('@sentry/node')
const r = require('rexrex')
const { OPEN_SOURCE } = require('./constants')

const ALLOW_LIST = new Set(process.env.BETA_USERS ? process.env.BETA_USERS.split(',') : [])

module.exports = async function verifyPaymentPlan(robot, context) {
  if (!context.payload.repository.private) {
    return true
  }

  const owner = context.repo().owner
  if (ALLOW_LIST.has(owner.toLowerCase())) {
    return true
  }

  try {
    const github = await robot.auth()

    const { data: account } = await getAssociatedAccount(
      github,
      context.payload.repository.owner.id
    )

    if (!(account && account.marketplace_purchase)) {
      return false
    }

    if (account.type !== context.payload.repository.owner.type) {
      return false
    }

    if (account.marketplace_purchase.on_free_trial) {
      return true
    }

    if (account.marketplace_purchase.plan.number === OPEN_SOURCE) {
      return false
    }

    const { data } = await context.octokit.apps.listRepos({ per_page: 100 })

    const count = data.repositories.filter((r) => r.private).length

    const max = getMaxRepositories(account.marketplace_purchase.plan)

    if (max === 100 && count === 100) {
      return false
    }

    return count <= max
  } catch (error) {
    if (error.status !== 404) {
      robot.log.error(error, context.repo())
      Sentry.configureScope((scope) => {
        scope.setUser({ username: owner })
        Sentry.captureException(error)
      })
    }
    return false
  }
}

function getAssociatedAccount(github, account_id) {
  return github.apps.getSubscriptionPlanForAccount({ account_id })
}

const privateReposAllowedPattern = r.and(
  r.capture(r.extra(r.matchers.NUMBER)),
  r.extra('.', true),
  'private repo'
)

function getMaxRepositories(plan) {
  // e.g. ['Unlimited public repositories', '5 private repositories']
  const privateRepoBullet = plan.bullets.find((b) =>
    b.match(r.regex(privateReposAllowedPattern, 'i'))
  )

  if (privateRepoBullet) {
    return Number(privateRepoBullet.match(r.regex(privateReposAllowedPattern, 'i'))[1])
  }

  return 0
}
