module.exports = ({
  repositories = [
    {
      name: 'ranger'
    }
  ]
}) => ({
  name: 'installation',
  payload: {
    action: 'created',
    installation: {
      id: 533899,
      account: {
        login: 'ranger'
      }
    },
    repositories
  }
})
