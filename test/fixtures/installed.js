module.exports = ({ action = 'created', repositories }) => ({
  name: 'installation',
  payload: {
    action,
    installation: {
      id: 533899,
      account: {
        login: 'ranger',
        id: 1,
        type: 'User'
      }
    },
    repositories
  }
})
