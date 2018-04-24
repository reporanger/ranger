const ms = require('ms')

exports.getId = getId
exports.getLabelConfig = getLabelConfig
exports.timeToNumber = timeToNumber
exports.getEffectiveLabel = getEffectiveLabel

function getId (context) {
  const { owner, repo, number } = context.issue()
  return `${owner}:${repo}:${number}`
}

function getLabelConfig (config, labelName) {
  return config.labelConfig[labelName] || config
}

function timeToNumber (time) {
  return isNaN(time) ? ms(time.trim()) : time
}

function getEffectiveLabel (config, labels) {
  return labels
    .reduce(
      (accum, label) => {
        const time = timeToNumber(getLabelConfig(config, label.name).delayTime)

        if (time < accum.time) {
          return { label, time }
        }
        return accum
      },
      { label: null, time: Infinity }
    )
}
