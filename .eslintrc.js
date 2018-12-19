module.exports = {
  env: {
    es6: true,
    node: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 10
  },
  plugins: ['import'],
  rules: {
    'import/no-unresolved': 2
  }
}
