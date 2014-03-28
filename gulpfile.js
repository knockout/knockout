/*global module:false

    Well orchestrated tasks for Knockout.

 */
require('colors')

var
    /* Imports */
    fs = require('fs'),
    gulp = require('gulp'),
    plugins = require("gulp-load-plugins")(),
    vmap = require('vinyl-map'),
    gutil = require('gulp-util'),
    yaml = require("js-yaml"),

    // Our settings
    pkg = require('./package.json'),
    config = yaml.safeLoad(fs.readFileSync('./knockout.config.yaml', 'utf8')),

    // [].concat.apply flattens the list
    build_scripts = [].concat.apply([], [
        config.scriptsDir + 'extern-pre.js',
        config.scriptsDir + 'amd-pre.js',
        config.sources,
        config.scriptsDir + 'amd-post.js',
        config.scriptsDir + 'extern-post.js'
    ]),

    // scripts that are loaded by the browser during testing;
    // in runner.template.html the respective comments are replace by
    // the respective <script> tags
    setup_scripts = [
            "http://localhost:" + config.livereload_port + "/livereload.js",
            config.JASMINE_JS,
            config.JASMINE_HTML_JS,
            "node_modules/jasmine-tapreporter/src/tapreporter.js",
            "spec/helpers/beforeEach.js",
            "spec/helpers/jasmine.browser.js",
            // Knockout polyfills
            "spec/helpers/innershiv.js",
            "spec/helpers/json2.js",
    ],

    // Linting and trailing whitespace detection
    trailingSpaceRegex = /[ ]$/;

gulp.task("clean", function() {
    var dests = [
        config.buildDir + "*.js",
        config.distDir,
        'runner*.html'
    ];
    return gulp.src(dests, {read: false})
        .pipe(plugins.clean())
})

gulp.task("lint", ['checkTrailingSpaces'], function () {
    //   Config with .jshintrc; see http://www.jshint.com/docs/options/
    return gulp.src(config.sources)
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('jshint-stylish'))
})

gulp.task("test", ['build', 'runner'], function () {
    global.ko = require("./" + config.buildDir + config.build.main)
    return gulp.src(config.node_spec)
        .pipe(plugins.jasmine())
})

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

    gulp.src(config.trailingSpaceSources)
        .pipe(vmap(detect_trailing_spaces))
        .on("close", on_close)
})

gulp.task('build-debug', function () {
    return gulp.src(build_scripts)
        .pipe(plugins.concat(config.build.debug))
        .pipe(plugins.header("(function(){\nvar DEBUG=true;\n"))
        .pipe(plugins.header(config.banner, { pkg: pkg }))
        .pipe(plugins.footer("})();\n"))
        .pipe(plugins.replace("##VERSION##", pkg.version + "-debug"))
        .pipe(gulp.dest(config.buildDir))
})

gulp.task("build", ['build-debug'], function () {
    var closureCompiler = require('gulp-closure-compiler');

    return gulp.src(config.buildDir + config.build.debug)
        .pipe(plugins.replace("var DEBUG=true", "/** @const */var DEBUG=false"))
        .pipe(closureCompiler(config.closure_options))
        .pipe(plugins.rename(config.build.main))
        .pipe(plugins.header(config.banner, {pkg: pkg}))
        .pipe(gulp.dest(config.buildDir))
})

gulp.task("watch", ['runner'], function () {
    var server = plugins.livereload(config.livereload_port),
        runner_deps = [
            'spec/helpers/runner.template.html',
            'gulpfile.js',
            'knockout.config.yaml',
        ],
        watched = [].concat(config.sources, config.spec_files, setup_scripts,
            build_scripts, ['runner.html'])

    // recompile runner.*.html as needed
    gulp.watch(runner_deps).on('change', function () {
        gulp.start('runner')
    })
    // reload the browser when any of the watched files change
    return gulp.watch(watched).on('change', function (file) {
        server.changed(file.path)
    })
})

function bump(level) {
    return function () {
        gulp.src(config.PACKAGE_FILES)
            .pipe(plugins.bump({type: level}))
            .pipe(gulp.dest("./"))
    }
}

gulp.task("bump-patch", bump('patch'))
gulp.task("bump-minor", bump('minor'))
gulp.task("bump-major", bump('major'))

