module.exports = ({ action = 'added', repositories_added }) => ({
  name: 'installation_repositories',
  payload: {
    action,
    installation: {
      id: 42,
      account: {
        login: 'ranger',
        id: 1,
        type: 'User',
      },
    },
    repositories_added,
  },
})
