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

TODO: gulp-git might be handy when it works, but at the moment it lacks
the capacity to stream the items below in order and git.reset is not
exposed.

  Handy reference
  ~~~~~~~~~~~~~~~~~
  Here is a reminder for some related tasks.

  To delete tag:
    $ git tag -d vX.X.X

  To unpublish a tag:
    $ git push origin :refs/tags/vX.X.X

  To publish to npm:
    $ npm publish

 */
var fs = require('fs'),
    gulp = require('gulp'),
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


function git_exec(args, cb) {
  var exec_opts = {cwd:process.cwd()},
      cmd = "git " + args;
  exec(cmd, exec_opts, function (err, stdout, stderr) {
    if (err) {
      gutil.log(err);
      throw new Error("Tagging error: " + err);
    }
    gutil.log(stdout, stderr)
    cb()
  })
}


gulp.task("add-dist", function (done) {
  git_exec("add -f " + DEST, done)
})


gulp.task("commit", ['add-dist'], function (done) {
  var message = "(task) Release " + target_version;
  git_exec("commit -a -m \"" + message + "\"", done)
})


gulp.task("tag", ['commit'], function (done) {
  var message = "(task) Tagging " + target_version,
      args = 'tag ' + escape([target_version])+ ' -m "' + message + '" ';

  git_exec(args, done)
})


gulp.task("reset", ['tag'], function (done) {
  var cmd = "reset HEAD^1";
  git_exec(cmd, done)
})


gulp.task('push-tags', ['reset'], function (done) {
  var cmd = "push origin master --tags";
  git_exec(cmd, done)
})


module.exports = function release(version, done) {
  // A.
  try {
    // may error if the directory exists
    fs.mkdirSync(DEST)
  } catch (e) {}
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
    done()
  })
}
