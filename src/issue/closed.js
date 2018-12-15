const { getId } = require('./util')

module.exports = queue => context => {
  const ID = getId(context)

  return queue.removeJob(ID)
}
