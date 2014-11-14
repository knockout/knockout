//
//  Automated testing of Knockout
//
// Run local tests on Sauce Labs with:
// $ WD_HOST=localhost
//     WD_PORT=4445 SAUCE_USERNAME=brianmhunt
//     SAUCE_ACCESS_KEY=... npm test
// ^^^ requires Sauce Connect to be listening on 4445.
//
// Run local tests with BrowserStack with e.g.
//  knockout $ ./BrowserStackLocal <<KEY>> -f `pwd`
//  knockout $ WD_HOST=hub.browserstack.com WD_PORT=80
//    BS_KEY=<<key>> BS_USER=brianhunt1
//    gulp test
require('colors')

var wd = require('wd'),
    gutil = require('gulp-util'),
    extend = require('extend'),
    path = require('path'),
    env = process.env,
    username = env.BS_USER || env.WD_USER,
    token = env.BS_KEY || env.WD_TOKEN;

if (!username || !token) {
  throw new Error("Set WD_USER and WD_TOKEN in your environment to that of your BrowserStack account.");
}

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
  var capabilities = extend({
        'browserstack.local': true,
        'tunner-identifier': env.TRAVIS_JOB_NUMBER || "",
        build: env.CI_AUTOMATE_BUILD || 'Manual',
        javascriptEnabled: true,
        name: 'Knockout',
        project: env.BS_AUTOMATE_PROJECT || 'local - Knockout',
        tags: ['CI'],
      }, platform),
      wd_host = env.WD_HOST || config.webdriver.host || 'localhost',
      wd_port = env.WD_PORT || config.webdriver.port || 4445,
      // uri = 'http://localhost:' + config.server_port + '/runner.html',
      uri = 'http://brianhunt1.browserstack.com/runner.html',
      browser =  wd.promiseChainRemote(
        wd_host, wd_port, username, token
      );

  process.on("SIGINT", on_sigint);

  gutil.log();
  gutil.log(platform.name.yellow)
  gutil.log("Connecting to Webdriver at " + wd_host.blue + ":" + (""+wd_port).blue)

  function on_results(fails) {
    if (fails.length > 0) {
      throw new Error(fails.join("\n").replace(/not ok \d+/g, function (s) { return s.red }));
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
    .setAsyncScriptTimeout(config.webdriver.timeout)
    .get(uri)
    .waitForConditionInBrowser("window.tests_complete", config.webdriver.timeout,
                               config.webdriver.poll)
    // .waitFor(wd.asserters.jsCondition('window.tests_complete', false),
    //          config.webdriver.timeout, config.webdriver.poll)
    .safeExecute("window.fails")
    .then(on_results)
    .fin(on_fin)
}
