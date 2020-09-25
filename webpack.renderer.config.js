const rules = require('./webpack.rules');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
rules.push({
  test: /\.s?css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }, { loader: 'sass-loader' }],
});

rules.push({
  test: /\.vue$/,
  loader: 'vue-loader'
});

module.exports = {
  // Put your normal webpack config below here
  module: {
    rules,
  },
  plugins: [
    new VueLoaderPlugin()
  ],
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js'
    }
  }
};
