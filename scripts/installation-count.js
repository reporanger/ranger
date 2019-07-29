const fetch = require('node-fetch')
const t = require('../save/create-token')

fetch('https://api.github.com/app', {
  method: 'GET',
  headers: {
    accept: 'application/vnd.github.machine-man-preview+json',
    'user-agent': 'octokit.js/16.28.1 Node.js/10.16.0 (macOS Mojave; x64)',
    authorization: `Bearer ${t}`
  }
})
  .then(res => res.json())
  .then(d => d.installations_count)
  .then(console.log)
