const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const package = require('./package.json');
const VERSION = package.version;

module.exports = {
  mode: 'production',
  entry: {
    ['wx-ui-' + VERSION]: './src/output.js',
  },
  output: {
    filename: 'js/[name].min.js',
    library: 'wx',
    libraryTarget: 'umd'
  },
  externals: {
    // 'popper.js': 'Popper'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.(css|scss|sass)$/,
        use: [
          MiniCssExtractPlugin.loader,
					'css-loader',
					'postcss-loader',
					'sass-loader'
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
			// filename: assetsPath('[name].css')
			filename: '[name].min.css'
		})
  ]
}