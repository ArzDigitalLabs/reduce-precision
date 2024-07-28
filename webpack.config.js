const path = require('path');

module.exports = {
  entry: './ts/src/index.ts',  // Adjust this to the entry point of your application
  output: {
    path: path.resolve(__dirname, 'ts/lib'),  // The output directory
    filename: 'bundle.min.js',  // The name of the bundled file
    libraryTarget: 'umd',  // The format of the bundled file
    library: 'ReducePrecision',
  },
  resolve: {
    extensions: ['.ts', '.js'],  // Add `.ts` as a resolvable extension
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader',  // Use ts-loader to handle TypeScript files
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',  // Transpile ES6+ code to ES5 for compatibility
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  mode: 'production',  // Enable optimizations like minification
};
