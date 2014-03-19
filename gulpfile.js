/*global module:false

        Gulp task runner for
        Knockout
        ~~~~~~~~~~~~~~~~~~~~

    $ gulp [task]

Tasks
-----

$ gulp        (default task)
: clean, build, build-debug

$ gulp watch
: runner
Starts a livereload server that causes runner[.jquery,.modernizr].html
to reload whenever the source or spec scripts are updated.

$ gulp build
Creates build/output/knockout.min.js

$ gulp build-debug
Creates build/output/knockout.debug.js

$ gulp (bump-patch | bump-minor | bump-major)
Increments the version in ./*.json by the corresponding level. e.g.
gulp bump-patch on 3.1.0 will increment to 3.1.1.

$ gulp release
: clean, build, build-debug
Tag and publish a version of the repository that includes dist/knockout.js
and dist/knockout.debug.js

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

    CDN_ROOT = "http://cdnjs.cloudflare.com/ajax/libs/",
    JASMINE_CDN = CDN_ROOT + "jasmine/1.3.1/jasmine.js",
    JASMINE_HTML_CDN = CDN_ROOT + "jasmine/1.3.1/jasmine-html.js",
    // jQuery & Modernizr are optional; see runner task
    JQUERY_CDN = CDN_ROOT + "jquery/1.11.0/jquery.min.js",
    MODERNIZR_CDN = CDN_ROOT + "modernizr/2.7.1/modernizr.min.js",

    // scripts that are loaded by the browser during testing
    runner_scripts = [].concat.apply([], [
        "http://localhost:35728/livereload.js",
        JASMINE_CDN,
        JASMINE_HTML_CDN,
        "spec/helpers/beforeEach.js",
        "spec/helpers/jasmine.browser.js",
        // knockout polyfills
        "spec/helpers/innershiv.js",
        "spec/helpers/json2.js",
        // knockout
        sources,
        // specs
        require("./spec/helpers/specs.json")
    ]),

    // Destination files
    buildDir = 'build/output/',
    destDir = "dest/",
    build = {
        debug: 'knockout-latest.debug.js',
        main: 'knockout-latest.js',
    },

    PACKAGE_FILES = ["./package.json", "./bower.json"],

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
    gulp.src([buildDir + "*.js", destDir], {read: false})
        .pipe(plugins.clean())
})


//      lint
//      ~~~~
//
//   Config with .jshintrc; see http://www.jshint.com/docs/options/
//
gulp.task("lint", function () {
    gulp.src(sources)
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('jshint-stylish'))
})


gulp.task("test", ['build', 'runner'], function () {
    global.ko = require("./" + buildDir + "knockout.min.js")
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
        .pipe(plugins.uglify(uglifyOptions))
        .pipe(plugins.header(banner, { pkg: pkg }))
        .pipe(gulp.dest(buildDir))
})


gulp.task("watch", ['runner'], function () {
    var server = plugins.livereload(livereload_port);
    gulp.watch(runner_scripts).on('change', function (file) {
        server.changed(file.path)
    })
})


function bump(level) {
    return function () {
        gulp.src(PACKAGE_FILES)
            .pipe(plugins.bump({type: level}))
            .pipe(gulp.dest("./"))
    }
}

gulp.task("bump-patch", bump('patch'))
gulp.task("bump-minor", bump('minor'))
gulp.task("bump-major", bump('major'))


gulp.task("release", ['build', 'build-debug'], function (done) {
    var version = "v" + pkg.version;
    require('./release')(version);
})


gulp.task("runner", function () {
    // Build runner.html in the root directory. This makes it more
    // straightforward to access relative-path src/ and spec/ files i.e.
    // there will be no "../" in our <script> tags.
    var inject_options = { addRootSlash: false },
        SKIP = { read: false };
    gulp.src("spec/helpers/runner.template.html")
        // create vanilla runner
        .pipe(plugins.rename("runner.html"))
        .pipe(plugins.inject(runner_scripts), inject_options)
        .pipe(gulp.dest("./"))
        // create runner with jquery
        .pipe(plugins.inject(JQUERY_CDN))
        .pipe(plugins.rename("runner.jquery.html"))
        .pipe(gulp.dest("./"))
        // create runner with modernizr
        .pipe(plugins.inject(MODERNIZR_CDN))
        .pipe(plugins.rename("runner.modernizr.html"))
        .pipe(gulp.dest("./"))
})


gulp.task('default', ['clean'], function () {
    // TODO add 'lint' here
    gulp.start('build', 'build-debug')
})
