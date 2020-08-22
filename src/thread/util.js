const ms = require('ms')

exports.getLabelConfig = getLabelConfig
exports.timeToNumber = timeToNumber
exports.getEffectiveLabel = getEffectiveLabel
exports.getLabelByAction = getLabelByAction

function getLabelConfig(config, labelName, defaultKey = 'close') {
  if (typeof config.labels[labelName] === 'object') {
    return config.labels[labelName]
  }

  if (config.default && config.default[defaultKey]) {
    return config.default[defaultKey]
  }

  return {}
}

function timeToNumber(time, whenNull = Infinity) {
  if (time == null) {
    return whenNull
  }
  return isNaN(time) ? ms(time.trim()) : Number(time)
}

function getEffectiveLabel(config, labels) {
  return labels.reduce(
    (accum, label) => {
      const time = timeToNumber(getLabelConfig(config, label.name).delay, Infinity)

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

function getLabelByAction(config, actionName) {
  return (label) => {
    if (typeof config.labels !== 'object') return false
    if (!config.labels[label.name]) return false

    const action =
      typeof config.labels[label.name] === 'string'
        ? config.labels[label.name]
        : config.labels[label.name].action

    return action && action.trim().toLowerCase() === actionName
  }
}
