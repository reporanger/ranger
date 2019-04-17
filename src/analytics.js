const Airtable = require('airtable')

const BASE = 'appobbLH4DyF1gHd2'

if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'production') {
  exports.airtable = new Airtable().base(BASE)
}

exports.installed = robot => async ({
  payload: { installation, repositories, repositories_added }
}) => {
  if (!exports.airtable) return

  const {
    id: installationId,
    account: { login, type }
  } = installation

  const repos = repositories_added || repositories

  try {
    await exports.airtable('installed').create({
      login,
      type,
      repos: repos.map(({ name }) => name).join(),
      repoCount: repos.length,
      privateRepoCount: repos.filter(r => r.private).length,
      installationId
    })
  } catch (e) {
    robot.log.error(e)
  }
}
