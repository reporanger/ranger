const fetch = require('node-fetch')
const analytics = require('./src/analytics')

const t = require('../save/create-token')

fetch('https://api.github.com/app/installations?per_page=100', {
  method: 'GET',
  headers: {
    accept: 'application/vnd.github.machine-man-preview+json',
    'user-agent': 'octokit.js/16.28.1 Node.js/10.16.0 (macOS Mojave; x64)',
    authorization: `Bearer ${t}`
  }
})
  .then(res => res.json())
  .then(installations => {
    return Promise.all(
      installations.map(async i => {
        analytics.identify({
          userId: i.id,
          traits: {
            avatar: i.account.avatar_url,
            name: i.account.login,
            username: i.account.login,
            type: i.account.type
          }
        })
      })
    )
  })
