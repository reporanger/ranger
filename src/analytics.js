exports.installed = (robot, airtable) => async ({
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
