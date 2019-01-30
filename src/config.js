const ms = require('ms')
const { Context } = require('probot')

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
    'squash when passing': MERGE,
    'rebase when passing': MERGE,
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

function createEvent(context, owner, repo) {
  context.payload.repository.owner.login = owner
  context.payload.repository.owner.name = owner
  context.payload.repository.name = repo
  return context
}

module.exports = async context => {
  const config = await context.config(CONFIG_FILE, defaultConfig)

  // TODO config.config??
  if (typeof config.config === 'string' && config.config.indexOf('/') > -1) {
    const [owner, repo] = config.config.split('/')
    const globalContext = new Context(createEvent(context, owner, repo), context.github)
    const globalConfig = await globalContext.config(CONFIG_FILE, defaultConfig)

    globalConfig.default = Object.assign({}, defaultConfig.default, globalConfig.default)

    return globalConfig
  }

  // merge defaults
  config.default = Object.assign({}, defaultConfig.default, config.default)

  return config
}

// console.log(require('js-yaml').safeDump(defaultConfig))
