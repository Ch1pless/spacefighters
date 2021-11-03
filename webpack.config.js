const [resolve, dirname] = [require("path").resolve, require("path").dirname];
const webpack = require("webpack");
require("dotenv").config();

module.exports = {
  mode: "development",
  target: "web",
  entry: ["./src/app.js", "webpack-hot-middleware/client"],
  output: {
    filename: "app.js",
    path: resolve(dirname("."), "public"),
    publicPath: "/",
  },
  devtool: "inline-source-map",
  resolve: {
    fallback: { fs: false, }
  },
  plugins: [
    new webpack.DefinePlugin({
      "ENV": JSON.stringify(process.env.NODE_ENV),
      "DOMAIN": JSON.stringify(process.env.DOMAIN),
      "PORT": JSON.stringify(process.env.PORT)
    }),
    new webpack.HotModuleReplacementPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"]
          }
        }
      },
      {
        test: /\.glsl?/,
        exclude: /node_modules/,
        use: {
          loader: "webpack-glsl-loader"
        }
      }
    ]
  }
};