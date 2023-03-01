const path = require('path');
const webpack = require("webpack");

const frontendConfig = {
  mode: "development",
  entry: {
    './src/gift-window/gift-window.min': './src/gift-window/gift-window.ts',
    './src/superchat-window/superchat-window.min': './src/superchat-window/superchat-window.ts',
    './src/main-window/main-window.min': './src/main-window/main-window.ts',
    './src/setting-window/setting-window.min': './src/setting-window/setting-window.ts'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, './'),
  },
  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    })
  ],
}

const preloadConfig = {
  mode: "development",
  target: 'electron-preload',
  entry: {
    './src/preload': './src/preload.ts'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, './'),
  },
  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    })
  ],
}


const backendConfig = {
  mode: "development",
  target: "electron-main",
  entry: {
    './src/main': './src/main.ts',
    './src/bilibili': './src/bilibili.ts'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.node$/,
        use: 'node-loader',
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      'bufferutil': false,
      'utf-8-validate': false
    }
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, './'),
  },
  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    })
  ],
};

module.exports = [frontendConfig, preloadConfig, backendConfig]