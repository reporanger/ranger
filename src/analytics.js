const Analytics = require('analytics-node')

if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'production') {
  module.exports = new Analytics(process.env.SEGMENT_WRITE_KEY)
} else {
  module.exports = {
    track: () => {},
    identify: () => {},
    def: true
  }
}
