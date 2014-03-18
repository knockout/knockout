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
    pkg = require('./package.json'),

    banner = [
        '// Knockout JavaScript library v<%= pkg.version %>',
        '// (c) Steven Sanderson - <%= pkg.homepage %>',
        '// License: <%= pkg.licenses[0].type %> (<%= pkg.licenses[0].url %>)',
        ''
    ].join("\n")

    // Source files
    scriptsDir = 'build/fragments/',
    sources = require("./" + scriptsDir + "source-references.json"),

    // [].concat.apply flattens the list
    scripts = [].concat.apply([], [
        scriptsDir + 'extern-pre.js',
        scriptsDir + 'amd-pre.js',
        sources,
        scriptsDir + 'amd-post.js',
        scriptsDir + 'extern-post.js'
    ]),

    // scripts that are loaded by the browser during testing
    runner_scripts = [].concat.apply([], [
        "spec/lib/jasmine.extensions.js",
        // knockout polyfills
        "spec/lib/innershiv.js",
        "spec/lib/json2.js",
        // knockout
        sources,
        // specs
        require("./spec/helpers/specs.json")
    ]),

    // Destination files
    buildDir = 'build/output/',
    build = {
        debug: 'knockout-latest.debug.js',
        main: 'knockout.js',
    },

    // Compiler options
    uglifyOptions = {
        compress: {
            global_defs: {
                // remove `if (DEBUG) { ... }` statements
                DEBUG: false,
            }
        },
    },

    // Test options
    spec = "spec/spec.node.js",

    // make sure this matches the <script> in spec/runner.html
    livereload_port = 35728;


gulp.task("clean", function() {
    gulp.src(buildDir + "*", {read: false})
        .pipe(plugins.clean())
})


gulp.task("lint", function () {
    gulp.src(sources)
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('jshint-stylish'))
})


gulp.task("test", ['build'], function () {
    gulp.src(spec)
        .pipe(plugins.jasmine())
})


gulp.task("checkTrailingSpaces", function () {
    // TODO
    //  "**/*.{js,html,css,bat,ps1,sh}",
    // "!build/output/**",
    // "!node_modules/**"
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
        .pipe(plugins.rename({ extname: ".min.js" }))
        .pipe(plugins.uglify(uglifyOptions))
        .pipe(plugins.header(banner, { pkg: pkg }))
        .pipe(gulp.dest(buildDir))
})


gulp.task("watch", function () {
    var server = plugins.livereload(livereload_port);
    gulp.watch(runner_scripts).on('change', function (file) {
        server.changed(file.path)
    })
})


gulp.task("runner", function () {
    // build runner.html in the root directory.
    inject_options = {
        addRootSlash: false
    }
    gulp.src("spec/runner.html")
        .pipe(plugins.inject(gulp.src(runner_scripts, {read: false}),
            inject_options))
        .pipe(gulp.dest("./"))
})


gulp.task('default', ['clean'], function () {
    // TODO add 'lint' here
    gulp.start('build', 'build-debug')
})
