exports.closeIssue = function closeIssue(github, data) {
  const { owner, repo, number, state = 'closed' } = data

  return github.issues
    .update({
      owner,
      repo,
      number,
      state
    })
    .then(_ => _.data)
}

exports.getPullRequest = function getPullRequest(github, data) {
  const { owner, repo, number } = data

  return github.pullRequests
    .get({
      owner,
      repo,
      number
    })
    .then(_ => _.data)
}
