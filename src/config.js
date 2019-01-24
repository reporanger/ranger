const ms = require('ms')

const { CLOSE, MERGE, LABEL } = require('./constants')

const TIME = process.env.NODE_ENV === 'production' ? '7 days' : '10s'

const CONFIG_FILE = 'ranger.yml'

const defaultConfig = {
  default: {
    [CLOSE]: {
      comment: '⚠️ This has been marked to be closed in $DELAY.',
      delay: ms(TIME)
    }
  },
  labels: {
    duplicate: CLOSE,
    wontfix: CLOSE,
    invalid: CLOSE,
    'merge when passing': MERGE
  },
  comments: [],
  commits: [
    {
      action: LABEL,
      pattern: '/merge when passing/i',
      labels: ['merge when passing']
    }
  ]
}

exports.CONFIG_FILE = CONFIG_FILE

module.exports = async context => {
  const config = await context.config(CONFIG_FILE, defaultConfig)

  // merge defaults
  Object.assign(config.default, defaultConfig.default, config.default)

  return config
}
