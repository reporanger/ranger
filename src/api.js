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

exports.createLabel = function createLabel(github, data) {
  const { owner, repo, name, color, description } = data

  return github.issues.createLabel({
    owner,
    repo,
    name,
    color,
    description,
    headers: {
      Accept: 'application/vnd.github.symmetra-preview+json'
    }
  })
}
