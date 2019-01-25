const { LABEL, MAINTAINERS } = require('../constants')
const getConfig = require('../config')
const { addLabels } = require('../api')

function isMaintainer(association) {
  return MAINTAINERS.includes(association)
}

function parseRegex(string) {
  // https://stackoverflow.com/questions/874709/converting-user-input-string-to-regular-expression
  const match = string.match(new RegExp('^/(.*?)/([gimy]*)$'))

  if (match && match[1] && match[2]) {
    return new RegExp(match[1], match[2])
  }

  // matches nothing
  return /$^/
}

module.exports = () => async context => {
  const config = await getConfig(context)

  const {
    head: { sha },
    author_association
  } = context.payload.pull_request

  if (!isMaintainer(author_association)) return

  const {
    data: {
      commit: { message: body }
    }
  } = await context.github.repos.getCommit(context.repo({ sha }))

  // TODO confirm this API before releasing in docs
  const rules = config.commits

  if (!Array.isArray(rules)) return

  await Promise.all(
    rules.map(async ({ action, pattern, labels } = {}) => {
      if (typeof action !== 'string' || action.trim().toLowerCase() !== LABEL) return
      if (!body.includes(pattern) && !parseRegex(pattern).test(body)) return
      if (!labels) return

      return addLabels(context.github, context.issue({ labels }))
    })
  )
}
