// const CracoLessPlugin = require("craco-less");
const CracoAlias = require("craco-alias")
const polkadotDevOptions = require("@polkadot/dev/config/babel-config-webpack.cjs")
const webpack = require("webpack")
const path = require("path")
// const plugins = require("@polkadot/dev/config/babel-plugins.cjs")
// const presets = require("@polkadot/dev/config/babel-presets.cjs")

const CopyPlugin = require("copy-webpack-plugin")

const pkgJson = require("./package.json")
const HtmlWebpackPlugin = require("html-webpack-plugin")

const args = process.argv.slice(2)
// let mode = "production"
let mode = "development"

if (args) {
  args.forEach((p, index) => {
    if (p === "--mode") {
      mode = args[index + 1] || mode
    }
  })
}

console.log("You are using " + mode + " mode.")

module.exports = {
  // output: {
  //   libraryTarget: "umd",
  // },
  plugins: [
    {
      plugin: CracoAlias,
      options: {
        source: "tsconfig",
        // baseUrl SHOULD be specified
        // plugin does not take it from jsconfig
        baseUrl: "./src",
        tsConfigPath: "./tsconfig.paths.json",
      },
    },
  ],

  babel: {
    presets: ["@babel/preset-react", "@babel/preset-env"],
    plugins: [
      "@babel/plugin-proposal-logical-assignment-operators",
      "babel-plugin-styled-components",
    ],
  },
  webpack: {
    context: __dirname,
    devtool: false,
    entry: {
      fallback: "./src/fallback.ts",
      main: "./src/index.tsx",
      "webapp-runner": "./src/webRunner.ts",
    },
    devServer: {
      static: {
        directory: path.join(__dirname, "build"),
      },
      hot: true,
      liveReload: true,
      webSocketServer: false,
      compress: true,
      port: 9000,
      historyApiFallback: true,
    },
    configure: {
      // entry: {
      //   main: "./src/index.tsx",
      //   // fallback: "./src/fallback.ts",
      //   "web-runner": "./src/webRunner.ts",
      // },
      resolve: {
        fallback: {
          crypto: require.resolve("crypto-browserify"),
          path: require.resolve("path-browserify"),
          stream: require.resolve("stream-browserify"),
          os: require.resolve("os-browserify/browser"),
          http: require.resolve("stream-http"),
          https: require.resolve("https-browserify"),
          assert: require.resolve("assert"),
          buffer: require.resolve("buffer"),
          zlib: false,
          url: false,
        },
        extensions: [".js", ".jsx", ".ts", ".tsx", ".mjs"],
        modules: [path.resolve(__dirname, "src"), "node_modules"],
      },
      module: {
        rules: [
          {
            exclude:
              /(node_modules\/(?!(@equilab|@subwallet|@polkadot\/rpc-core)).*)/,
            test: /\.(js|cjs|ts|tsx)$/,
            use: [
              {
                loader: require.resolve("babel-loader"),
                options: polkadotDevOptions,
              },
            ],
          },
          {
            test: /\.(m?js|c?js)/,
            resolve: {
              fullySpecified: false,
            },
          },
          {
            test: /\.css$/i,
            use: ["style-loader", "css-loader"],
          },
          {
            test: [
              /\.svg$/,
              /\.bmp$/,
              /\.gif$/,
              /\.jpe?g$/,
              /\.png$/,
              /\.woff2?$/,
            ],
            use: [
              {
                loader: require.resolve("url-loader"),
                options: {
                  esModule: false,
                  limit: 10000,
                  name: "static/[name].[ext]",
                },
              },
            ],
          },
        ],
      },
    },
    output: {
      chunkFilename: "[name]-[contenthash].js",
      filename: "[name]-[contenthash].js",
      globalObject: "(typeof self !== 'undefined' ? self : this)",
      path: path.join(__dirname, "build"),
      publicPath: "/",
    },
    performance: {
      hints: false,
    },
    plugins: {
      add: [
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
        }),
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser.js",
        }),
        new webpack.DefinePlugin({
          "process.env": {
            NODE_ENV: JSON.stringify(mode),
            PKG_NAME: JSON.stringify(pkgJson.name),
            PKG_VERSION: JSON.stringify(pkgJson.version),
          },
        }),
        new CopyPlugin({
          patterns: [
            {
              from: path.resolve(__dirname, "./package.json"),
              to: path.resolve(__dirname, "./build/package.json"),
            },
          ],
        }),
        new HtmlWebpackPlugin({
          filename: "index.html",
          template: "public/index.html",
        }),
      ],
    },
    // watch: false,
  },
}
