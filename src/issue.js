const ms = require('ms')

const DEFAULT_CLOSE_TIME = ms('7 days')

const closableLabels = new Set([
  'duplicate',
  'wontfix',
  'invalid'
])

const shouldBeClosed = issues => issues.some(i => closableLabels.has(i.name.toLowerCase()))

module.exports = robot => async (context) => {
  robot.debug(context)

  const owner = context.payload.repository.owner.login
  const repo = context.payload.repository.name

  const withClosableLabels = await Promise.all(
    context.payload.issue.labels
      .filter(l => closableLabels.has(l.name))
      .map(({ name }) => context.github.issues.getLabel({
        owner,
        repo,
        name,
        headers: {
          'Accept': 'application/vnd.github.symmetra-preview+json'
        }
      }))
  ).then(arr => arr.map(_ => _.data))

  const time = Math.min(...(
    withClosableLabels
      .map(l => l.description)
      .map(d => {
        const match = d.match(/\[(.+)\]/)
        return match && match[1] && ms(match[1]) || DEFAULT_CLOSE_TIME
      })
  ))

  console.log(ms(time));
}
