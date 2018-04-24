const Queue = require('bee-queue')
const issue = require('./src/issue')

const queue = new Queue('issues', {
  removeOnSuccess: true,
  removeOnFailure: true,
  activateDelayedJobs: true,
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    db: 0,
    password: process.env.REDIS_PASSWORD,
    options: { password: process.env.REDIS_PASSWORD }
  }
})

module.exports = async robot => {
  // Listeners
  robot.on(['issues.labeled', 'issues.unlabeled'], issue(robot, queue))
  // Kill job when issue is closed
  robot.on('issues.closed', issue.close(robot, queue))

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
