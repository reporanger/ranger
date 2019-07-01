const { createLabel } = require('../api')
const analytics = require('../analytics')

const LABELS_TO_CREATE = [
  {
    name: 'merge when passing',
    color: 'FF851B',
    description: 'Merge the PR automatically once all status checks have passed'
  },
  {
    name: 'Patch Version',
    color: '99cef9',
    description: 'Automatically create a new patch version tag after PR is merged'
  },
  {
    name: 'Minor Version',
    color: '6EBAF7',
    description: 'Automatically create a new minor version tag after PR is merged'
  },
  {
    name: 'Major Version',
    color: '1E8DE7',
    description: 'Automatically create a new major version tag after PR is merged'
  }
]

module.exports = robot => async context => {
  try {
    const github = await robot.auth(context.payload.installation.id)

    const repos = context.payload.repositories_added || context.payload.repositories

    if (!repos.length) {
      return
    }

    const promises = repos.map(({ name: repo }) => {
      return Promise.all(
        LABELS_TO_CREATE.map(l => {
          const data = {
            owner: context.payload.installation.account.login,
            repo,
            ...l
          }

          return createLabel(github, data).catch(err => {
            let condition
            try {
              // throw original error if parse fails
              condition = err.errors && err.errors.find(err => err.code === 'already_exists')
            } catch (e) {
              throw err
            }

            if (!condition) {
              throw err
            }
          })
        })
      )
    })

    await Promise.all(promises)

    const private_repos = repos.filter(r => r.private)
    analytics.track({
      userId: context.payload.installation.id,
      event: `Repos added: ${repos.map(r => r.name).join(', ')}`,
      properties: {
        count: repos.length,
        private_count: private_repos.length
      }
    })
  } catch (e) {
    const Sentry = require('@sentry/node')
    Sentry.configureScope(scope => {
      scope.setUser({ id: context.payload.installation.id })
      Sentry.captureException(e)
    })
    robot.log.error(e)
  }
}
