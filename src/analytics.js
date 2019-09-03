const Windsor = require('windsor-node')

if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'production') {
  let analytics = new Windsor(process.env.WINDSOR_KEY)
  module.exports = {
    identify: analytics.user.bind(analytics),
    track: x => {
      try {
        return analytics.event.call(analytics, typeof x === 'function' ? x() : x)
      } catch (error) {
        console.error(error)
      }
    }
  }
} else {
  module.exports = {
    track: () => {},
    identify: () => {},
    dev: true
  }
}
