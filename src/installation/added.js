const { createLabel } = require('../api')

module.exports = (robot) => async (context) => {
  try {
    const github = await robot.auth(context.payload.installation.id)

    const data = {
      owner: context.payload.installation.account.login,
      repo: context.payload.repositories_added[0].name,
      name: 'merge when passing',
      color: '#FF851B',
      description: 'Merge the PR once it passes'
    }

    return createLabel(github, data)
  } catch (e) {
    robot.log.error(e)
  }
}
