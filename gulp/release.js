/* global require module */
/*eslint semi:0, indent:0, no-empty: 0 */
//
// Tasks related to releasing a build version
//
var fs = require('fs')
var pkg = require('../package.json')


module.exports = function(gulp, plugins, config) {
  function bump(level) {
      return function () {
          gulp.src(config.PACKAGE_FILES)
              .pipe(plugins.bump({type: level}))
              .pipe(gulp.dest("./"))
      }
  }

  gulp.task("bump:patch", "Bump to A.B.C+1", bump('patch'))
  gulp.task("bump:minor", "Bump to A.B+1.0", bump('minor'))
  gulp.task("bump:major", "Bump to A+1.0.0", bump('major'))


  gulp.task("release", "Compile a release", ['build', 'build:debug'], function () {
      // Here is a reminder for some related tasks.
      //   To delete tag:
      //     $ git tag -d vX.X.X
      //   To unpublish a tag:
      //     $ git push origin :refs/tags/vX.X.X
      //   To publish to npm:
      //     $ npm publish
      var options = {
          distDir: config.distDir,
          version: "v" + pkg.version
        },
        commands = {
          add: "git add -f <%= options.distDir %>",
          commit: 'git commit -a -m \"(task) Release <%= options.version %> \"',
          tag: "git tag '<%= options.version %>' -m '(task) Tag <%= options.version %>'",
          reset: "git reset HEAD^1",
          push_tags: "git push origin master --tags"
        };

      // Create dest/ and copies build/output/knockout.js and
      // build/output/knockout-latest.debug.js to dest/
      try {
          fs.mkdirSync(config.distDir)
      } catch (e) {} // ignore directory-exists
      fs.writeFileSync(config.distDir + config.dist.min,
          fs.readFileSync(config.buildDir + config.build.main))
      fs.writeFileSync(config.distDir + config.dist.debug,
          fs.readFileSync(config.buildDir + config.build.debug))

      // See
      // https://github.com/knockout/knockout/issues/1039#issuecomment-37897655
      return gulp.src(options.distDir, {read: false})
          .pipe(plugins.exec(commands.add, options))
          .pipe(plugins.exec(commands.commit, options))
          .pipe(plugins.exec(commands.tag, options))
          .pipe(plugins.exec(commands.reset, options))
          .pipe(plugins.exec(commands.push_tags, options))
          // remove dist/
          .pipe(plugins.clean())
  })
}
