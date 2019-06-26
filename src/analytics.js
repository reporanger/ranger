const Analytics = require('analytics-node')

if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'production') {
  exports.analytics = new Analytics(process.env.SEGMENT_WRITE_KEY)
}

exports.installed = robot => async ({
  payload: { installation, repositories, repositories_added },
  github
}) => {
  if (!exports.analytics) return

  const {
    id: installationId,
    account: { login, type, avatar_url }
  } = installation

  let email
  try {
    const { data } = await github.users.getByUsername({
      username: installation.account.login
    })
    email = data.email
  } catch (e) {
    robot.log.error(e)
  }

  const repos = repositories_added || repositories

  try {
    exports.analytics.identify({
      userId: installationId,
      traits: {
        avatar: avatar_url,
        name: login,
        username: login,
        type,
        email
      }
    })

    const private_repos = repos.filter(r => r.private)

    if (repos.length) {
      exports.analytics.track({
        userId: installationId,
        event: `Repos added: ${repos.map(r => r.name).join(', ')}`,
        properties: {
          count: repos.length,
          private_count: private_repos.length
        }
      })
    }
  } catch (e) {
    robot.log.error(e)
  }
}
