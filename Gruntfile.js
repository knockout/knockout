/*global module:false*/
module.exports = function(grunt) {
    var _ = grunt.util._;

    // Project configuration
    grunt.initConfig({
        // Metadata
        pkg: grunt.file.readJSON('package.json'),
        fragments: './build/fragments/',
        banner: '// Knockout JavaScript library v<%= pkg.version %>\n' +
                '// (c) Steven Sanderson - <%= pkg.url %>\n' +
                '// License: <%= pkg.licenses[0].type %> (<%= pkg.licenses[0].url %>)\n\n',

        checktrailingspaces: {
            main: {
                src: [
                    "**/*.{js,html,css,bat,ps1,sh}",
                    "!build/output/**",
                    "!node_modules/**"
                ],
                filter: 'isFile'
            }
        },
        build: {
            debug: './build/output/knockout-latest.debug.js',
            min: './build/output/knockout-latest.js'
        },
        test: {
            phantomjs: 'spec/runner.phantom.js',
            node: 'spec/runner.node.js'
        }
    });

    grunt.registerTask('clean', 'Clean up output files.', function (target) {
        var output = grunt.config('build');
        var files = [ output.debug, output.min ];
        var options = { force: (target == 'force') };
        _.forEach(files, function (file) {
            if (grunt.file.exists(file))
                grunt.file.delete(file, options);
        });
        return !this.errorCount;
    });

    var trailingSpaceRegex = /[ ]$/;
    grunt.registerMultiTask('checktrailingspaces', 'checktrailingspaces', function() {
        var matches = [];
        this.files[0].src.forEach(function(filepath) {
            var content = grunt.file.read(filepath),
                lines = content.split(/\r*\n/);
            lines.forEach(function(line, index) {
                if (trailingSpaceRegex.test(line)) {
                    matches.push([filepath, (index+1), line].join(':'));
                }
            });
        });
        if (matches.length) {
            grunt.log.error("The following files have trailing spaces that need to be cleaned up:");
            grunt.log.writeln(matches.join('\n'));
            return false;
        }
    });

    var combinedSources;
    function combineSources() {
        var source = [];
        var fragments = grunt.config('fragments');
        function readFragment(fragment) {
            source.push(grunt.file.read(fragments + fragment));
        }
        global.knockoutDebugCallback = function(sources) {
            _.forEach(sources, function (file) {
                source.push(grunt.file.read('./' + file));
            });
        };
        readFragment('extern-pre.js');
        readFragment('amd-pre.js');
        require(fragments + 'source-references');
        readFragment('amd-post.js');
        readFragment('extern-post.js');
        combinedSources = source.join('').replace('##VERSION##', grunt.config('pkg.version'));
    }

    function buildDebug(output) {
        var source = [];
        source.push(grunt.config('banner'));
        source.push('(function(){\n');
        source.push('var DEBUG=true;\n');
        source.push(combinedSources);
        source.push('})();\n');
        grunt.file.write(output, source.join('').replace(/\r\n/g, '\n'));
    }

    function buildMin(output, done) {
        var cc = require('closure-compiler');
        var options = {
            compilation_level: 'ADVANCED_OPTIMIZATIONS',
            output_wrapper: '(function() {%output%})();'
        };
        grunt.log.write('Compiling...');
        cc.compile('/**@const*/var DEBUG=false;' + combinedSources, options, function (err, stdout, stderr) {
            if (err) {
                grunt.error(err);
                done(false);
            } else {
                grunt.log.ok();
                grunt.file.write(output, (grunt.config('banner') + stdout).replace(/\r\n/g, '\n'));
                done(true);
            }
        });
    }

    grunt.registerMultiTask('build', 'Build', function() {
        if (!combinedSources)
            combineSources();

        if (!this.errorCount) {
            var output = this.data;
            if (this.target === 'debug') {
                buildDebug(output);
            } else if (this.target === 'min') {
                buildMin(output, this.async());
            }
        }
        return !this.errorCount;
    });

    grunt.registerMultiTask('test', 'Run tests', function () {
        var done = this.async();
        grunt.util.spawn({ cmd: this.target, args: [this.data] },
            function (error, result, code) {
                if (code === 127 /*not found*/) {
                    grunt.verbose.error(result.stderr);
                    // ignore this error
                    done(true);
                } else {
                    grunt.log.writeln(result.stdout);
                    if (error)
                        grunt.log.error(result.stderr);
                    done(!error);
                }
            }
        );
    });

    // Default task.
    grunt.registerTask('default', ['clean', 'checktrailingspaces', 'build', 'test']);
};
