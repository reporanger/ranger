const Filter = require('bad-words')
const { MAINTAINERS, LABEL, DELETE_COMMENT } = require('../constants')
const executeAction = require('../execute-action')
const getConfig = require('../config')

const { addLabels } = require('../api')

function isMaintainer(association) {
  return MAINTAINERS.includes(association)
}

function parseRegex(string) {
  // https://stackoverflow.com/questions/874709/converting-user-input-string-to-regular-expression
  const match = String(string).match(new RegExp('^/(.*?)/([gimy]*)$'))

  if (match && match[1] && match[2]) {
    return new RegExp(match[1], match[2])
  }

  // matches nothing
  return /$^/
}

module.exports = () => async (context) => {
  const config = await getConfig(context)

  const { author_association, body, id: comment_id } = context.payload.comment

  if (!Array.isArray(config.comments)) return

  await Promise.all(
    config.comments.map(async ({ action, pattern, labels } = {}) => {
      if (pattern === '$PROFANITY') {
        if (!new Filter().isProfane(body)) {
          return
        }
      } else {
        if (!body.includes(pattern) && !parseRegex(pattern).test(body)) return
      }

      return executeAction(action, {
        [LABEL]: () => {
          if (!isMaintainer(author_association)) return
          if (!labels) return

          return addLabels(context.github, context.issue({ labels }))
        },
        [DELETE_COMMENT]: () => context.github.issues.deleteComment(context.repo({ comment_id })),
      })
    })
  )
}
