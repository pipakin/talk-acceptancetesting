module.exports = {
  cmd: "node ./build.js",
  preBuild: function () {
    console.log('This is run **before** the build command');
  },
  postBuild: function () {
    console.log('This is run **after** the build command');
  },
  functionMatch: function (terminal_output) {
    // this is the array of matches that we create
    var matches = [];

    return matches;
  }
};
