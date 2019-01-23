const getConfig = require('../config')

module.exports = () => async context => {
  const thread = context.payload.pull_request

  if (thread.merged === true) {
    const config = await getConfig(context)

    if (config.delete_branch_after_merge) {
      const ref = `heads/${thread.head.ref}`
      return context.github.gitdata.deleteRef(context.repo({ ref }))
    }
  }
}
