const [resolve, dirname] = [require('path').resolve, require('path').dirname];
const webpack = require('webpack');
require('dotenv').config();
require('regenerator-runtime/runtime.js');
require('core-js/stable');

module.exports = {
  mode: 'development',
  target: ['web', 'es5'],
  entry: ['regenerator-runtime/runtime.js', 'core-js/stable', 'webpack-hot-middleware/client', './src/app.js'],
  output: {
    filename: 'app.js',
    path: resolve(dirname('.'), 'public'),
    publicPath: '/',
  },
  devtool: 'inline-source-map',
  resolve: {
    fallback: { fs: false, }
  },
  plugins: [
    new webpack.DefinePlugin({
      'ENV': JSON.stringify(process.env.NODE_ENV),
      'DOMAIN': JSON.stringify(process.env.DOMAIN),
      'PORT': JSON.stringify(process.env.PORT)
    }),
    new webpack.HotModuleReplacementPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.glsl?/,
        exclude: /node_modules/,
        use: {
          loader: 'webpack-glsl-loader'
        }
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(obj|mtl)$/i,
        type: 'asset',
      }
    ]
  }
};