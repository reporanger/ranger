const Analytics = require('analytics-node')

if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'production') {
  exports.analytics = new Analytics(process.env.SEGMENT_WRITE_KEY)
}

exports.installed = robot => async ({
  payload: { installation, repositories, repositories_added }
}) => {
  if (!exports.analytics) return

  const {
    id: installationId,
    account: { login, type }
  } = installation

  const repos = repositories_added || repositories

  try {
    exports.analytics.identify({
      userId: installationId,
      traits: {
        username: login,
        name: login,
        type
      }
    })

    const private_repos = repos.filter(r => r.private)

    exports.analytics.track({
      userId: installationId,
      event: 'Repo added',
      properties: {
        count: repos.length,
        private_count: private_repos.length
      }
    })
  } catch (e) {
    robot.log.error(e)
  }
}
