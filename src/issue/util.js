const ms = require('ms')

exports.getId = context => {
  const { owner, repo, number } = context.issue()
  return `${owner}:${repo}:${number}`
}

exports.getLabelConfig = (config, labelName, key) => {
  return config.labelConfig[labelName] || config
}

exports.timeToNumber = time => {
  return isNaN(time) ? ms(time.trim()) : time
}
