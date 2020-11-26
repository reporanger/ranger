const Filter = require('bad-words')

const { MAINTAINERS, LABEL, DELETE_COMMENT } = require('../constants')
const { executeAction, testPattern } = require('../util')
const getConfig = require('../config')
const { addLabels } = require('../api')

const filter = new Filter()

module.exports = () => async (context) => {
  const config = await getConfig(context)

  const { author_association, body, id: comment_id } = context.payload.comment

  if (!Array.isArray(config.comments)) return

  await Promise.allSettled(
    config.comments.map(async ({ action, pattern, labels } = {}) => {
      if (pattern === '$PROFANITY') {
        if (!filter.isProfane(body)) {
          return
        }
      } else if (pattern && !testPattern(pattern, body)) {
        return
      }

      return executeAction(action, {
        [LABEL]: () => {
          if (!MAINTAINERS.includes(author_association)) return
          if (!labels) return

          return addLabels(context.octokit, context.issue({ labels }))
        },
        [DELETE_COMMENT]: () => context.octokit.issues.deleteComment(context.repo({ comment_id })),
      })
    })
  )
}
