//
//  Automated testing of Knockout
//
// Run local tests on Sauce Labs with:
// $ SELENIUM_HOST=localhost
//     SELENIUM_PORT=4445 SAUCE_USERNAME=brianmhunt
//     SAUCE_ACCESS_KEY=... npm test
// ^^^ requires Sauce Connect to be listening on 4445.
//
// Run local tests with BrowserStack with e.g.
//  $ ./BrowserStackLocal <<KEY>> localhost,4445,0
//  $ SELENIUM_HOST=hub.browserstack.com SELENIUM_PORT=80
//    BS_KEY=<<key>> BS_USER=brianhunt1
//    gulp test
require('colors')

var webdriver = require('wd'),
    gutil = require('gulp-util'),
    extend = require('extend'),
    path = require('path'),
    env = process.env;

var on_sigint = function () {
  gutil.log("\n\tCtrl-C received; shutting down browser\n".red)
  if (browser) {
    browser.quit(function () { process.exit(1) })
  } else {
    process.exit(1)
  }
}

exports.start_tests =
function start_tests(platform, config) {
  var username, token;
  var capabilities = {
    'browserstack.local': true,
    'tunner-identifier': env.TRAVIS_JOB_NUMBER || "",
    build: env.CI_AUTOMATE_BUILD || 'Manual',
    javascriptEnabled: true,
    name: 'Knockout',
    project: env.BS_AUTOMATE_PROJECT || 'local - Knockout',
    tags: ['CI'],
  };

  extend(capabilities, platform);

  username = env.BS_USER;
  token = env.BS_KEY;
  var selenium_host = env.SELENIUM_HOST || 'localhost';
  var selenium_port = env.SELENIUM_PORT || 4445;
  var uri = 'http://localhost:' + config.server_port + '/runner.html';

  gutil.log();
  gutil.log(platform.name.yellow)

  var browser =  webdriver.promiseChainRemote(
    selenium_host, selenium_port, username, token
  );

  process.on("SIGINT", on_sigint)

  var attempts = 5;
  var poll = 1000;
  // timeout = poll * attempts

  function on_results(fails) {
    console.log("[", platform.name.red, "]", fails);
    if (fails.length > 0) {
      throw new Error(platform.name);
    }
  }

  function on_fin() {
    return browser
      .quit()
      .fin(function () {
        process.removeListener('SIGINT', on_sigint);
      })
  }

  return browser
    .init(capabilities)
    .setAsyncScriptTimeout(10000)
    .get(uri)
    .waitForConditionInBrowser("window.tests_complete", 10000)
    .safeExecute("window.fails.toString()")
    .then(on_results)
    .fin(on_fin)
}
