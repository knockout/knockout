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
require('colors')

var wd = require('wd'),
    gutil = require('gulp-util'),
    extend = require('extend'),
    path = require('path'),
    Promise = require('promise'),
    env = process.env,
    token = env.WD_TOKEN,
    browsers = [],
    cancelled = false;

if (!token) {
  throw new Error("Set WD_TOKEN in your environment to that of your BrowserStack account.");
}

process.on("SIGINT", function () {
  if (cancelled === true) {
    gutil.log("Ctrl-C received twice. Force-quitting. (Browser instances may persist)".red);
    process.exit(1);
  }
  gutil.log("Ctrl-C received; shutting down browser. Please wait. (Press again to force quit)".red)
  cancelled = true;
  Promise.all(browsers.map(function (b) { return b.quit () }))
    .then(function () {
      process.exit(1);
    });
});


exports.start_tests =
function start_tests(platform, config) {
  if (cancelled) return Promise.reject("Tests cancelled")
  var username = env.WD_USER || config.webdriver.user;
      capabilities = extend({
        'browserstack.local': true,
        'browserstack.debug' : 'true',
        'tunner-identifier': env.TRAVIS_JOB_NUMBER || "",
        build: env.CI_AUTOMATE_BUILD || 'Manual',
        javascriptEnabled: true,
        name: 'Knockout',
        project: env.CI_AUTOMATE_PROJECT || 'local - Knockout',
        tags: ['CI'],
      }, platform),
      wd_host = env.WD_HOST || config.webdriver.host || 'localhost',
      wd_port = env.WD_PORT || config.webdriver.port || 4445,
      uri = 'http://' + username + '.browserstack.com/runner.html',
      browser =  wd.promiseChainRemote(
        wd_host, wd_port, username, token
      );

  gutil.log(platform.name.blue + " <-o-> Initiating browser")

  function on_results(fails) {
    if (fails.length > 0) {
      throw new Error(fails.join("\n").replace(/not ok \d+/g, function (s) { return s.red }));
    }
  }

  function on_fin() {
    gutil.log(platform.name.yellow +  " <-/-> Closing browser connection");
    return browser.quit();
  }

  browsers.push(browser);

  return browser
    .init(capabilities)
    .setAsyncScriptTimeout(config.webdriver.timeout)
    .get(uri)
    .waitForConditionInBrowser("window && window.tests_complete")
    .safeExecute("window.fails")
    .then(on_results)
    .fin(on_fin)
}
