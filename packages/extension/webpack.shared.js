// Copyright 2019-2020 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

const path = require('path');
const webpack = require('webpack');

const CopyPlugin = require('copy-webpack-plugin');
const ManifestPlugin = require('webpack-extension-manifest-plugin');

const pkgJson = require('./package.json');
const manifest = require('./manifest.json');

const packages = [
  'extension',
  'extension-base',
  'extension-chains',
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
        include: /node_modules/,
        test: /\.mjs$/,
        type: 'javascript/auto'
      },
      {
        exclude: /(node_modules)/,
        test: /\.(js|ts|tsx)$/,
        use: [
          {
            loader: require.resolve('babel-loader'),
            options: require('@polkadot/dev/config/babel-config-webpack.cjs')
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
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
        PKG_NAME: JSON.stringify(pkgJson.name),
        PKG_VERSION: JSON.stringify(pkgJson.version)
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
    }), {
      ...alias,
      'react/jsx-runtime': require.resolve('react/jsx-runtime')
    }),
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      path: require.resolve('path-browserify'),
      stream: require.resolve('stream-browserify')
    }
  },
  watch: false
});
