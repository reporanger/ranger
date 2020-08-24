/*
 * context.issue() is used for both issues and PRs
 */
const ms = require('ms')

const { getId, executeAction } = require('../util')
const getConfig = require('../config')
const { COMMENT } = require('../constants')
const { timeToNumber, getLabelConfig, labelToAction } = require('./util')
const analytics = require('../analytics')

module.exports = (queue) => async (context) => {
  const thread = context.payload.pull_request || context.payload.issue

  const config = await getConfig(context)

  if (typeof config.labels !== 'object') return false

  const ID = getId(context, { action: COMMENT })

  await Promise.allSettled(
    thread.labels.map((label) => {
      const action = labelToAction(config, label)

      if (!action) return false

      return executeAction(action, {
        [COMMENT]: async () => {
          const jobId = `${ID}:${label.name}`
          const jobExists = await queue.getJob(jobId)

          // Don't create a comment if one already exists
          if (!jobExists) {
            const { message, delay } = getLabelConfig(config, label.name, COMMENT)

            const time = delay ? timeToNumber(delay, 0) : 0

            if (message && message.trim() !== 'false') {
              const body = message
                .replace('$LABEL', label.name)
                .replace('$DELAY', ms(time, { long: true }))
                .replace('$AUTHOR', thread.user.login)

              await queue
                .createJob(
                  context.repo({
                    installation_id: context.payload.installation.id,
                    action: COMMENT,
                    body,
                    issue_number: thread.number,
                  })
                )
                .setId(jobId)
                .delayUntil(Date.now() + time)
                .save()
                .then((job) => {
                  analytics.track(() => ({
                    userId: context.payload.installation.id,
                    event: `Comment job created`,
                    properties: {
                      ...job.data,
                      id: job.id,
                    },
                  }))
                  return job
                })
            }
          }
        },
      })
    })
  )
}

module.exports.process = (robot) => async ({ data /* id */ }) => {
  const github = await robot.auth(data.installation_id)
  return await github.issues.createComment(data)
}
