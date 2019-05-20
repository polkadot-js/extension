// Copyright 2019 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const { WebpackPluginServe } = require('webpack-plugin-serve');

const packages = [
  'extension-ui'
];

const DEFAULT_THEME = 'polkadot';

function createWebpack ({ alias = {}, context }) {
  const pkgJson = require(path.join(context, 'package.json'));
  const ENV = process.env.NODE_ENV || 'development';
  const isProd = ENV === 'production';

  return {
    context,
    devtool: 'source-map',
    entry: {
      background: './src/background/index.ts',
      inject: './src/inject/index.ts',
      loader: './src/loader.ts',
      popup: `./src/views/popup.ts`
    },
    mode: ENV,
    output: {
      chunkFilename: `[name].js`,
      filename: `[name].js`,
      globalObject: `(typeof self !== 'undefined' ? self : this)`,
      path: path.join(context, 'build')
    },
    resolve: {
      alias,
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    module: {
      rules: [
        {
          test: /\.(js|ts|tsx)$/,
          exclude: /(node_modules)/,
          use: [
            require.resolve('thread-loader'),
            {
              loader: require.resolve('babel-loader'),
              options: require('@polkadot/dev-react/config/babel')
            }
          ]
        },
        {
          test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
          use: [
            {
              loader: require.resolve('url-loader'),
              options: {
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
    performance: {
      hints: false
    },
    plugins: [
      isProd
        ? null
        : new WebpackPluginServe({
          port: 3001,
          static: path.join(process.cwd(), '/build')
        }),
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(ENV),
          VERSION: JSON.stringify(pkgJson.version),
          UI_MODE: JSON.stringify(process.env.UI_MODE || 'full'),
          UI_THEME: JSON.stringify(process.env.UI_THEME || DEFAULT_THEME),
          WS_URL: JSON.stringify(process.env.WS_URL)
        }
      }),
      new CopyWebpackPlugin([{ from: 'public' }])
    ].filter((entry) => entry),
    watch: !isProd
  };
}

module.exports = createWebpack({
  context: __dirname,
  alias: packages.reduce((alias, pkg) => {
    alias[`@polkadot/${pkg}`] = path.resolve(__dirname, `../${pkg}/src`);

    return alias;
  }, {})
});
