module.exports = ({ action = 'synchronize', author_association = 'COLLABORATOR' } = {}) => ({
  name: 'pull_request',
  payload: {
    action,
    pull_request: {
      number: 4,
      head: {
        sha: 'e829d1a59ce17e24fee7b8ffa42774005acd0240'
      },
      author_association
    },
    repository: {
      id: 130609983,
      name: 'ranger-test',
      full_name: 'ranger/ranger-test',
      owner: {
        login: 'ranger'
      },
      private: false
    }
  }
})
