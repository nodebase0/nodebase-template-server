const path = require('path');

module.exports = {
  target: 'node',
  entry: './src/index.js',
  optimization: {
    minimize: true,
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
