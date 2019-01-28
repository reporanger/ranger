module.exports = () => ({
  name: 'pull_request',
  payload: {
    action: 'closed',
    number: 3,
    pull_request: {
      number: 3,
      state: 'closed',
      title: 'Update README.md',
      user: { login: 'mfix22' },
      body: '',
      head: {
        label: 'dawnlabs:mfix22-patch-1',
        ref: 'mfix22-patch-1',
        sha: 'b244454d959a49f53aa60768d117d3eeaa0c552d'
      },
      author_association: 'COLLABORATOR',
      merged: true,
      merge_commit_sha: 'a244454d959a49f53aa60768d117d3eeaa0c552e'
    },
    repository: {
      name: 'Hello-World',
      full_name: 'Codertocat/Hello-World',
      owner: {
        login: 'Codertocat'
      },
      private: false
    }
  }
})
