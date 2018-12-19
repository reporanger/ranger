const getId = require('../get-job-id')

module.exports = queue => context => {
  const ID = getId(context)

  return queue.removeJob(ID)
}
