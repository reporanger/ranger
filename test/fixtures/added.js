module.exports = ({
  repositories_added = [
    {
      name: 'ranger'
    }
  ]
}) => ({
  name: 'installation_repositories',
  payload: {
    action: 'added',
    installation: {
      id: 533899,
      account: {
        login: 'ranger'
      }
    },
    repositories_added
  }
})
