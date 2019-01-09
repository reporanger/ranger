const { MAINTAINERS } = require('../constants')
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

module.exports = () => async context => {
  const config = await getConfig(context)

  const { author_association, body } = context.payload.comment

  if (isMaintainer(author_association)) {
    if (typeof config.comments === 'object') {
      Object.keys(config.comments).forEach(async key => {
        if (body.includes(key) || parseRegex(key).test(body)) {
          const { labels } = config.comments[key]
          if (labels) {
            await context.github.issues.addLabels(context.issue({ labels: many(labels) }))
          }
        }
      })
    }
  }
}
