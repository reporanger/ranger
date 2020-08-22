const r = require('rexrex')

// We might need different ids for different jobs in the future but this works for now
module.exports.getId = function getId(context, options) {
  const { owner, repo, number, action } = context.issue(options)
  return `${owner}:${repo}:${number}${action ? `:${action}` : ''}`
}

module.exports.executeAction = function executeAction(action, map) {
  if (typeof action !== 'string') return

  const handler = map[action.trim().toLowerCase()]

  if (handler) {
    return handler()
  }
}

const MATCHES_NOTHING = r.and(r.matchers.END, r.matchers.START)
function parseRegex(string) {
  // https://stackoverflow.com/questions/874709/converting-user-input-string-to-regular-expression
  const match = String(string).match(new RegExp('^/(.*?)/([gimy]*)$'))

  if (match && match[1] && match[2]) {
    return new RegExp(match[1], match[2])
  }

  // matches nothing
  return r.regex(MATCHES_NOTHING)
}

module.exports.testPattern = function testPattern(pattern, string) {
  return string.includes(pattern) || parseRegex(pattern).test(string)
}
