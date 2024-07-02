module.exports = {
  plugins: [
    ["@babel/plugin-transform-modules-umd", {
      exactGlobals: true,
    }]
  ],
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
  ],
};