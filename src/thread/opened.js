/*
 * context.issue() is used for both issues and PRs
 */
const getConfig = require('../config')
const { addLabels } = require('../api')

async function checkIfSponsor(context, after) {
  const thread = context.payload.pull_request || context.payload.issue
  const ownerType = context.payload.repository.owner.type.toLowerCase()

  if (!['user', 'organization'].includes(ownerType)) {
    return false
  }

  const query = `query ($owner: String!, $after: String) { 
    ${ownerType} (login: $owner) {
      sponsorshipsAsMaintainer (first: 100, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          sponsor {
            id
          }
        }
      }
    }
  }`

  const result = await context.octokit.graphql(query, {
    owner: context.repo().owner,
    after,
  })

  const {
    sponsorshipsAsMaintainer: { nodes, pageInfo },
  } = result[ownerType]

  if (nodes.find((node) => node.sponsor.id === thread.user.node_id)) {
    return true
  }

  if (pageInfo.hasNextPage) {
    return checkIfSponsor(context, pageInfo.endCursor)
  }

  return false
}

module.exports = () => async (context) => {
  const config = await getConfig(context)

  if (!Array.isArray(config.sponsor_labels)) {
    return
  }

  if (await checkIfSponsor(context)) {
    addLabels(context.octokit, context.issue({ labels: config.sponsor_labels }))
  }
}
