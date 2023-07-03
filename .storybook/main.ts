/** @type { import('@storybook/react-webpack5').StorybookConfig } */
import webpackConfig from "../packages/extension/webpack.config.cjs";

const config = {
  "stories": [
    "../packages/**/*.mdx",
    "../packages/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-essentials",
    '@storybook/addon-styling'
  ],
  "framework": {
    "name": "@storybook/react-webpack5",
    "options": {}
  },
  "docs": {
    "autodocs": "tag"
  },
  staticDirs: ['../packages/extension/public'],
  webpackFinal: async (config) => {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve.alias,
          ...webpackConfig.resolve.alias,
          '@polkadot/hw-ledger': require.resolve('./__mocks__/@polkadot/hw-ledger.js'),
          '../messaging': require.resolve('./__mocks__/messaging'),
          '../../messaging': require.resolve('./__mocks__/messaging'),
          '../../../messaging': require.resolve('./__mocks__/messaging'),
        },
      },
    };
  },
  env: (config) => ({
    ...config,
    EXTENSION_PREFIX: 'STORYBOOK-PREFIX',
  }),
};

export default config;
