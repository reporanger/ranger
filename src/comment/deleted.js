const { CLOSE, MERGE, APP_USER_ID } = require('../constants')
const getId = require('../get-job-id')

module.exports = queue => context => {
  if (context.payload.comment.user.id === APP_USER_ID) {
    queue.removeJob(getId(context, { action: CLOSE }))
    queue.removeJob(getId(context, { action: MERGE }))
  }
}
