module.exports = {
  env: {
    es6: true,
    node: true,
    jest: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 10
  },
  plugins: ['import'],
  rules: {
    'import/no-unresolved': 'error',
    'no-duplicate-imports': 'error'
  }
}
