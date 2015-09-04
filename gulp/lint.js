/* eslint semi: 0, indent: [2,2]*/
/* globals module */
//
// Tasks related to lint
//

module.exports = function(gulp, plugins, config) {
  gulp.task("lint:js", "Run Javascript linting (eslint)", function () {
    //   Config with .jshintrc; see http://www.jshint.com/docs/options/
    return gulp.src(config.sources)
          .pipe(plugins.eslint())
          .pipe(plugins.eslint.format())
  })

  gulp.task('lint:space', "Check for bad spaces", function () {
    return gulp.src(config.lint.sources)
      .pipe(plugins.lintspaces(config.lint.space_options))
      .pipe(plugins.lintspaces.reporter())
  })

  gulp.task('lint', 'Run javascript and trailing space linting', ['lint:js', 'lint:space'])

  gulp.task('watch:lint', "Re-lint on changes to source", ['lint:js', 'lint:space'], function () {
    gulp.watch(['spec/**/*.js', 'src/**/*.js', '*.js', 'gulp/*.js', '.eslintrc'], ['lint:js', 'lint:space'])
  })
}
