const Mixpanel = require('mixpanel')

if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'production') {
  exports.mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN)
}

const set = (...args) =>
  new Promise((res, rej) =>
    exports.mixpanel.people.set(...args, (err, data) => (err ? rej(err) : res(data)))
  )

const append = (...args) =>
  new Promise((res, rej) =>
    exports.mixpanel.people.append(...args, (err, data) => (err ? rej(err) : res(data)))
  )

exports.installed = robot => async ({
  payload: { installation, repositories, repositories_added }
}) => {
  if (!exports.mixpanel) return

  const {
    id: installationId,
    account: { login, type }
  } = installation

  const repos = repositories_added || repositories

  try {
    await set(installationId, {
      $first_name: login,
      type
    })
    await append(installationId, {
      repos: repos.map(r => r.name),
      private_repos: repos.filter(r => r.private).map(r => r.name)
    })
  } catch (e) {
    robot.log.error(e)
  }
}
