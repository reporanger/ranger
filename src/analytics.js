const Airtable = require('airtable')

const BASE = 'appobbLH4DyF1gHd2'

const init = () => {
  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'production') {
    return new Airtable().base(BASE)
  }
}

const installed = ({ robot, airtable }) => async ({
  payload: { installation, repositories, repositories_added }
}) => {
  const {
    id: installationId,
    account: { login, type }
  } = installation

  const repos = repositories_added || repositories

  try {
    await Promise.all(
      repos.map(repo =>
        airtable('installed').create({
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

module.exports = robot => {
  const airtable = init()

  if (airtable) {
    robot.on(
      ['installation.created', 'installation_repositories.added'],
      installed({ robot, airtable })
    )
  }

  return { airtable }
}
