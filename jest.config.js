// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require('@polkadot/dev/config/jest');

module.exports = Object.assign({}, config, {
  moduleNameMapper: {
    '@polkadot/extension-(ui)(.*)$': '<rootDir>/packages/extension-$1/src/$2',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'empty/object',
    '\\.(css|less)$': 'empty/object'
  },
  modulePathIgnorePatterns: [
    '<rootDir>/packages/extension/build',
    '<rootDir>/packages/extension-ui/build'
  ]
});
