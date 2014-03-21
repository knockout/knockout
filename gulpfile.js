/*global module:false

    Well orchestrated tasks for Knockout.

 */
var
    /* Imports */
    fs = require('fs'),
    gulp = require('gulp'),
    plugins = require("gulp-load-plugins")(),
    colors = require('colors'),
    vmap = require('vinyl-map'),
    gutil = require('gulp-util'),
    closureCompiler = require('gulp-closure-compiler'),

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
    build_scripts = [].concat.apply([], [
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

    // scripts that are loaded by the browser during testing;
    // in runner.template.html the respective comments are replace by
    // the respective <script> tags
    setup_scripts = [
            "http://localhost:35728/livereload.js",
            JASMINE_CDN,
            JASMINE_HTML_CDN,
            "node_modules/jasmine-tapreporter/src/tapreporter.js",
            "spec/helpers/beforeEach.js",
            "spec/helpers/jasmine.browser.js",
            // Knockout polyfills
            "spec/helpers/innershiv.js",
            "spec/helpers/json2.js",
    ],

    spec_scripts = require("./spec/helpers/specs.json"),

    // Destination files
    buildDir = 'build/output/',
    destDir = "dest/",
    build = {
        debug: 'knockout-latest.debug.js',
        main: 'knockout-latest.js',
    },

    PACKAGE_FILES = ["./package.json", "./bower.json"],

    // Compiler options
    closure_options = {
        compilation_level: "ADVANCED_OPTIMIZATIONS"
    },

    // Test options
    spec = "spec/spec.node.js",

    // Linting and trailing whitespace detection
    trailingSpaceRegex = /[ ]$/,
    trailingSpaceSources = [
        'spec/*.{js,html,css,bat,ps1,sh}',
        'src/*.{js,html,css,bat,ps1,sh}',
        'build/fragments/*',
    ],

    // make sure this matches the <script> in spec/runner.html
    livereload_port = 35728;


gulp.task("clean", function() {
    return gulp.src([buildDir + "*.js", destDir], {read: false})
        .pipe(plugins.clean())
})
gulp.tasks.clean.doc = "Remove build/output/*.js and dist/."


//      lint
//      ~~~~
//
//   Config with .jshintrc; see http://www.jshint.com/docs/options/
//
gulp.task("lint", ['checkTrailingSpaces'], function () {
    return gulp.src(sources)
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('jshint-stylish'))
})
gulp.tasks.lint.doc = 'Check for fuzzies.'


gulp.task("test", ['build', 'runner'], function () {
    global.ko = require("./" + buildDir + build.main)
    return gulp.src(spec)
        .pipe(plugins.jasmine())
})
gulp.tasks.test.doc = 'run node tests (spec/spec.node.js)'


gulp.task("checkTrailingSpaces", function () {
    var matches = [];
    function detect_trailing_spaces(code, filename) {
        var lines = code.toString().split(/\r*\n/)
        lines.forEach(function (line, index) {
            if (trailingSpaceRegex.test(line)) {
                matches.push([filename, (index+1), line].join(':'))
            }
        })
        return code
    }
    function on_close() {
        if (matches.length == 0) {
            return
        }
        gutil.log("The following files have trailing spaces that " +
            "need to be cleaned up:")
        gutil.log(matches.join("\n").red)
        throw new Error("Clean up files with trailing spaces (see above).")
    }

    gulp.src(trailingSpaceSources)
        .pipe(vmap(detect_trailing_spaces))
        .on("close", on_close)
})
gulp.tasks.test.doc = 'Check for trailing whitespace.'


gulp.task('build-debug', function () {
    return gulp.src(build_scripts)
        .pipe(plugins.concat(build.debug))
        .pipe(plugins.header("(function(){\nvar DEBUG=true;\n"))
        .pipe(plugins.header(banner, { pkg: pkg }))
        .pipe(plugins.footer("})();\n"))
        .pipe(plugins.replace("##VERSION##", pkg.version + "-debug"))
        .pipe(gulp.dest(buildDir))
})
gulp.tasks['build-debug'].doc = 'Create build/output/knockout-latest.debug.js'


gulp.task("build", ['build-debug'], function () {
    return gulp.src(buildDir + build.debug)
        .pipe(plugins.replace("var DEBUG=true", "/** @const */var DEBUG=false"))
        .pipe(closureCompiler(closure_options))
        .pipe(plugins.rename(build.main))
        .pipe(plugins.header(banner, {pkg: pkg}))
        .pipe(gulp.dest(buildDir))
})
gulp.tasks.build.doc = 'Create build/output/knockout-latest.js'


gulp.task("watch", ['runner'], function () {
    var server = plugins.livereload(livereload_port),
        watched = [].concat(sources, spec_scripts, setup_scripts,
            build_scripts, ['runner.html'])
    // recompile runner.*.html as needed
    gulp.watch(['spec/helpers/runner.template.html']).on('change', function () {
        gulp.start('runner')
    })
    // reload the browser when any of the watched files change
    return gulp.watch(watched).on('change', function (file) {
        server.changed(file.path)
    })
})
gulp.tasks.watch.doc = 'Watch scripts; livereload runner.*.html on changes.'


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
gulp.tasks['bump-patch'].doc = 'Bump version from x.x.N to x.x.N+1'
gulp.tasks['bump-minor'].doc = 'Bump version from x.N.x to x.N+1.x'
gulp.tasks['bump-major'].doc = 'Bump version from N.x.x to N+1.x.x'


gulp.task("release", ['build', 'build-debug'], function (done) {
    var version = "v" + pkg.version;
    require('./release')(version, done);
})
gulp.tasks.release.doc = 'Create new release of Knockout; see release.js'


gulp.task("runner", function () {
    // Build runner.html in the root directory. This makes it more
    // straightforward to access relative-path src/ and spec/ files i.e.
    // there will be no "../" in our <script> tags.
    function script_tag(s) {
        return "<script type='text/javascript' src='" + s + "'></script>\n\t"
    }

    function replace(key, scripts) {
        var target = "<!-- " + key + " -->",
            replacement = scripts.map(script_tag).join("");
        return plugins.replace(target, replacement)
    }

    return gulp.src("spec/helpers/runner.template.html")
        // create vanilla runner
        .pipe(plugins.rename("runner.html"))
        .pipe(replace("SETUP", setup_scripts))
        .pipe(replace("SOURCE", sources))
        .pipe(replace("SPECS", spec_scripts))
        .pipe(gulp.dest("./"))
        // create runner with jquery
        .pipe(replace("JQUERY_CDN", [JQUERY_CDN]))
        .pipe(plugins.rename("runner.jquery.html"))
        .pipe(gulp.dest("./"))
        // create runner with modernizr
        .pipe(replace("MODERNIZR_CDN", [MODERNIZR_CDN]))
        .pipe(plugins.rename("runner.modernizr.html"))
        .pipe(gulp.dest("./"))
})
gulp.tasks.runner.doc = 'Create runner[.jquery|.modernizr].html'

gulp.task('help', function () {
    gutil.log('')
    gutil.log("Usage: gulp task".red)
    gutil.log('')

    Object.keys(gulp.tasks).sort().forEach(function (task_name) {
        var tstr = "   " + task_name.cyan,
            task = gulp.tasks[task_name];
        if (task.dep.length > 0) {
            tstr += " (runs: " + task.dep.join(", ") + ")"
        }
        gutil.log(tstr)
        if (task.doc) {
            gutil.log("      " + task.doc)
        }
    })
    gutil.log('')
})
gulp.tasks.help.doc = 'Print this help message.'


gulp.task('default', function () {
    gutil.log('')
    gutil.log("Usage: gulp task".red)
    gutil.log('       Enter ' + 'gulp help'.cyan + ' for more info.')
    gutil.log('')
})
