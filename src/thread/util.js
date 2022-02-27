const ms = require('ms')

exports.getLabelConfig = getLabelConfig
exports.timeToNumber = timeToNumber
exports.labelToAction = labelToAction
exports.labelsByAction = labelsByAction

function getLabelConfig(config, labelName, defaultKey = 'close') {
  if (typeof config.labels[labelName] === 'object') {
    return config.labels[labelName]
  }

  if (config.default && config.default[defaultKey]) {
    return config.default[defaultKey]
  }

  return {}
}

function timeToNumber(time, whenNull = 0) {
  if (time == null) {
    return whenNull
  }
  return isNaN(time) ? ms(time.trim()) : Number(time)
}

function labelToAction(config, label) {
  if (typeof config.labels !== 'object') return null
  if (!config.labels[label.name]) return null

  const action =
    typeof config.labels[label.name] === 'string'
      ? config.labels[label.name]
      : config.labels[label.name].action

  return action && action.trim().toLowerCase()
}

function labelsByAction(config, actionName) {
  return (label) => {
    const action = labelToAction(config, label)
    return action && action === actionName
  }
}
