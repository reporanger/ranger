const getConfig = require('../config')
const { DELETE_BRANCH } = require('../constants')

module.exports = () => async context => {
  const thread = context.payload.pull_request

  if (thread.merged !== true) return

  const config = await getConfig(context)

  if (!Array.isArray(config.merges)) return

  const shouldDelete = config.merges.find(c => {
    const value = c.action || c
    return typeof value === 'string' && value.trim().toLowerCase() === DELETE_BRANCH
  })

  if (!shouldDelete) return

  const ref = `heads/${thread.head.ref}`
  return context.github.gitdata.deleteRef(context.repo({ ref }))
}
