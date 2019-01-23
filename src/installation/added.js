const { createLabel } = require('../api')

module.exports = robot => async context => {
  try {
    const github = await robot.auth(context.payload.installation.id)

    const repos = context.payload.repositories_added || context.payload.repositories

    const promises = repos.map(({ name: repo }) => {
      const data = {
        owner: context.payload.installation.account.login,
        repo,
        name: 'merge when passing',
        color: 'FF851B',
        description: 'Merge the PR automatically once all status checks have passed'
      }

      return createLabel(github, data).catch(err => {
        let condition
        try {
          // throw original error if parse fails
          condition =
            err.message && JSON.parse(err.message).errors.find(err => err.code === 'already_exists')
        } catch (e) {
          throw err
        }

        if (!condition) {
          throw err
        }
      })
    })

    await Promise.all(promises)
  } catch (e) {
    robot.log.error(e)
  }
}
