const ms = require('ms')

exports.getLabelConfig = getLabelConfig
exports.timeToNumber = timeToNumber
exports.getEffectiveLabel = getEffectiveLabel

function getLabelConfig(config, labelName) {
  if (typeof config.labels[labelName] === 'object') {
    return config.labels[labelName]
  }

  // TODO return config.default here
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
