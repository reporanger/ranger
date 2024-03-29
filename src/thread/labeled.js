/*
 * context.issue() is used for both issues and PRs
 */
const ms = require('ms')

const { getId, executeAction } = require('../util')
const getConfig = require('../config')
const { COMMENT, CLOSE, OPEN } = require('../constants')
const { timeToNumber, getLabelConfig, labelToAction, labelsByAction } = require('./util')
const analytics = require('../analytics')
const { closeIssue } = require('../api')

module.exports = (queue) => async (context) => {
  const thread = context.payload.pull_request || context.payload.issue

  const config = await getConfig(context)

  await Promise.allSettled(
    [CLOSE, OPEN].map((action) => {
      const actionableLabels = thread.labels.filter(labelsByAction(config, action))

      if (!actionableLabels.length) {
        // If actionable labels are removed, delete job for this issue
        return queue.removeJob(getId(context, { action }))
      }
    })
  )

  return Promise.allSettled(
    thread.labels.map((label) => {
      const action = labelToAction(config, label)

      if (!action) return false

      const { delay, message, comment } = getLabelConfig(config, label.name, action)
      const time = timeToNumber(delay, 0)

      function getCommentBody(string) {
        if (!string || string.trim() === 'false') return ''

        return string
          .replace('$DELAY', time == null ? '' : ms(time, { long: true }))
          .replace('$LABEL', label.name)
          .replace('$AUTHOR', thread.user.login)
      }

      async function handleUpdateThread() {
        const ID = getId(context, { action })

        const jobExists = await queue.getJob(ID)
        if (!jobExists) {
          const body = getCommentBody(comment)
          if (body) {
            await context.octokit.issues.createComment(context.issue({ body }))
          }
        }

        const time = timeToNumber(delay, -1)

        if (time >= 0) {
          return queue
            .createJob(
              context.issue({
                installation_id: context.payload.installation.id,
                action,
              })
            )
            .setId(ID)
            .delayUntil(Date.now() + time)
            .save()
            .then((job) => {
              analytics.track(() => ({
                userId: context.payload.installation.id,
                event: `${action} job created`,
                properties: {
                  ...job.data,
                  id: job.id,
                },
              }))
              return job
            })
        }
      }

      return executeAction(action, {
        [CLOSE]() {
          if (thread.state === 'closed') {
            return
          }
          return handleUpdateThread()
        },
        [OPEN]: handleUpdateThread,
        [COMMENT]: async () => {
          const ID = getId(context, { action: `COMMENT:${label.name}` })
          const jobExists = await queue.getJob(ID)

          // Don't create a comment if one already exists
          if (!jobExists) {
            const body = getCommentBody(message)
            if (body) {
              return queue
                .createJob(
                  context.issue({
                    installation_id: context.payload.installation.id,
                    action: COMMENT,
                    body,
                  })
                )
                .setId(ID)
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

  switch (data.action) {
    case COMMENT: {
      return github.issues.createComment({
        ...data,
        number: undefined,
        // TODO change this to just use number
        issue_number: data.issue_number || data.number,
      })
    }
    case OPEN:
    case CLOSE:
    default: {
      return closeIssue(github, {
        ...data,
        number: undefined,
        // TODO change this to just use number
        issue_number: data.issue_number || data.number,
        state: data.action === OPEN ? 'open' : 'closed',
      })
    }
  }
}
