const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  devServer: {
    https: true,
    historyApiFallback: true,
    hot: true,
    inline: true,
    progress: true,
    contentBase: './tests',
    port: 10101
  },
  entry: {
    test: './tests/browser/browser.ts'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  node: {
    fs: 'empty',
    tls: 'empty',
    net: 'empty',
    child_process: 'empty'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'tests/browser/test-browser.html',
      hash: true,
      minify: true
    })
  ]
}
