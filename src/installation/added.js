const { createLabel } = require('../api')

module.exports = (robot) => async (context) => {
  try {
    const github = await robot.auth(context.payload.installation.id)

    const data = {
      owner: context.payload.installation.account.login,
      repo: context.payload.repositories_added[0].name,
      name: 'automerge',
      color: '#fff'
    }

    return createLabel(github, data)
  } catch (e) {
    robot.log.error(e)
  }
}
