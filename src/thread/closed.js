const ms = require('ms')

const { CLOSE, MERGE, LOCK } = require('../constants')
const { executeAction, getId } = require('../util')
const getConfig = require('../config')
const analytics = require('../analytics')

module.exports = (queue) => async (context) => {
  queue.removeJob(getId(context, { action: CLOSE }))
  queue.removeJob(getId(context, { action: MERGE }))
  queue.removeJob(getId(context, { action: LOCK }))

  const config = await getConfig(context)

  await Promise.allSettled(
    config.closes.map(async ({ action, delay = '30 days' } = {}) => {
      return executeAction(action, {
        [LOCK]: () => {
          return queue
            .createJob({
              ...context.issue({ installation_id: context.payload.installation.id }),
              action: LOCK,
            })
            .setId(getId(context, { action: CLOSE }))
            .delayUntil(Date.now() + ms(delay))
            .save()
            .then((job) => {
              analytics.track(() => ({
                userId: context.payload.installation.id,
                event: `Lock job created`,
                properties: {
                  ...job.data,
                  id: job.id,
                },
              }))
              return job
            })
        },
      })
    })
  )
}

module.exports.process = (robot) => async ({ data }) => {
  const github = await robot.auth(data.installation_id)
  return await github.issues.lock(data)
}
