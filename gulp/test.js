//
// Tasks related to single-run tests
//

var yargs = require('yargs')
var Promise = require('promise')
var gutil = require('gulp-util')
var env = process.env

module.exports = function(gulp, plugins, config) {

  gulp.task("test:node", "Run subset of tests in Node", ['build', 'runner'], function () {
      global.ko = require("../" + config.buildDir + config.build.main)
      global.DEBUG = true
      return gulp.src(config.node_spec_files)
          .pipe(plugins.jasmine({verbose: true}))
  })

  // Webdriver testing
  //
  // Start a phantom webdriver listener elsewhere with:
  //   $ phantomjs --webdriver=4445
  gulp.task("test:phantom", "Run tests in PhantomJS", ['build', 'runner'], function (done) {
      var wdr = require('../spec/helpers/webdriverRunner');
      wdr.phantom(config)
          .then(wdr.tests)
          .catch(function (msg) {
              gutil.log("Phantom tests failed: ".red + msg);
              process.exit(1);
          })
  })


  gulp.task("test:saucelabs", "Run tests in SauceLabs", ['build', 'runner'], function (done) {
      var idx = 0,
          failed_platforms = [],
          platforms = [],
          wdr = require('./spec/helpers/webdriverRunner'),
          SauceTunnel = require('sauce-tunnel'),
          connect = require('connect'),
          serveStatic = require('serve-static'),
          tunnel = new SauceTunnel(env.SAUCE_USERNAME, env.SAUCE_ACCESS_KEY, false, true,
              ['-v', '-P', '4447', '-i', env.TRAVIS_JOB_NUMBER || 'LOCAL']),
          grep_only = yargs.argv.only;

      config.test_platforms.forEach(function(p) {
          p.name = "" + p.platform + "/" + p.browserName + ':' + p.version;
          if (grep_only && !p.name.match(new RegExp(grep_only, 'i'))) {
              gutil.log("Skipping " + p.browserName + ":" + p.version);
              return
          }
          platforms.push(p);
      });

      function test_platform_promise(stream_id) {
          var session_id;
          if (idx >= platforms.length) {
              return
          }

          var platform = platforms[idx++];
          // We add an indent to make it easier to visualize which results
          // correspond to the progress in the given parallel stream.
          platform._title = Array(stream_id + 1).join("————————————————|  ") + platform.name;

          function on_success() {
              gutil.log(platform._title + "  ✓  ".green)
              return Promise.all([
                  wdr.report_to_saucelabs(session_id, true),
                  test_platform_promise(stream_id)
              ]);
          }

          function on_fail(msg) {
              failed_platforms.push(platform);
              gutil.log(platform._title + " " + "FAIL".bgRed.white.bold +
                        ":\n" + msg + "\n");
              return Promise.all([
                  wdr.report_to_saucelabs(session_id, false),
                  test_platform_promise(stream_id)
              ]);
          }

          function extract_session_id(spec) {
              session_id = spec.browser.sessionID;
              return spec;
          }

          return wdr.sauceLabs(platform, config)
              .then(extract_session_id)
              .then(wdr.tests)
              .then(on_success, on_fail)
      }

      function on_tunnel_start(status) {
          gutil.log("SauceLabs tunnel open.")
          var streams = [];

          if (!status) {
              throw new Error("Unable to start SauceLabs tunnel.")
          }

          for (var i = 0; i < config.test_streams; ++i) {
              streams.push(test_platform_promise(i))
          }

          deplex_streams(streams)
      }

      function deplex_streams(test_streams) {
          Promise.all(test_streams)
              .catch(function (msg) {
                  gutil.log("Error processing test streams: " + msg.red)
              })
              .then(function () {
                  var failed_platform_names = failed_platforms.map(function (fp) {
                      return fp.name.red
                  }).sort();
                  gutil.log()
                  gutil.log(("Webdriver tested " + idx + " platforms.").cyan);
                  if (failed_platforms.length)
                      gutil.log("Failed platforms:\n\t" + failed_platform_names.join("\n\t"))
                  tunnel.stop(on_tunnel_stop);
              })
              .done()
      }

      function on_tunnel_stop(err) {
          if (err)
              gutil.log("Error stopping tunnel: " + err.red)
          if (failed_platforms.length > 0)
              process.exit(failed_platforms.length);
          // Otherwise cleanly return.
          done();
          process.exit(0);
      }

      if (!env.SAUCE_USERNAME)
          throw new Error("SAUCE_USERNAME is not in the environment.");

      if (!env.SAUCE_ACCESS_KEY)
          throw new Error("SAUCE_ACCESS_KEY is not in the environment.");

      // Optional extra debugging. Also, check out:
      // https://github.com/axemclion/grunt-saucelabs/blob/master/tasks/saucelabs.js
      if (yargs.argv.verbose) {
          tunnel.on('verbose:ok', gutil.log)
          tunnel.on('verbose:debug', gutil.log)
          tunnel.on('log:error', gutil.log)
      }

      // Serve our local files.
      connect().use(serveStatic(__dirname)).listen(7070);

      // If the tunnel fails, make sure nothing is listening on the
      // port, with e.g. lsof -wni tcp:4445
      gutil.log("Opening SauceLabs tunnel (with " + config.test_streams + " concurrent streams)")
      tunnel.start(on_tunnel_start)
  })


  gulp.task('test', "Run node, phantom and Saucelabs tests", ['test:node', 'test:phantom', 'test:saucelabs']);

}
