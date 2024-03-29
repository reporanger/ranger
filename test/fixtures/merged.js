module.exports = ({ labels = [], base = 'main', repo = { fork: false } } = {}) => ({
  name: 'pull_request',
  payload: {
    action: 'closed',
    number: 3,
    pull_request: {
      number: 3,
      state: 'closed',
      title: 'Update README.md',
      user: { login: 'reporanger' },
      body: '',
      head: {
        label: 'reporanger:ranger-patch-1',
        ref: 'reporanger-patch-1',
        sha: 'b244454d959a49f53aa60768d117d3eeaa0c552d',
        repo,
      },
      base: {
        label: `reporanger:${base}`,
        ref: base,
        sha: '1111s54d959a49f53aa60768d117d3eeaa0c552d',
      },
      labels: labels.map((l, i) => ({
        id: i,
        url: 'https://api.github.com/repos/reporanger/test-issue-bot/labels/bug',
        name: l,
        color: 'd73a4a',
        default: true,
      })),
      author_association: 'COLLABORATOR',
      merged: true,
      merge_commit_sha: 'a244454d959a49f53aa60768d117d3eeaa0c552e',
    },
    repository: {
      name: 'Hello-World',
      full_name: 'Codertocat/Hello-World',
      owner: {
        login: 'Codertocat',
      },
      private: false,
      default_branch: 'main',
    },
    installation: {
      id: 135737,
    },
  },
})
