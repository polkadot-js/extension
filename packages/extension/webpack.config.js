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

function createWebpack ({ alias = {}, context }) {
  const ENV = process.env.NODE_ENV || 'development';
  const isProd = ENV === 'production';

  return {
    context,
    devtool: false,
    entry: {
      background: './src/background.ts',
      content: './src/content.ts',
      extension: './src/extension.ts',
      page: './src/page.ts'
    },
    mode: ENV,
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
            require.resolve('thread-loader'),
            {
              loader: require.resolve('babel-loader'),
              options: require('@polkadot/dev/config/babel-config-cjs.cjs')
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
    node: {
      child_process: 'empty',
      dgram: 'empty',
      fs: 'empty',
      net: 'empty',
      tls: 'empty'
    },
    optimization: {
      concatenateModules: false,
      moduleIds: 'natural',
      occurrenceOrder: false,
      providedExports: false,
      sideEffects: false,
      usedExports: false
    },
    output: {
      chunkFilename: '[name].js',
      filename: '[name].js',
      globalObject: '(typeof self !== \'undefined\' ? self : this)',
      path: path.join(context, 'build')
    },
    performance: {
      hints: false
    },
    plugins: [
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(ENV),
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
    ].filter((entry) => entry),
    resolve: {
      alias,
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    watch: !isProd
  };
}

module.exports = createWebpack({
  alias: packages.reduce((alias, pkg) => {
    alias[`@polkadot/${pkg}/esm`] = path.resolve(__dirname, `../${pkg}/src`);
    alias[`@polkadot/${pkg}`] = path.resolve(__dirname, `../${pkg}/src`);

    return alias;
  }, {}),
  context: __dirname
});
