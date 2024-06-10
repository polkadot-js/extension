// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

const general = require('@polkadot/dev/config/babel-general.cjs');
const plugins = require('@polkadot/dev/config/babel-plugins.cjs');
const presets = require('@polkadot/dev/config/babel-presets.cjs');
const dotenv = require('dotenv');

module.exports = {
  ...general,
  plugins: plugins(false, false),
  presets: presets(false)
};

const path = require('path');
const webpack = require('webpack');

const CopyPlugin = require('copy-webpack-plugin');

const pkgJson = require('./package.json');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const args = process.argv.slice(2);
let mode = 'production';

if (args) {
  args.forEach((p, index) => {
    if (p === '--mode') {
      mode = args[index + 1] || mode;
    }
  });
}

const envPath = mode === 'production' ? '.env' : '.env.local';

dotenv.config({ path: `../../${envPath}` });

console.log('You are using ' + mode + ' mode.');

const packages = [
  'extension-base',
  'extension-chains',
  'extension-dapp',
  'extension-inject',
  'extension-koni',
  'extension-web-ui'
];

const polkadotDevOptions = require('@polkadot/dev/config/babel-config-webpack.cjs');
// Overwrite babel babel config from polkadot dev

const _additionalEnv = {
  TRANSAK_API_KEY: JSON.stringify(process.env.TRANSAK_API_KEY),
  COINBASE_PAY_ID: JSON.stringify(process.env.COINBASE_PAY_ID),
  NFT_MINTING_HOST: JSON.stringify(process.env.NFT_MINTING_HOST),
  TRANSAK_TEST_MODE: JSON.stringify(false),
  BANXA_TEST_MODE: JSON.stringify(false),
  INFURA_API_KEY: JSON.stringify(process.env.INFURA_API_KEY),
  INFURA_API_KEY_SECRET: JSON.stringify(process.env.INFURA_API_KEY_SECRET)
};

const createConfig = (entry, alias = {}, useSplitChunk = false) => {
  const result = {
    context: __dirname,
    devtool: false,
    entry,
    devServer: {
      host: '0.0.0.0',
      allowedHosts: 'all',
      static: {
        directory: path.join(__dirname, 'public')
      },
      hot: false,
      liveReload: false,
      webSocketServer: false,
      historyApiFallback: true,
      compress: true,
      port: 9000
    },
    module: {
      rules: [
        {
          exclude: /(node_modules\/(?!(@equilab|@subwallet|@polkadot\/rpc-core)).*)/,
          test: /\.(js|mjs|ts|tsx)$/,
          use: [
            {
              loader: require.resolve('babel-loader'),
              options: polkadotDevOptions
            }
          ]
        },
        {
          test: [/\.svg$/, /\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.woff2?$/, /\.css?$/],
          use: [
            {
              loader: require.resolve('url-loader'),
              options: {
                esModule: false,
                limit: 10000,
                name: 'static/[name].[ext]'
              }
            }
          ]
        }
      ]
    },
    output: {
      chunkFilename: '[name]-[contenthash].js',
      filename: '[name]-[contenthash].js',
      globalObject: '(typeof self !== \'undefined\' ? self : this)',
      path: path.join(__dirname, 'build'),
      publicPath: '/'
    },
    performance: {
      hints: false
    },
    plugins: [
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser.js'
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser'
      }),
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(mode),
          PKG_NAME: JSON.stringify(pkgJson.name),
          PKG_VERSION: JSON.stringify(pkgJson.version),
          PKG_BUILD_NUMBER: JSON.stringify(pkgJson.buildNumber),
          TARGET_ENV: JSON.stringify('webapp'),
          BRANCH_NAME: JSON.stringify(process.env.BRANCH_NAME),
          ID_PREFIX: JSON.stringify('sw-app-'),
          ..._additionalEnv
        }
      }),
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, './package.json'),
            to: path.resolve(__dirname, './build/package.json')
          },
          {
            from: path.resolve(__dirname, './public'),
            to: path.resolve(__dirname, './build/'),
            globOptions: {
              ignore: ['**/index.html']
            }
          }
        ]
      }),
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: 'public/index.html',
        meta: { 'app-version': pkgJson.buildNumber }
      })
    ],
    resolve: {
      alias: packages.reduce((alias, p) => ({
        ...alias,
        [`@subwallet/${p}`]: path.resolve(__dirname, `../${p}/src`)
      }), {
        ...alias,
        'react/jsx-runtime': require.resolve('react/jsx-runtime')
      }),
      extensions: ['.js', '.mjs', '.jsx', '.ts', '.tsx'],
      fallback: {
        crypto: require.resolve('crypto-browserify'),
        path: require.resolve('path-browserify'),
        stream: require.resolve('stream-browserify'),
        os: require.resolve('os-browserify/browser'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        assert: require.resolve('assert'),
        zlib: false,
        url: false
      }
    },
    watch: false,
    experiments: {
      asyncWebAssembly: true
    }
  };

  result.optimization = {
    splitChunks: {
      chunks: 'all',
      maxSize: 2000000,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10
        },
        default: {
          priority: -20,
          reuseExistingChunk: true
        }
      }
    }
  };

  return result;
};

module.exports = createConfig({
  webapp: ['./src/fallback.ts', './src/webRunner.ts'],
  main: './src/index.tsx'
}, {
  'manta-extension-sdk': './manta-extension-sdk-empty.ts'
}, true);
