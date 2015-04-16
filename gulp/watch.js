//
// Tasks related to live-recompile and testing
//

module.exports = function (gulp, plugins, config) {
  // The following are loaded by the browser during testing;
  // in runner.template.html the respective comments are replaced by
  // corresponding <script> tags.
  var setup_scripts = [
          "http://localhost:" + config.livereload_port + "/livereload.js",
          config.JASMINE_JS,
          config.JASMINE_HTML_JS,
          "node_modules/jasmine-tapreporter/src/tapreporter.js",
          "spec/helpers/jasmine.setup.js",
          "spec/helpers/loadDependencies.js",
          "spec/helpers/jasmine.browser.js",
  ];

  gulp.task("watch", "Watch for changes", ['runner'], function () {
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


  gulp.task("runner", "Build the runner.html file", function () {
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
}
