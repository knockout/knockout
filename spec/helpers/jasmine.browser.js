/*
    This script is included in runner[.jquery|.modernize].js
 */
var DEBUG = true,

    // Use a different variable name (not 'jQuery') to avoid overwriting
    // window.jQuery with 'undefined' on IE < 9
    jQueryInstance = window.jQuery;

/*
    Some helper functions for jasmine on the browser
 */
jasmine.prepareTestNode = function() {
    // The bindings specs make frequent use of this utility function to set up
    // a clean new DOM node they can execute code against
    var existingNode = document.getElementById("testNode");
    if (existingNode != null)
        existingNode.parentNode.removeChild(existingNode);
    testNode = document.createElement("div");
    testNode.id = "testNode";
    document.body.appendChild(testNode);
};


jasmine.Spec.prototype.restoreAfter = function(object, propertyName) {
    var originalValue = object[propertyName];
    this.after(function() {
        object[propertyName] = originalValue;
    });
};

jasmine.nodeText = function(node) {
    return 'textContent' in node ? node.textContent : node.innerText;
}

jasmine.browserSupportsProtoAssignment = { __proto__: [] } instanceof Array;

// Note that, since IE 10 does not support conditional comments, the following logic only detects IE < 10.
// Currently this is by design, since IE 10+ behaves correctly when treated as a standard browser.
// If there is a future need to detect specific versions of IE10+, we will amend this.
jasmine.ieVersion = typeof(document) == 'undefined' ? undefined : (function() {
    var version = 3, div = document.createElement('div'), iElems = div.getElementsByTagName('i');

    // Keep constructing conditional HTML blocks until we hit one that resolves to an empty fragment
    while (
        div.innerHTML = '<!--[if gt IE ' + (++version) + ']><i></i><![endif]-->',
            iElems[0]
        );
    return version > 4 ? version : undefined;
}());

/*
    Misc. settings
 */
function start_jasmine_tests() {
    window.fails = [];
    var jasmineEnv = jasmine.getEnv(),
        htmlReporter = new jasmine.HtmlReporter(),
        tapReporter = new TAPReporter(function (m) {
            console.log(m);
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
    }
    jasmineEnv.addReporter(tapReporter);
    window.onload = function () {
        jasmineEnv.execute();
    }
}
