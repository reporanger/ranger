const issue = require('./src/issue')

module.exports = async robot => {
  // Your code here

  robot.on(
    [
      'issues.labeled',
      'issues.unlabeled'
    ],
    issue(robot)
  )

  robot.on('issues.closed', issue.close)

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
