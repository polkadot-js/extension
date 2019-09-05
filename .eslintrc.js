const base = require('@polkadot/dev-react/config/eslint');

module.exports = {
  ...base,
  parserOptions: {
    extraFileExtensions: ['*.d.ts'],
    project: [
      './tsconfig.eslint.json'
    ]
  }
};
