const issue = require('./src/issue')

module.exports = async robot => {
  // Your code here
  issue.queue.on('succeeded', (job, result) => {
    robot.log.debug(`Job ${job.id} succeeded with result: ${JSON.stringify(result, null, 2)}`)
  })

  issue.queue.on('failed', (job, err) => {
    robot.log.error(`Job ${job.id} failed with error ${err.message}`)
  })

  robot.on(
    [
      'issues.opened',
      'issues.edited',
      'issues.labeled',
      'issues.unlabeled'
    ],
    issue(robot)
  )

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
