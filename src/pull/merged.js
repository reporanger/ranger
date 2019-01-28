const getConfig = require('../config')
const { DELETE_BRANCH, TAG } = require('../constants')

module.exports.deleteBranch = () => async context => {
  const thread = context.payload.pull_request

  if (thread.merged !== true) return

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

  const config = await getConfig(context)

  if (!Array.isArray(config.merges)) return

  const shouldCreateTag = config.merges.find(c => {
    const value = c.action || c
    return typeof value === 'string' && value.trim().toLowerCase() === TAG
  })

  if (!shouldCreateTag) return

  const { data } = await context.github.repos.listTags(context.repo({ per_page: 5 }))

  const lastTag = data[0].name

  const match = /(v{0,1})(\d+)\.(\d+)\.(\d+)/.exec(lastTag)

  if (!match) return

  const v = {
    v: match[1] || '',
    major: Number(match[2]),
    minor: Number(match[3]),
    patch: Number(match[4])
  }

  const tag = `${v.v}${v.major}.${v.minor}.${v.patch + 1}`
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
