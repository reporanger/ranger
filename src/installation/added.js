const { createLabel } = require('../api')

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
              condition =
                err.message &&
                JSON.parse(err.message).errors.find(err => err.status === 'already_exists')
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
  } catch (e) {
    robot.log.error(e)
  }
}
