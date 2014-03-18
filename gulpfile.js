/*global module:false

        Gulp for Knockout
        ~~~~~~~~~~~~~~~~~

    $ gulp [task]

 */
var
    /* Imports */
    fs = require('fs'),
    gulp = require('gulp'),
    plugins = require("gulp-load-plugins")(),
    colors = require('colors'),

    /* Variables */
    now = new Date(),

    pkg = require('./package.json'),

    banner = [
        '// Knockout JavaScript library v<%= pkg.version %>',
        '// (c) Steven Sanderson - <%= pkg.homepage %>',
        '// License: <%= pkg.licenses[0].type %> (<%= pkg.licenses[0].url %>)',
        ''
    ].join("\n")

    // Source files
    scriptsDir = 'build/fragments/',
    sources = require("./" + scriptsDir + "source-references.js"),

    // [].concat.apply flattens the list
    scripts = [].concat.apply([], [
        scriptsDir + 'extern-pre.js',
        scriptsDir + 'amd-pre.js',
        sources,
        scriptsDir + 'amd-post.js',
        scriptsDir + 'extern-post.js'
    ]),

    // Destination files
    buildDir = 'build/output/',
    build = {
        debug: 'knockout-latest.debug.js',
        main: 'knockout.js',
    },
    test = {
        phantomjs: 'spec/runner.phantom.js',
        node: 'spec/runner.node.js'
    },

    // Compiler options
    uglifyOptions = {
        compress: {
            global_defs: {
                // remove `if (DEBUG) { ... }` statements
                DEBUG: false,
            }
        },
    };

function getReferencedSources(sourceReferenceFilename) {
     // Returns the array of filenames referenced by a file like source-references.js
    var result;
    global.knockoutDebugCallback = function(sources) { result = sources; };
    eval(fs.readFileSync(sourceReferenceFilename, { encoding: 'utf8' }));
    return result;
}


gulp.task("clean", function() {
    gulp.src(buildDir + "*", {read: false})
        .pipe(plugins.clean())
})


gulp.task("lint", function () {
    gulp.src(sources)
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('jshint-stylish'))
})


gulp.task("checkTrailingSpaces", function () {
    // TODO
    console.error("checkTrailingSpaces: Not yet implemented".red)
})


gulp.task('build-debug', function () {
    gulp.src(scripts)
        .pipe(plugins.concat(build.debug))
        .pipe(plugins.header("function(){\nvar DEBUG=true;\n"))
        .pipe(plugins.header(banner, { pkg: pkg }))
        .pipe(plugins.footer("})();\n"))
        .pipe(gulp.dest(buildDir))
})


gulp.task("build", function () {
    gulp.src(scripts)
        .pipe(plugins.concat(build.main))
        .pipe(plugins.uglify(uglifyOptions))
        .pipe(plugins.header(banner, { pkg: pkg }))
        .pipe(gulp.dest(buildDir))
})


gulp.task('default', ['clean'], function () {
    // TODO add 'lint' here
    gulp.start('build', 'build-debug')
})
