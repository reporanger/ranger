exports.installed = (robot, airtable) => async ({
  payload: { installation, repositories, repositories_added }
}) => {
  const {
    account: { login, type }
  } = installation

  const repos = repositories_added || repositories

  try {
    await Promise.all(
      repos.map(repo =>
        airtable('installed').create({ login, type, repo: repo.full_name, private: repo.private })
      )
    )
  } catch (e) {
    robot.log.error(e)
  }
}
