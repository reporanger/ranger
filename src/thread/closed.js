const { CLOSE, MERGE } = require('../constants')
const { getId } = require('../util')

module.exports = (queue) => (context) => {
  queue.removeJob(getId(context, { action: CLOSE }))
  queue.removeJob(getId(context, { action: MERGE }))
}
