const issue = require('./src/issue')

module.exports = (robot) => {
  // Your code here
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
