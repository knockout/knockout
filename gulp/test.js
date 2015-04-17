//
// Tasks related to single-run tests
//

var yargs = require('yargs')
var Promise = require('promise')
var gutil = require('gulp-util')
var karmaServer = require('karma').server
var env = process.env
var argv = process.argv;

// TODO: Test other browsers

module.exports = function(gulp, plugins, config) {
    var libs = config.test_alt_libs;

    function test(browsers) {
        config.karma.files = config.karma.files.concat(config.sources, config.spec_files)

        Object.keys(libs).forEach(function (lib) {
            if (argv.indexOf("--" + lib) >= 0) {
                config.karma.files.unshift(libs[lib])
            }
        })

        config.karma.browsers = browsers
        if (process.argv.indexOf("--once") >= 0) {
            config.karma.singleRun = true;
        }
        karmaServer.start(config.karma, process.exit);
    }

    gulp.task("test:chrome", "Run tests in Chrome", function() {
        test(['Chrome'])
    })

    gulp.task("test:phantomjs", "Run tests in PhantomJS", function(done) {
        test(['PhantomJS'])
    })

    gulp.task('test', "Run tests in available browsers", ['test:chrome', 'test:phantomjs']);
}
