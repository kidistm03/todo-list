// webpack.config.js
// This file tells Webpack how to bundle our project

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  // Entry point: where Webpack starts reading our code
  entry: "./src/js/index.js",

  // Output: where the bundled files go
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true, // clears old files in dist before each build
  },

  // Plugins add extra functionality
  plugins: [
    // Automatically creates index.html in dist and injects our bundle
    new HtmlWebpackPlugin({
      template: "./src/index.html",
    }),
    // Extracts CSS into a separate file
    new MiniCssExtractPlugin({
      filename: "style.css",
    }),
  ],

  // Loaders tell Webpack how to handle different file types
  module: {
    rules: [
      {
        // Handle JavaScript files using Babel (for browser compatibility)
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        // Handle CSS files
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },

  // Dev server settings (for running locally with npm start)
  devServer: {
    static: "./dist",
    open: true,
    hot: true,
  },
};
