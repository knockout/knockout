/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    fragments: 'build/fragments',
    banner: '// Knockout JavaScript library v<%= pkg.version %>\n' +
            '// (c) Steven Sanderson - <%= pkg.url %>\n' +
            '// License: <%= pkg.licenses[0].type %> (<%= pkg.licenses[0].url %>)\n\n',
    output: {
      debug: 'build/output/knockout-latest.debug.js',
      min: 'build/output/knockout-latest.js'
    }

  });

  grunt.registerTask('clean', 'Clean up output files.', function (target) {
    var done = this.async();
    var _ = grunt.util._;
    var files = grunt.file.expand('build/output/*.js');
    var options = {force:false};
    if (target == 'force') {
      options.force = true;
    }
    _.forEach(files, function (file) {
      grunt.log.write('Cleaning '.cyan + file + '...');
      grunt.file.delete(file, options);
      grunt.log.ok();
    });
    done();
  });

  grunt.registerTask('buildKnockoutDebug', 'Build a debug version of knockout.', function () {
    var done = this.async();
    var _ = grunt.util._;
    var source = [];
    var fragments = grunt.config('fragments');
    var output = grunt.config('output');
    var newlineEOFPattern = /\s+$/gi;
    var sourceToArrayPattern = /(\s+\/\/.*|\S*\[\s*|\S+\;|\s|')/gim;
    var sourceFiles = [fragments + '/extern-pre.js', fragments + '/amd-pre.js'];
    grunt.verbose.write('Reading: '.cyan + fragments + '/source-references.js...');
    sourceFiles = sourceFiles.concat(grunt.file.read(fragments + '/source-references.js').replace(sourceToArrayPattern, '').split(','));
    grunt.verbose.ok();
    sourceFiles = sourceFiles.concat([fragments + '/amd-post.js', fragments + '/extern-post.js']);
    source.push(grunt.config('banner'));
    source.push('(function(){\n');
    source.push('var DEBUG=true;\n');
    _.forEach(sourceFiles, function (file) {
      grunt.verbose.write('Reading: '.cyan + file +'...');
      source.push(grunt.file.read(file).replace(newlineEOFPattern, '\n'));
      grunt.verbose.ok();
    });
    source.push('})();\n');
    grunt.log.write('Creating: '.cyan + output.debug + '...');
    grunt.file.write(output.debug, grunt.util.normalizelf(source.join('').replace('##VERSION##', grunt.config('pkg.version'))));
    grunt.log.ok();
    done();
  });

  grunt.registerTask('buildKnockoutMin', 'Build a minified version of knockout using Google Closure Compiler.', function () {
    var done = this.async();
    var cc = require('closure-compiler');
    var output = grunt.config('output');
    var banner = grunt.config('banner');
    var options = {
      compilation_level: 'ADVANCED_OPTIMIZATIONS',
      output_wrapper: '(function() {%output%})();'
    };
    grunt.log.write('GCC: '.cyan + output.debug + '...');
    cc.compile(grunt.file.read(output.debug), options, function (err, stdout, stderr) {
      if (err) {
        grunt.error(err);
      }
      grunt.log.ok();
      grunt.log.write('Creating: '.cyan + output.min + '...');
      grunt.file.write(output.min, grunt.util.normalizelf(banner + stdout));
      grunt.log.ok();
      done();
    });
  });

  grunt.registerTask('testPhantomjs', 'Run tests in Phantomjs.', function () {
    var done = this.async();
    var _ = grunt.util._;
    grunt.util.spawn({
      cmd: 'phantomjs',
      args: ['spec/runner.phantom.js']
    }, function (error, result, code) {
      if (error) {
        grunt.log.writeln(String(result).red);
      } else {
        grunt.log.writeln(result + '\n');
      }
      done();
    });
  });

  grunt.registerTask('testJasmine', 'Run tests in Nodejs.', function () {
    var done = this.async();
    grunt.util.spawn({
      cmd: 'node',
      args: ['spec/runner.node.js']
    }, function (error, result, code) {
      if (error) {
        grunt.log.writeln(String(result).red);
      } else {
        grunt.log.write(result + '\n');
      }
      done();
    });
  });

  // Default task.
  grunt.registerTask('forceClean', ['clean:force']);
  grunt.registerTask('test', ['testPhantomjs', 'testJasmine']);
  grunt.registerTask('build', ['clean', 'buildKnockoutDebug', 'buildKnockoutMin']);
  grunt.registerTask('default', ['build', 'test']);

};
