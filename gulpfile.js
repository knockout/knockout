/*global module:false

    Well orchestrated tasks for Knockout.

 */
require('colors')

var
    /* Imports */
    fs = require('fs'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    http = require('http'),
    plugins = require("gulp-load-plugins")(),
    Promise = require('promise'),
    vmap = require('vinyl-map'),
    yaml = require("js-yaml"),
    yargs = require('yargs'),

    // Our settings
    env = process.env,
    pkg = require('./package.json'),
    config = yaml.safeLoad(fs.readFileSync('./config.yaml', 'utf8')),

    // The following are loaded by the browser during testing;
    // in runner.template.html the respective comments are replaced by
    // corresponding <script> tags.
    setup_scripts = [
            "http://localhost:" + config.livereload_port + "/livereload.js",
            config.JASMINE_JS,
            config.JASMINE_HTML_JS,
            "node_modules/jasmine-tapreporter/src/tapreporter.js",
            "spec/helpers/beforeEach.js",
            "spec/helpers/jasmine.browser.js",
            "spec/helpers/loadDependencies.js",
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

gulp.task("test:node", ['build', 'runner'], function () {
    global.ko = require("./" + config.buildDir + config.build.main)
    global.DEBUG = true
    return gulp.src(config.node_spec_files)
        .pipe(plugins.jasmine({verbose: true}))
})

// Webdriver testing
// 
// Start a phantom webdriver listener elsewhere with:
//   $ phantomjs --webdriver=4445
gulp.task("test:phantom", ['build', 'runner'], function (done) {
    var wdr = require('./spec/helpers/webdriverRunner');
    wdr.phantom(config)
        .then(wdr.tests)
        .catch(function (msg) {
            gutil.log("Phantom tests failed: ".red + msg);
            process.exit(1);
        })
})


gulp.task("test:saucelabs", ['build', 'runner'], function (done) {
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
            gutil.log(platform._title.green + "  ✓  ".green)
            return Promise.all([
                wdr.report_to_saucelabs(session_id, true),
                test_platform_promise(stream_id)
            ]);
        }

        function on_fail(msg) {
            failed_platforms.push(platform);
            gutil.log(platform._title.red + " " + "FAIL".bgRed.white.bold +
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


gulp.task('test', ['test:node', 'test:phantom', 'test:saucelabs']);

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
    return gulp.src(config.sources)
        .pipe(plugins.concat(config.build.debug))
        // amd + extern
        .pipe(plugins.header(config.build.headers.join("\n")))
        .pipe(plugins.footer(config.build.footers.join("\n")))
        .pipe(plugins.header("(function(){\nvar DEBUG=true;\n"))
        .pipe(plugins.header(config.banner, { pkg: pkg }))
        .pipe(plugins.footer("})();\n"))
        .pipe(plugins.replace("##VERSION##", pkg.version + "-debug"))
        .pipe(gulp.dest(config.buildDir))
})

if (config.minifier === 'closure' || process.env.MINIFIER === 'closure')
    gulp.task("build", ['build-debug'], function () {
        var closure = require('closure-compiler'),
            through = require('through'),
            file;

        // This is all quite similar to gulp-closure-compiler,
        // except that plugin does not support taking streams
        // i.e. it only takes individual files, which does not
        // agree with the injection of code or concatenation
        // strategy Knockout uses to combine sources in-order with
        // headers and footers added to that.
        function buffer(stream) {
            // This is a degenerate buffer because we have already
            // called `concat`, meaning we are given one vinyl pipe/file.
            file = stream;
        }

        function make() {
            var code = file.contents.toString(),
                self = this;

            function on_compiled(err, stdout, stderr) {
                if (err) {
                    throw new Error({
                        error: err,
                        stdout: stdout,
                        stderr: stderr
                    })
                }
                self.emit("data", new gutil.File({
                    cwd: file.cwd,
                    base: file.base,
                    path: file.path,
                    contents: new Buffer(stdout.replace(/\r\n/g, "\n"))
                }))
                self.emit("end")
            }

            closure.compile(code, config.closure_options, on_compiled);
        }

        return gulp.src(config.sources)
            // combine into one source
            .pipe(plugins.concat(config.build.main))
            // add directive for closure compiler
            .pipe(plugins.header("/** const */var DEBUG=false;"))
            // amd + extern
            .pipe(plugins.header(config.build.headers.join("\n")))
            .pipe(plugins.footer(config.build.footers.join("\n")))
            // compile
            .pipe(through(buffer, make))
            // license / header comment
            .pipe(plugins.header(config.banner, {pkg: pkg}))
            // sub version
            .pipe(plugins.replace("##VERSION##", pkg.version))
            // copy to build directory
            .pipe(gulp.dest(config.buildDir))
    })

else if (config.minifier === 'uglify')
    gulp.task("build", ['build-debug'], function () {
        return gulp.src(config.sources)
            .pipe(plugins.concat(config.build.main))
            .pipe(plugins.header(config.build.headers.join("\n")))
            .pipe(plugins.footer(config.build.footers.join("\n")))
            .pipe(plugins.uglify(config.uglify_options))
            .pipe(plugins.header(config.banner, {pkg: pkg}))
            .pipe(plugins.replace("##VERSION##", pkg.version))
            .pipe(gulp.dest(config.buildDir))
    })

else throw new Error("Unknown minifier in config.yaml: " + config.minifier)

gulp.task("watch", ['runner'], function () {
    var runner_deps = [
            'spec/helpers/runner.template.html',
            'gulpfile.js',
            'config.yaml',
        ],
        watched = [].concat(config.sources, config.spec_files, setup_scripts,
            ['runner.html']),
        server = plugins.livereload.listen(config.livereload_port);

    // recompile runner.*.html as needed
    gulp.watch(runner_deps)
        .on('change', function () {
            gulp.start('runner')
        });

    // reload the browser when any of the watched files change
    gulp.watch(watched)
        .on('change', function(file) {
            plugins.livereload.changed(file.path, server);
        });
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
})

// a little help.
var task_help = {
    help: 'Print this help message.',
    build: 'Create build/output/knockout-latest.js',
    checkTrailingSpaces: 'Check for trailing whitespace.',
    lint: 'Check for fuzzies.',
    release: 'Create new release of Knockout; see release.js',
    test: 'run node tests (spec/spec.node.js)',
    watch: 'Watch scripts; livereload runner.*.html on changes.',
    'build-debug': 'Create build/output/knockout-latest.debug.js',
    'bump-major': 'Bump version from N.x.x to N+1.x.x',
    'bump-minor': 'Bump version from x.N.x to x.N+1.x',
    'bump-patch': 'Bump version from x.x.N to x.x.N+1',
    clean: "Remove build/output/*.js and dist/. and runner*.html",
    runner: 'Create runner[.jquery|.modernizr].html',
}

gulp.task('help', function () {
    gutil.log('')
    gutil.log("Usage: gulp task".red)
    gutil.log('')

    Object.keys(task_help).sort()
        .forEach(function (task_name) {
            var tstr = "   " + task_name.cyan,
                help_str = task_help[task_name],
                task = gulp.tasks[task_name];
            if (task.dep.length > 0) {
                tstr += " [" + task.dep.join(", ") + "]";
            }
            gutil.log(tstr);
            gutil.log("      " + help_str);
        });
    gutil.log('')
})


gulp.tasks.help.doc = 'Print this help message.'
gulp.tasks.build.doc = 'Create build/output/knockout-latest.js'
gulp.tasks.checkTrailingSpaces.doc = 'Check for trailing whitespace.'
gulp.tasks.lint.doc = 'Check for fuzzies.'
gulp.tasks.release.doc = 'Create new release of Knockout; see release.js'
gulp.tasks.test.doc = 'run node tests [test:node, test:phantomjs, test:browserstack]'
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
