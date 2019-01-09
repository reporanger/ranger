const ms = require('ms')

const { CLOSE, MERGE } = require('./constants')

const TIME = process.env.NODE_ENV === 'production' ? '7 days' : '10s'

const CONFIG_FILE = 'ranger.yml'

const DEFAULT_BEHAVIOR = {
  stale: {
    labels: {
      stale: CLOSE
    }
  },
  duplicate: {
    labels: {
      duplicate: CLOSE
    },
    comments: {
      action: 'label',
      pattern: '/duplicate of/i',
      labels: ['duplicate']
    }
  },
  wontfix: {
    labels: {
      wontfix: CLOSE
    }
  },
  invalid: {
    labels: {
      invalid: CLOSE
    }
  },
  approved: {
    labels: {
      approved: MERGE
    }
  },
  'merge when passing': {
    labels: {
      'merge when passing': MERGE
    }
  }
}

const INCLUDE_DEFAULTS = 'include defaults'
const defaultConfig = {
  [INCLUDE_DEFAULTS]: ['wontfix', 'invalid', 'merge when passing'],
  default: {
    [CLOSE]: {
      comment: '⚠️ This has been marked to be closed in $DELAY.',
      delay: ms(TIME)
    }
  },
  labels: {},
  comments: []
}

exports.CONFIG_FILE = CONFIG_FILE

module.exports = async context => {
  const config = await context.config(CONFIG_FILE, defaultConfig)

  if (!config.labels) {
    config.labels = {}
  }

  if (!config.comments) {
    config.comments = []
  }

  const presets = config[INCLUDE_DEFAULTS]

  if (Array.isArray(presets)) {
    presets
      .filter(_ => typeof _ === 'string')
      .forEach(labelName => {
        if (!config.labels[labelName]) {
          const defaultBehavior = DEFAULT_BEHAVIOR[labelName]
          Object.assign(config.labels, defaultBehavior.labels)
          if (Array.isArray(config.comments)) {
            config.comments.push(...(defaultBehavior.comments || []))
          }
        }
      })
  }

  // merge defaults
  Object.assign(config.default, defaultConfig.default, config.default)

  return config
}
