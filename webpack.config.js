module.exports = {
  entry: "./src/server.ts",
  output: {
    filename: "./[name].js",
  },
  resolve: {
    extensions: [".ts",".js"],
  },
  module: {
    rules: [{ test: /.tsx?$/, loader: "ts-loader" }],
  },
};
