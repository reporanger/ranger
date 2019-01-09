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
    await Promise.all(
      repos.map(repo =>
        exports.airtable('installed').create({
          login,
          type,
          repo: repo.name,
          private: repo.private,
          installationId
        })
      )
    )
  } catch (e) {
    robot.log.error(e)
  }
}
