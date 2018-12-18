const ms = require('ms')

exports.getId = getId
exports.getLabelConfig = getLabelConfig
exports.timeToNumber = timeToNumber
exports.getEffectiveLabel = getEffectiveLabel

function getId(context) {
  const { owner, repo, number } = context.issue()
  return `${owner}:${repo}:${number}`
}

function getLabelConfig(config, labelName) {
  // `true` signifies use default
  if (config.labels[labelName] && config.labels[labelName] !== true) {
    return config.labels[labelName]
  }

  return config
}

function timeToNumber(time) {
  return isNaN(time) ? ms(time.trim()) : Number(time)
}

function getEffectiveLabel(config, labels) {
  return labels.reduce(
    (accum, label) => {
      const time = timeToNumber(getLabelConfig(config, label.name).delayTime)

      if (time < accum.time) {
        return { label, time }
      }

      // if time === Infinity, set the label
      if (time === accum.time && !accum.label) {
        return { label, time }
      }

      return accum
    },
    { label: null, time: Infinity }
  )
}
