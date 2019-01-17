// TODO add DEV flag
const { OPEN_SOURCE } = require('./constants')

const WHITE_LIST = ['dawnlabs', 'windsorio']

module.exports = async function verifyPaymentPlan(robot, context) {
  if (!context.payload.repository.private) {
    return true
  }

  if (context.payload.organization && WHITE_LIST.includes(context.payload.organization.login)) {
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

function getAssociatedAccount(github, account_id) {
  return github.apps.checkAccountIsAssociatedWithAny({ account_id })
}

function getMaxRepositories(plan) {
  // e.g. ['Unlimited public repositories', '5 private repositories']
  const privateRepoBullet = plan.bullets.find(b => b.match(/(\d+).+?private repo/i))

  if (privateRepoBullet) {
    return Number(privateRepoBullet.match(/(\d+).+?private repo/i)[1])
  }

  return 0
}
