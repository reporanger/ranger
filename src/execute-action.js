module.exports = function executeAction(action, map) {
  if (typeof action !== 'string') return

  const handler = map[action.trim().toLowerCase()]

  if (handler) {
    return handler()
  }
}
