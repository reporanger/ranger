const { Sema } = require('async-sema')
const fetch = require('node-fetch')

const analytics = require('../src/analytics')
const t = require('../save/create-token')

const s = new Sema(
  1, // Allow 4 concurrent async calls
  {
    capacity: 100 // Prealloc space for 100 tokens
  }
)

async function fetchData(login) {
  await s.acquire()
  try {
    await new Promise(res => setTimeout(res, 10000))
    return await fetch(`https://api.github.com/users/${login}`, {
      method: 'GET',
      headers: {
        accept: 'application/vnd.github.machine-man-preview+json',
        'user-agent': 'octokit.js/16.28.1 Node.js/10.16.0 (macOS Mojave; x64)'
      }
    }).then(res => res.json())
  } finally {
    s.release()
  }
}

fetch('https://api.github.com/app/installations?per_page=100', {
  method: 'GET',
  headers: {
    accept: 'application/vnd.github.machine-man-preview+json',
    'user-agent': 'octokit.js/16.28.1 Node.js/10.16.0 (macOS Mojave; x64)',
    authorization: `Bearer ${t}`
  }
})
  .then(res => res.json())
  .then(async installations => {
    return Promise.all(
      installations.map(async i => {
        const user = await fetchData(i.account.login)
        const email = user.email
        console.log(user)
        analytics.identify({
          userId: i.id,
          traits: {
            avatar: i.account.avatar_url,
            name: i.account.login,
            username: i.account.login,
            type: i.account.type,
            email
          }
        })
      })
    )
  })
