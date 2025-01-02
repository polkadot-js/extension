// Copyright 2019-2025 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const ManifestPlugin = require('webpack-extension-manifest-plugin');

const { blake2AsHex } = require('@polkadot/util-crypto');

const pkgJson = require('./package.json');
const manifest = require('./manifest.json');

const EXT_NAME = manifest.short_name;

const packages = [
  'extension',
  'extension-base',
  'extension-chains',
  'extension-dapp',
  'extension-inject',
  'extension-ui'
];

module.exports = (entry, alias = {}) => ({
  context: __dirname,
  devtool: false,
  entry,
  module: {
    rules: [
      {
        exclude: /(node_modules)/,
        test: /\.(ts|tsx)$/,
        use: [
          {
            loader: require.resolve('ts-loader'),
            options: {
              configFile: 'tsconfig.webpack.json',
              transpileOnly: true
            }
          }
        ]
      },
      {
        test: [/\.svg$/, /\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.woff2?$/],
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
    chunkFilename: '[name].js',
    filename: '[name].js',
    globalObject: '(typeof self !== \'undefined\' ? self : this)',
    path: path.join(__dirname, 'build')
  },
  performance: {
    hints: false
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser.js'
    }),
    new webpack.IgnorePlugin({
      contextRegExp: /moment$/,
      resourceRegExp: /^\.\/locale$/
    }),
    new webpack.DefinePlugin({
      'process.env': {
        EXTENSION_PREFIX: JSON.stringify(process.env.EXTENSION_PREFIX || EXT_NAME),
        NODE_ENV: JSON.stringify('production'),
        PORT_PREFIX: JSON.stringify(blake2AsHex(JSON.stringify(manifest), 64))
      }
    }),
    new CopyPlugin({ patterns: [{ from: 'public' }] }),
    new ManifestPlugin({
      config: {
        base: manifest,
        extend: {
          version: pkgJson.version.split('-')[0] // remove possible -beta.xx
        }
      }
    })
  ],
  resolve: {
    alias: packages.reduce((alias, p) => ({
      ...alias,
      [`@polkadot/${p}`]: path.resolve(__dirname, `../${p}/src`)
    }), alias),
    extensionAlias: {
      '.js': ['.ts', '.tsx', '.js']
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      path: require.resolve('path-browserify'),
      stream: require.resolve('stream-browserify')
    }
  },
  watch: false
});
