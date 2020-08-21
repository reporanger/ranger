const r = require('rexrex')
const { LABEL, MAINTAINERS } = require('../constants')
const getConfig = require('../config')
const { addLabels } = require('../api')

function isMaintainer(association) {
  return MAINTAINERS.includes(association)
}

const MATCHES_NOTHING = r.and(r.matchers.END, r.matchers.START)

function parseRegex(string) {
  // https://stackoverflow.com/questions/874709/converting-user-input-string-to-regular-expression
  const match = String(string).match(new RegExp('^/(.*?)/([gimy]*)$'))

  if (match && match[1] && match[2]) {
    return r.regex(match[1], match[2])
  }

  return r.regex(MATCHES_NOTHING)
}

module.exports = () => async (context) => {
  const config = await getConfig(context)

  const {
    head: { sha },
    author_association,
  } = context.payload.pull_request

  if (!isMaintainer(author_association)) return

  const {
    data: {
      commit: { message: body },
    },
  } = await context.github.repos.getCommit(context.repo({ ref: sha }))

  // TODO confirm this API before releasing in docs
  const rules = config.commits

  if (!Array.isArray(rules)) return

  await Promise.all(
    rules.map(async ({ action, pattern, user, labels } = {}) => {
      if (typeof action !== 'string' || action.trim().toLowerCase() !== LABEL) return
      if (!labels) return

      if (pattern) {
        if (!body.includes(pattern) && !parseRegex(pattern).test(body)) return
      }

      if (user) {
        if (user.toLowerCase() !== context.payload.pull_request.user.login.toLowerCase()) {
          return
        }
      }

      return addLabels(context.github, context.issue({ labels }))
    })
  )
}
