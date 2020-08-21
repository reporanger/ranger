const analytics = require('../analytics')

module.exports = (robot) => async ({ payload: { installation }, github }) => {
  if (analytics.dev) return

  const {
    id: installationId,
    account: { login, type, avatar_url },
  } = installation

  let email
  try {
    const { data } = await github.users.getByUsername({
      username: login,
    })
    email = data.email
  } catch (e) {
    robot.log.error(e)
  }

  analytics.identify({
    userId: installationId,
    traits: {
      avatar: avatar_url,
      name: login,
      username: login,
      type,
      email,
    },
  })
}
