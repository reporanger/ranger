// We might need different ids for different jobs in the future but this works for now
module.exports = function getId(context) {
  const { owner, repo, number } = context.issue()
  return `${owner}:${repo}:${number}`
}
