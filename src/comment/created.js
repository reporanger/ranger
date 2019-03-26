const { MAINTAINERS, LABEL, DELETE_COMMENT } = require('../constants')
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

  const { author_association, body, id: comment_id } = context.payload.comment

  if (!Array.isArray(config.comments)) return

  await Promise.all(
    config.comments.map(async ({ action, pattern, labels } = {}) => {
      if (typeof action !== 'string') return

      switch (action.trim().toLowerCase()) {
        case LABEL: {
          if (!isMaintainer(author_association)) return

          if (!body.includes(pattern) && !parseRegex(pattern).test(body)) return
          if (!labels) return

          return addLabels(context.github, context.issue({ labels }))
        }

        case DELETE_COMMENT: {
          if (!body.includes(pattern) && !parseRegex(pattern).test(body)) return

          return context.github.issues.deleteComment(context.repo({ comment_id }))
        }
      }
    })
  )
}
