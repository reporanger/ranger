const { LABEL } = require('../constants')
const getConfig = require('../config')
const { addLabels } = require('../api')

const MAINTAINER_PERMISSIONS = ['admin', 'write']

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
    message: body,
    author: { username }
  } = context.payload.head_commit

  const {
    data: { permission }
  } = await context.github.repos.getCollaboratorPermissionLevel(context.repo({ username }))

  if (!MAINTAINER_PERMISSIONS.includes(permission)) return

  const rules = config.commits

  // TODO confirm this API
  if (!Array.isArray(rules)) return

  await Promise.all(
    rules.map(async ({ action, pattern, labels } = {}) => {
      if (typeof action !== 'string' || action.trim().toLowerCase() !== LABEL) return
      if (!body.includes(pattern) && !parseRegex(pattern).test(body)) return
      if (!labels) return

      // TODO this will not work unless we change the event type to a pull_request
      return addLabels(context.github, context.issue({ labels }))
    })
  )
}
