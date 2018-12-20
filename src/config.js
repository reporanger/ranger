const ms = require('ms')

const TIME = process.env.NODE_ENV === 'production' ? '7 days' : '10s'

const CONFIG_FILE = 'tonic.yml'
const DEFAULT_COMMENT = '⚠️ This has been marked to be closed in $CLOSE_TIME.'
const DEFAULT_CLOSE_TIME = ms(TIME)
const DEFAULT_LABELS = {
  duplicate: 'close',
  wontfix: 'close',
  invalid: 'close',
  automerge: 'merge'
}

const defaultConfig = {
  labels: DEFAULT_LABELS,
  delayTime: DEFAULT_CLOSE_TIME,
  comment: DEFAULT_COMMENT
}

exports.CONFIG_FILE = CONFIG_FILE

module.exports = context => context.config(CONFIG_FILE, defaultConfig)
