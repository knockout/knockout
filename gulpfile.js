/*global module:false

    Well orchestrated tasks for Knockout.

 */
require('colors')

var fs = require('fs'),
    gulp = require('gulp-help')(require('gulp')),
    plugins = require("gulp-load-plugins")(),
    yaml = require("js-yaml"),

    // Our settings
    pkg = require('./package.json'),
    config = yaml.safeLoad(fs.readFileSync('./config.yaml', 'utf8'));

require('./gulp/release')(gulp, plugins, config)
require('./gulp/build')(gulp, plugins, config)
require('./gulp/test')(gulp, plugins, config)
require('./gulp/lint')(gulp, plugins, config)
require('./gulp/watch')(gulp, plugins, config)

gulp.task('default', "Show the help", ['help'])
