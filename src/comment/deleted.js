const { CLOSE, MERGE, OPEN, APP_USER_ID } = require('../constants')
const { getId } = require('../util')

module.exports = (queue) => (context) => {
  if (context.payload.comment.user.id === APP_USER_ID) {
    queue.removeJob(getId(context, { action: CLOSE }))
    queue.removeJob(getId(context, { action: OPEN }))
    queue.removeJob(getId(context, { action: MERGE }))
  }
}
