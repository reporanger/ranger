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
    automerge: MERGE
  },
  comments: [
    {
      action: LABEL,
      pattern: '/duplicate of/i',
      labels: ['duplicate']
    }
  ]
}

exports.CONFIG_FILE = CONFIG_FILE

module.exports = context => context.config(CONFIG_FILE, defaultConfig)
