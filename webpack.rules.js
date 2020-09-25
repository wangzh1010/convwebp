module.exports = [
  // Add support for native node modules
  {
    test: /\.node$/,
    use: 'node-loader',
  },
  {
    test: /\.(m?js|node)$/,
    parser: { amd: false },
    use: {
      loader: '@marshallofsound/webpack-asset-relocator-loader',
      options: {
        outputAssetBase: 'native_modules',
      },
    },
  },
  {
    test: /\.(png|svg|jpg|gif)$/,
    use: {
      loader: 'file-loader',
      options: {
        name: '[name].[ext]',
        publicPath: '../images',
        outputPath: 'images',
        esModule: false
      }
    }
  },
  {
    test: /\.(woff|woff2|eot|ttf|otf)$/,
    use: {
      loader: 'file-loader'
    }
  },
  {
    test: /\.html$/,
    use: {
      loader: 'html-loader'
    }
  },
  // Put your webpack loader rules in this array.  This is where you would put
  // your ts-loader configuration for instance:
  /**
   * Typescript Example:
   *
   * {
   *   test: /\.tsx?$/,
   *   exclude: /(node_modules|.webpack)/,
   *   loaders: [{
   *     loader: 'ts-loader',
   *     options: {
   *       transpileOnly: true
   *     }
   *   }]
   * }
   */
];
