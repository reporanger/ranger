// const getConfig = require('../config')

module.exports = () => async context => {
  const thread = context.payload.pull_request

  if (thread.merged === true) {
    // const config = await getConfig(context)
    // TODO check config if branch should be deleted

    const ref = `heads/${thread.head.ref}`
    return context.github.gitdata.deleteRef(context.repo({ ref }))
  }
}
