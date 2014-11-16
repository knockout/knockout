//
//  Automated testing of Knockout
//
//
// Run local tests with BrowserStack with e.g.
//  knockout $ ./BrowserStackLocal <<KEY>> -f `pwd`
//  knockout $ WD_HOST=hub.browserstack.com WD_PORT=80
//    WD_USER=brianhunt1 WD_TOKEN=<<key>>
//    gulp test
// 
require('colors');

var wd = require('wd'),
    gutil = require('gulp-util'),
    extend = require('extend'),
    path = require('path'),
    Promise = require('promise'),
    env = process.env,
    token = env.SAUCE_ACCESS_KEY,
    browsers = [],
    cancelled = false;

process.on("SIGINT", function () {
  if (cancelled === true) {
    gutil.log("Ctrl-C received twice. Force-quitting. (Browser instances may persist)".red);
    process.exit(1);
  }
  gutil.log("Ctrl-C received; shutting down browser. Please wait. (Press again to force quit)".red);
  cancelled = true;
  Promise.all(browsers.map(function (b) { return b.quit(); }))
    .then(function () {
      process.exit(1);
    });
});

exports.phantom = function (config) {
  var phantom_host = env.PHANTOM_HOST || 'localhost',
      phantom_port = env.PHANTOM_PORT || 4446,
      browser = wd.promiseChainRemote(phantom_host, phantom_port),
      capabilities = {
        browserName: 'phantomjs'
      };

  return browser.init(capabilities)
    .then(function () {
      return {
        browser: browser,
        name: "PhantomJS",
        uris: [
          'file://' + process.cwd() + '/runner.html',
          'file://' + process.cwd() + '/runner.jquery.html',
          'file://' + process.cwd() + '/runner.modernizr.html',
        ]
      }
    });
};


exports.sauceLabs = function (platform, config) {
  var username = env.SAUCE_USERNAME,
      capabilities = extend({
        'tunnel-identifier': env.TRAVIS_JOB_NUMBER || "LOCAL",
        build: env.CI_AUTOMATE_BUILD || 'Manual',
        javascriptEnabled: true,
        name: 'Knockout',
        project: env.CI_AUTOMATE_PROJECT || 'local - Knockout',
        tags: ['CI'],
      }, platform),
      browser = wd.promiseChainRemote('localhost', 4447, username, token);

  // Additional webdriver logging.
  // browser.on('status', function(info) {
  //   console.log(info.cyan);
  // });
  // browser.on('command', function(eventType, command, response) {
  //   console.log(' > ' + eventType.cyan, command, (response || '').grey);
  // });
  // browser.on('http', function(meth, path, data) {
  //   console.log(' < ' + meth.magenta, path, (data || '').grey);
  // });
  // browser.on('command', function () { process.stdout.write('•') })

  return browser.init(capabilities)
    .then(function () {
      return {
        uris: [
          'http://localhost:7070/runner.html',
          'http://localhost:7070/runner.jquery.html',
          'http://localhost:7070/runner.modernizr.html',
        ],
        browser: browser,
        name: platform.name,
      };
    });
}

function on_results(fails) {
  if (fails.length > 0) {
    throw new Error(fails.join("\n").replace(/not ok \d+/g, function (s) { return s.red; }));
  }
}

function wait_for_results(browser) {
  return function () {
    return browser
          .waitFor(wd.asserters.jsCondition("window && window.tests_complete"), 10000, 1000)
          .safeExecute("window.fails")
          .then(on_results);
  }
}

exports.tests = function tests(spec) {
  if (cancelled) return Promise.reject("Tests cancelled");
  gutil.log(spec.name.blue + " <-o-> Initiated browser");

  browsers.push(spec.browser);

  function on_fin() {
    gutil.log(spec.name.yellow +  " <-/-> Closing browser connection");
    return spec.browser.quit();
  }

  function test_uri(uri) {
    gutil.log(spec.name.white + " <url> " + uri.underline)
    return spec.browser
      .get(uri)
      .then(wait_for_results(spec.browser))
      .then(function() {
        if (spec.uris.length) return test_uri(spec.uris.pop());
      });
  }

  return test_uri(spec.uris.pop())
     .fin(on_fin);
};
