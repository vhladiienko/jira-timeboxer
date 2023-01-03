module.exports = {
  root: true,
  parser: 'vue-eslint-parser',
  parserOptions: {
    'sourceType': 'module',
    'parser': 'babel-eslint'
  },
  env: {
    browser: true,
    node: true
  },
  extends: [
    'plugin:vue/recommended',
    'eslint:recommended'
  ],
  globals: {
    __static: true
  },
  plugins: [
    'html'
  ],
  'rules': {
    'arrow-parens': 0,
    'generator-star-spacing': 0,
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    'no-unused-vars': 1,
    'vue/no-v-html': 0
  }
}
