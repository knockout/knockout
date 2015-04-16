//
// Tasks related to lint
//
var vmap = require('vinyl-map')
var trailingSpaceRegex = /[ ]$/;
var gutil = require('gulp-util')



module.exports = function(gulp, plugins, config) {
  gulp.task("lint:js", "Run Javascript linting", function () {
      //   Config with .jshintrc; see http://www.jshint.com/docs/options/
      return gulp.src(config.sources)
          .pipe(plugins.jshint())
          .pipe(plugins.jshint.reporter('jshint-stylish'))
  })

  gulp.task('lint:space', "Check for bad spaces", function () {
    gulp.src(config.lint.sources)
      .pipe(plugins.lintspaces(config.lint.space_options))
      .pipe(plugins.lintspaces.reporter())
  })

  gulp.task('lint', 'Run javascript and trailing space linting', ['lint:js', 'lint:space'])
}
