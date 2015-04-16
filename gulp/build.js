//
// Tasks related to compiling the knockout.(min/debug).js files
//
var pkg = require('../package.json')
var gutil = require('gulp-util')

module.exports = function(gulp, plugins, config) {

  gulp.task("clean", "Remove unused files.", function() {
      var dests = [
          config.buildDir + "*.js",
          config.distDir,
          'runner*.html'
      ];
      return gulp.src(dests, {read: false})
          .pipe(plugins.clean())
  })


  gulp.task('build:debug', "Compile the unminified debug version", function () {
      return gulp.src(config.sources)
          .pipe(plugins.concat(config.build.debug))
          // amd + extern
          .pipe(plugins.header(config.build.headers.join("\n")))
          .pipe(plugins.footer(config.build.footers.join("\n")))
          .pipe(plugins.header("(function(){\nvar DEBUG=true;\n"))
          .pipe(plugins.header(config.banner, { pkg: pkg }))
          .pipe(plugins.footer("})();\n"))
          .pipe(plugins.replace("##VERSION##", pkg.version + "-debug"))
          .pipe(gulp.dest(config.buildDir))
  })


  gulp.task("build:closure", "Compile minified version with closure compiler", ['build:debug'], function () {
      var closure = require('closure-compiler'),
          through = require('through'),
          file;

      // This is all quite similar to gulp-closure-compiler,
      // except that plugin does not support taking streams
      // i.e. it only takes individual files, which does not
      // agree with the injection of code or concatenation
      // strategy Knockout uses to combine sources in-order with
      // headers and footers added to that.
      function buffer(stream) {
          // This is a degenerate buffer because we have already
          // called `concat`, meaning we are given one vinyl pipe/file.
          file = stream;
      }

      function make() {
          var code = file.contents.toString(),
              self = this;

          function on_compiled(err, stdout, stderr) {
              if (err) {
                  throw new Error({
                      error: err,
                      stdout: stdout,
                      stderr: stderr
                  })
              }
              self.emit("data", new gutil.File({
                  cwd: file.cwd,
                  base: file.base,
                  path: file.path,
                  contents: new Buffer(stdout.replace(/\r\n/g, "\n"))
              }))
              self.emit("end")
          }

          closure.compile(code, config.closure_options, on_compiled);
      }

      return gulp.src(config.sources)
          // combine into one source
          .pipe(plugins.concat(config.build.main))
          // add directive for closure compiler
          .pipe(plugins.header("/** const */var DEBUG=false;"))
          // amd + extern
          .pipe(plugins.header(config.build.headers.join("\n")))
          .pipe(plugins.footer(config.build.footers.join("\n")))
          // compile
          .pipe(through(buffer, make))
          // license / header comment
          .pipe(plugins.header(config.banner, {pkg: pkg}))
          // sub version
          .pipe(plugins.replace("##VERSION##", pkg.version))
          // copy to build directory
          .pipe(gulp.dest(config.buildDir))
  })


  gulp.task("build:uglify", "Compile minified version with uglifyjs", ['build:debug'], function () {
      return gulp.src(config.sources)
          .pipe(plugins.concat(config.build.main))
          .pipe(plugins.header(config.build.headers.join("\n")))
          .pipe(plugins.footer(config.build.footers.join("\n")))
          .pipe(plugins.uglify(config.uglify_options))
          .pipe(plugins.header(config.banner, {pkg: pkg}))
          .pipe(plugins.replace("##VERSION##", pkg.version))
          .pipe(gulp.dest(config.buildDir))
  })

  if (config.minifier === 'closure' || process.env.MINIFIER === 'closure')
    gulp.task("build", "Build (with Closure)", ['build:closure'])

  else if (config.minifier === 'uglify')
    gulp.task("build", "Build (with UglifyJS)", ['build:uglify'])

  else throw new Error("Unknown minifier in config.yaml: " + config.minifier)
}
