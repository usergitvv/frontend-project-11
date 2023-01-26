// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
const autoprefixer = require('autoprefixer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isProduction = process.env.NODE_ENV === 'production';

const config = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index_bundle.js',
  },
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    hot: true,
    host: '0.0.0.0',
    port: 8080,
    open: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html',
    }),
    new MiniCssExtractPlugin({
      filename: 'styles.css',
    }),
    // Add your plugins here
    // Learn more about plugins from https://webpack.js.org/configuration/plugins/
  ],
  module: {
    rules: [
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: 'asset',
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: () => [
                  autoprefixer,
                ],
              },
            },
          },
          {
            loader: 'sass-loader',
          },
        ],
      },
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
      },
      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
  resolve: {
    extensions: ['*', '.js'],
  },
};

module.exports = () => {
  if (isProduction) {
    config.mode = 'production';
    config.plugins.push(new WorkboxWebpackPlugin.GenerateSW());
  } else {
    config.mode = 'development';
  }
  return config;
};
