/*global module:false*/
module.exports = function(grunt) {
    var _ = grunt.util._;

    // Project configuration
    grunt.initConfig({
        // Metadata
        pkg: grunt.file.readJSON('package.json'),
        fragments: './build/fragments/',
        banner: '/*!\n' +
                ' * Knockout JavaScript library v<%= pkg.version %>\n' +
                ' * (c) The Knockout.js team - <%= pkg.homepage %>\n' +
                ' * License: <%= pkg.licenses[0].type %> (<%= pkg.licenses[0].url %>)\n' +
                ' */\n\n',
        build: {
            debug: './build/output/knockout-latest.debug.js',
            min: './build/output/knockout-latest.js'
        },
        dist: {
            debug: './dist/knockout.debug.js',
            min: './dist/knockout.js'
        },
        test: {
            phantomjs: 'spec/runner.phantom.js',
            node: 'spec/runner.node.js'
        }
    });

    function getReferencedSources(sourceReferencesFilename) {
        // Returns the array of filenames referenced by a file like source-references.js
        var result;
        global.knockoutDebugCallback = function(sources) { result = sources; };
        eval(grunt.file.read(sourceReferencesFilename));
        return result;
    }

    function getCombinedSources() {
        var fragments = grunt.config('fragments'),
            sourceFilenames = [
                fragments + 'extern-pre.js',
                fragments + 'amd-pre.js',
                getReferencedSources(fragments + 'source-references.js'),
                fragments + 'amd-post.js',
                fragments + 'extern-post.js'
            ],
            flattenedSourceFilenames = Array.prototype.concat.apply([], sourceFilenames),
            combinedSources = flattenedSourceFilenames.map(function(filename) {
                return grunt.file.read('./' + filename);
            }).join('');

        return combinedSources.replace('##VERSION##', grunt.config('pkg.version'));
    }

    function buildDebug(output) {
        var source = [];
        source.push(grunt.config('banner'));
        source.push('(function(){\n');
        source.push('var DEBUG=true;\n');
        source.push(getCombinedSources());
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
        cc.compile('/**@const*/var DEBUG=false;' + getCombinedSources(), options, function (err, stdout, stderr) {
            if (err) {
                grunt.log.error(err);
                done(false);
            } else {
                grunt.log.ok();
                grunt.file.write(output, (grunt.config('banner') + stdout).replace(/\r\n/g, '\n'));
                done(true);
            }
        });
    }

    grunt.registerMultiTask('build', 'Build', function() {
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

    grunt.registerTask('dist', function() {
        var version = grunt.config('pkg.version'),
            buildConfig = grunt.config('build'),
            distConfig = grunt.config('dist');
        grunt.file.copy(buildConfig.debug, distConfig.debug);
        grunt.file.copy(buildConfig.min, distConfig.min);

        console.log('To publish, run:');
        console.log('    git add bower.json');
        console.log('    git add -f ' + distConfig.debug);
        console.log('    git add -f ' + distConfig.min);
        console.log('    git checkout head');
        console.log('    git commit -m \'Version ' + version + ' for distribution\'');
        console.log('    git tag -a v' + version + ' -m \'Add tag v' + version + '\'');
        console.log('    git checkout master');
        console.log('    git push origin --tags');
    });

    // Default task.
    grunt.registerTask('default', ['build']);
};
