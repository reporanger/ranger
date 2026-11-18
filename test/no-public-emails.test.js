const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')

// Everything under site/ is deployed to reporanger.com, and these docs are rendered publicly on
// GitHub. None of them should expose an @reporanger.com address; point people to /feedback instead.
const PUBLIC_PATHS = [
  'site',
  'README.md',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
  '.github/pull_request_template.md',
]

const COMPANY_EMAIL = /[a-z0-9._%+-]+@(?:[a-z0-9-]+\.)*reporanger\.com/gi

// Undo common ways of disguising "@" and "." so encoded addresses are caught too.
function normalize(text) {
  return text
    .replace(/&#0*64;|&#x0*40;|&commat;|%40|\\u0040|\\x40/gi, '@')
    .replace(/&#0*46;|&#x0*2e;|&period;|%2e/gi, '.')
    .replace(/\s*[[(]\s*at\s*[\])]\s*/gi, '@')
    .replace(/\s*[[(]\s*dot\s*[\])]\s*/gi, '.')
}

function findCompanyEmails(text) {
  return normalize(text).match(COMPANY_EMAIL) || []
}

function listFiles(relPath) {
  const absPath = path.join(ROOT, relPath)
  if (!fs.existsSync(absPath)) return []
  if (fs.statSync(absPath).isDirectory()) {
    return fs.readdirSync(absPath).flatMap((name) => listFiles(path.join(relPath, name)))
  }
  return [relPath]
}

describe('published content', () => {
  test('detects plain and disguised @reporanger.com addresses', () => {
    // Built from parts so this file doesn't itself contain a scrapeable address.
    const user = 'someone'
    const domain = 'reporanger.com'
    const samples = [
      `${user}@${domain}`,
      `<a href="mailto:${user}@${domain}">`,
      `${user}&#64;${domain}`,
      `${user}&#x40;reporanger&#46;com`,
      `mailto:${user}%40${domain}`,
      `${user} [at] reporanger [dot] com`,
      `${user}@mail.${domain}`,
    ]
    samples.forEach((sample) => expect(findCompanyEmails(sample)).toHaveLength(1))

    expect(findCompanyEmails(`https://${domain}/feedback`)).toEqual([])
    expect(findCompanyEmails(`${user}@example.com`)).toEqual([])
  })

  test('does not publish any @reporanger.com email addresses', () => {
    const files = PUBLIC_PATHS.flatMap(listFiles)
    expect(files.length).toBeGreaterThan(0)

    const leaks = files.flatMap((file) =>
      // latin1 keeps binary assets (images, SVGs, fonts, video) searchable byte-for-byte.
      findCompanyEmails(fs.readFileSync(path.join(ROOT, file), 'latin1')).map(
        (email) => `${file}: ${email}`
      )
    )
    expect(leaks).toEqual([])
  })
})
