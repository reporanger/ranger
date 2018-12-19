const { APP_USER_ID } = require('../constants')
const getId = require('../get-job-id')

module.exports = queue => context => {
  const ID = getId(context)

  if(context.payload.comment.user.id === APP_USER_ID) {
    return queue.removeJob(ID)
  }
}