gulp.task("release", ['build', 'build-debug'], function (done) {
    // Here is a reminder for some related tasks.
    //   To delete tag:
    //     $ git tag -d vX.X.X
    //   To unpublish a tag:
    //     $ git push origin :refs/tags/vX.X.X
    //   To publish to npm:
    //     $ npm publish
    var options = {
        distDir: config.distDir,
        version: "v" + pkg.version,
      },
      commands = {
        add: "git add -f <%= options.distDir %>",
        commit: 'git commit -a -m \"(task) Release <%= options.version %> \"',
        tag: "git tag '<%= options.version %>' -m '(task) Tag <%= options.version %>'",
        reset: "git reset HEAD^1",
        push_tags: "git push origin master --tags"
      };

    // Create dest/ and copies build/output/knockout.js and
    // build/output/knockout-latest.debug.js to dest/
    try {
        fs.mkdirSync(config.distDir)
    } catch (e) {} // ignore directory-exists
    fs.writeFileSync(config.distDir + config.dist.min,
        fs.readFileSync(config.buildDir + config.build.main))
    fs.writeFileSync(config.distDir + config.dist.debug,
        fs.readFileSync(config.buildDir + config.build.debug))

    // See
    // https://github.com/knockout/knockout/issues/1039#issuecomment-37897655
    return gulp.src(options.distDir, {read: false})
        .pipe(plugins.exec(commands.add, options))
        .pipe(plugins.exec(commands.commit, options))
        .pipe(plugins.exec(commands.tag, options))
        .pipe(plugins.exec(commands.reset, options))
        .pipe(plugins.exec(commands.push_tags, options))
        // remove dist/
        .pipe(plugins.clean())
})

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
        .pipe(plugins.replace("AUTOGEN", config.AUTOGEN_WARNING))
        .pipe(plugins.replace("JASMINE_CSS", config.JASMINE_CSS))
        .pipe(replace("SETUP", setup_scripts))
        .pipe(replace("SOURCE", config.sources))
        .pipe(replace("SPECS", config.spec_files))
        .pipe(gulp.dest("./"))
        // create runner with jquery
        .pipe(replace("JQUERY_JS", [config.JQUERY_JS]))
        .pipe(plugins.rename("runner.jquery.html"))
        .pipe(gulp.dest("./"))
        // create runner with modernizr
        .pipe(replace("MODERNIZR_JS", [config.MODERNIZR_JS]))
        .pipe(plugins.rename("runner.modernizr.html"))
        .pipe(gulp.dest("./"))
})

gulp.task('help', function () {
    gutil.log('')
    gutil.log("Usage: gulp task".red)
    gutil.log('')

    Object.keys(gulp.tasks).sort().forEach(function (task_name) {
        var tstr = "   " + task_name.cyan,
            task = gulp.tasks[task_name];
        if (!task.doc) {
            // skip tasks with no doc string.
            return;
        }
        if (task.dep.length > 0) {
            tstr += " (runs: " + task.dep.join(", ") + ")"
        }
        gutil.log(tstr)
        gutil.log("      " + task.doc)
    })
    gutil.log('')
})

// a little help.
gulp.tasks.help.doc = 'Print this help message.'
gulp.tasks.build.doc = 'Create build/output/knockout-latest.js'
gulp.tasks.checkTrailingSpaces.doc = 'Check for trailing whitespace.'
gulp.tasks.lint.doc = 'Check for fuzzies.'
gulp.tasks.release.doc = 'Create new release of Knockout; see release.js'
gulp.tasks.test.doc = 'run node tests (spec/spec.node.js)'
gulp.tasks.watch.doc = 'Watch scripts; livereload runner.*.html on changes.'
gulp.tasks['build-debug'].doc = 'Create build/output/knockout-latest.debug.js'
gulp.tasks['bump-major'].doc = 'Bump version from N.x.x to N+1.x.x'
gulp.tasks['bump-minor'].doc = 'Bump version from x.N.x to x.N+1.x'
gulp.tasks['bump-patch'].doc = 'Bump version from x.x.N to x.x.N+1'
gulp.tasks.clean.doc = "Remove build/output/*.js and dist/. and runner*.html"
gulp.tasks.runner.doc = 'Create runner[.jquery|.modernizr].html'

gulp.task('default', function () {
    gutil.log('')
    gutil.log("Usage: gulp task".red)
    gutil.log('       Enter ' + 'gulp help'.cyan + ' for more info.')
    gutil.log('')
})
