const { MAINTAINERS, LABEL } = require('../constants')
const getConfig = require('../config')

function isMaintainer(association) {
  return MAINTAINERS.includes(association)
}

function many(maybeArray) {
  return Array.isArray(maybeArray) ? maybeArray : [maybeArray]
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

const headers = {
  Accept: 'application/vnd.github.symmetra-preview+json'
}

module.exports = () => async context => {
  const config = await getConfig(context)

  const { author_association, body } = context.payload.comment

  if (!isMaintainer(author_association)) return

  if (!Array.isArray(config.comments)) return

  await Promise.all(
    config.comments.map(async ({ action, pattern, labels } = {}) => {
      if (typeof action !== 'string' || action.trim().toLowerCase() !== LABEL) return
      if (!body.includes(pattern) && !parseRegex(pattern).test(body)) return
      if (!labels) return

      return context.github.issues.addLabels(context.issue({ labels: many(labels), headers }))
    })
  )
}
