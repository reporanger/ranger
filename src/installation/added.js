const { createLabel } = require('../api')
const analytics = require('../analytics')

const LABELS_TO_CREATE = [
  {
    name: 'merge when passing',
    color: 'FF851B',
    description: 'Merge the PR automatically once all status checks have passed',
  },
  {
    name: 'patch version',
    color: '99cef9',
    description: 'Automatically create a new patch version tag after PR is merged',
  },
  {
    name: 'minor version',
    color: '6EBAF7',
    description: 'Automatically create a new minor version tag after PR is merged',
  },
  {
    name: 'major version',
    color: '1E8DE7',
    description: 'Automatically create a new major version tag after PR is merged',
  },
]

module.exports = (robot) => async (context) => {
  try {
    const github = await robot.auth(context.payload.installation.id)

    const repos = context.payload.repositories_added || context.payload.repositories

    if (!repos.length) {
      return
    }

    const promises = repos.map(({ name: repo }) => {
      analytics.track(() => ({
        userId: context.payload.installation.id,
        event: `Creating default labels`,
        properties: {
          repo,
          user: context.payload.installation.account.login,
        },
      }))
      return Promise.allSettled(
        LABELS_TO_CREATE.map((l) => {
          const data = {
            owner: context.payload.installation.account.login,
            repo,
            ...l,
          }

          return createLabel(github, data).catch((err) => {
            if (err.message.indexOf('archived') > -1 || err.message.indexOf('Not found') > -1) {
              return
            }

            try {
              if (err.errors) {
                if (err.errors.find((err) => err.code === 'already_exists')) {
                  return
                }
              }

              throw err
            } catch (e) {
              robot.log.error(err)
            }
          })
        })
      )
    })

    await Promise.allSettled(promises)

    const private_repos = repos.filter((r) => r.private)
    analytics.track({
      userId: context.payload.installation.id,
      event: `Repos added`,
      properties: {
        count: repos.length,
        private_count: private_repos.length,
        repos: repos.map((r) => r.name),
      },
    })
  } catch (e) {
    const Sentry = require('@sentry/node')
    Sentry.configureScope((scope) => {
      scope.setUser({
        id: context.payload.installation.id,
        username: context.payload.installation.account.login,
      })
      Sentry.captureException(e)
    })
    robot.log.error(e)
  }
}
