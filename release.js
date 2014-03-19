/*
        Release
        ~~~~~~~

This will create a new release of the package.

See https://github.com/knockout/knockout/issues/1039#issuecomment-37897655

In particular it:

A. Creates dest/ and copies build/output/knockout.js and build/output/knockout-latest.debug.js to dest/

B.
 1. git add dist -f
 2. git commit -a -m "<MSG>"
 3. git tag "<VERSION>"
 4. git reset HEAD^1
 5. git push --tags

C. removes dest/
 */
var fs = require('fs'),
    gulp = require('gulp'),
    git = require('gulp-git'),
    gutil = require('gulp-util'),
    exec = require('child_process').exec,

    DEST = "./dest/",

    min_copy = {
      src: './build/output/knockout-latest.js',
      dest: DEST + 'knockout.min.js'
    },

    debug_copy = {
      src: './build/output/knockout-latest.debug.js',
      dest: DEST + 'knockout.debug.js'
    },

    target_version;


gulp.task("add-dist", function () {
  gulp.src(DEST)
      .pipe(git.add({args: "-f"}))
})


gulp.task("commit", ['add-dist'], function () {
  gulp.src("./")
      .pipe(git.commit("(task) Release " + target_version))
})


gulp.task("tag", ['commit'], function (done) {
  var message = "(task) Tagging " + target_version,
      cmd = 'git tag ' + escape([target_version])+ ' -m "' + message + '" ',
      templ = gutil.template(cmd, {file:message});

  exec(templ, {cwd: process.cwd()}, function(err, stdout, stderr){
    if (err) {
      gutil.log(err);
      done(new Error("Tagging error: " + err))
      return
    }
    gutil.log(stdout, stderr);
    done();
  });
})


gulp.task("reset", ['tag'], function (done) {
  var cmd = "git reset HEAD^1";
  exec(cmd, {cwd: process.cwd()}, function(err, stdout, stderr) {
    if(err) {
      gutil.log(err);
      done(new Error("git reset HEAD ^1 emitted an error: " + err))
      return;
    }
    gutil.log(stdout, stderr);
    if(cb) cb();
  }
})


gulp.task('push-tags', ['reset'], function (done) {
  git.push('origin', 'master', {args: '--tags'}, done)
})


module.exports = function release(version) {
  // A.
  fs.mkdirSync(DEST)
  fs.writeFileSync(min_copy.dest, fs.readFileSync(min_copy.src))
  fs.writeFileSync(debug_copy.dest, fs.readFileSync(debug_copy.src))

  // set this for the gulp.task('tag', ...)
  target_version = version;

  // B.
  gulp.start("push-tags", function () {
    // C.
    fs.unlinkSync(debug_copy.dest)
    fs.unlinkSync(min_copy.dest)
    fs.rmdirSync(DEST)
  })
}
