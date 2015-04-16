//
// Tasks related to single-run tests
//

var yargs = require('yargs')
var Promise = require('promise')
var gutil = require('gulp-util')
var env = process.env
var karmaServer = require('karma').server

// TODO: Test variations for the jQuery, Modernizr, etc.
// TODO: Test other browsers

module.exports = function(gulp, plugins, config) {
  gulp.task("test:chrome", "Run tests in Chrome", function (done) {
      config.karma.files = config.karma.files.concat(config.sources, config.spec_files)
      config.karma.browsers = ['Chrome']
      karmaServer.start(config.karma, done);
  })

  gulp.task('test', "Run tests in available browsers", ['test:chrome']);
}
