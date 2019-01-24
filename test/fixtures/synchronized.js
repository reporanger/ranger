module.exports = ({ sender = 'ranger' }) => ({
  name: 'pull_request',
  payload: {
    action: 'synchronize',
    pull_request: {
      number: 4,
      head: {
        sha: 'e829d1a59ce17e24fee7b8ffa42774005acd0240'
      }
    },
    repository: {
      id: 130609983,
      name: 'ranger-test',
      full_name: 'ranger/ranger-test',
      owner: {
        login: 'ranger'
      },
      private: false
    },
    sender: {
      login: sender
    }
  }
})
