// We might need different ids for different jobs in the future but this works for now
module.exports = function getId(context, options) {
  const { owner, repo, number, action } = context.issue(options)
  return `${owner}:${repo}:${number}${action ? `:${action}` : ''}`
}
