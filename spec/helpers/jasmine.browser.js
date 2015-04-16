/*
    This script starts jasmine tests.
 */
var DEBUG = true,

    // Use a different variable name (not 'jQuery') to avoid overwriting
    // window.jQuery with 'undefined' on IE < 9
    jQueryInstance = window.jQuery,
    amdRequire = window.require;

/*
    Misc. settings
 */
function start_jasmine_tests() {
    window.fails = [];
    var jasmineEnv = jasmine.getEnv(),
        htmlReporter = new jasmine.HtmlReporter(),
        tapReporter = new TAPReporter(function (m) {
            if (m.substr(0,2) != 'ok') {
                console.log(m);
            }
            if (m.substr(0,3) == '1..') {
                window.tests_complete = true;
            } else if (m.substr(0,2) != 'ok') {
                window.fails.push(m);
            }
        });

    jasmine.updateInterval = 500;
    jasmineEnv.addReporter(htmlReporter);
    jasmineEnv.specFilter = function (spec) {
        return htmlReporter.specFilter(spec);
    };
    jasmineEnv.addReporter(tapReporter);
    window.onload = function () {
        jasmineEnv.execute();
    };
}
