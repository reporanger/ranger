const getConfig = require('../config')
const { DELETE_BRANCH, TAG } = require('../constants')

module.exports.deleteBranch = () => async context => {
  const thread = context.payload.pull_request

  if (thread.merged !== true) return
  // Don't delete branches from forks
  if (thread.head.repo.fork === true) return

  const config = await getConfig(context)

  if (!Array.isArray(config.merges)) return

  const shouldDelete = config.merges.find(c => {
    const value = c.action || c
    return typeof value === 'string' && value.trim().toLowerCase() === DELETE_BRANCH
  })

  if (!shouldDelete) return

  const ref = `heads/${thread.head.ref}`
  return context.github.gitdata.deleteRef(context.repo({ ref }))
}

module.exports.createTag = () => async context => {
  const thread = context.payload.pull_request

  if (thread.merged !== true) return

  // Only create tags on "master"
  if (thread.base.ref !== context.payload.repository.default_branch) return

  const isMajor = thread.labels.find(({ name }) => name.toLowerCase().includes('major'))
  const isMinor = thread.labels.find(({ name }) => name.toLowerCase().includes('minor'))
  const isPatch = thread.labels.find(({ name }) => name.toLowerCase().includes('patch'))

  if (!(isMajor || isMinor || isPatch)) {
    const config = await getConfig(context)
    const isAutoPatch =
      Array.isArray(config.merges) &&
      config.merges.find(c => {
        const value = c.action || c
        return typeof value === 'string' && value.trim().toLowerCase() === TAG
      })

    if (!isAutoPatch) return
  }

  const { data } = await context.github.repos.listTags(context.repo({ per_page: 1 }))

  const previousTag = data && data[0] && data[0].name
  if (!previousTag) return

  const match = /(v{0,1})(\d+)\.(\d+)\.(\d+)/.exec(previousTag)

  if (!match) return

  const v = {
    v: match[1] || '',
    major: Number(match[2]),
    minor: Number(match[3]),
    patch: Number(match[4])
  }

  let tag
  if (isMajor) {
    tag = `${v.v}${v.major + 1}.0.0`
  } else if (isMinor) {
    tag = `${v.v}${v.major}.${v.minor + 1}.0`
  } else {
    tag = `${v.v}${v.major}.${v.minor}.${v.patch + 1}`
  }

  const sha = thread.merge_commit_sha

  await context.github.gitdata.createTag(
    context.repo({
      tag,
      type: 'commit',
      message: `${thread.title} (#${thread.number})`,
      object: sha
    })
  )

  await context.github.gitdata.createRef(
    context.repo({
      ref: `refs/tags/${tag}`,
      sha
    })
  )
}
