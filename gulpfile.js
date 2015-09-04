 /* globals require */
 /* eslint semi:0, no-unised-vars:0*/
/*

    Orchestrated tasks for Knockout.

 */
require('colors')

var fs = require('fs'),
    gulp = require('gulp-help')(require('gulp')),
    plugins = require("gulp-load-plugins")(),
    yaml = require("js-yaml");

var config = yaml.safeLoad(fs.readFileSync('./config.yaml', 'utf8'));

require('./gulp/release')(gulp, plugins, config)
require('./gulp/build')(gulp, plugins, config)
require('./gulp/test')(gulp, plugins, config)
require('./gulp/lint')(gulp, plugins, config)

gulp.task('default', "Show the help", ['help'])
