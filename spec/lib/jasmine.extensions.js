jasmine.Clock.mockScheduler = function (callback) {
    setTimeout(callback, 0);
};
jasmine.Clock.useMockForTasks = function() {
    jasmine.Clock.useMock();

    // Make sure ko.tasks is using setTimeout so that it uses the mock clock
    if (ko.tasks.scheduler != jasmine.Clock.mockScheduler) {
        jasmine.getEnv().currentSpec.restoreAfter(ko.tasks, 'scheduler');
        ko.tasks.scheduler = jasmine.Clock.mockScheduler;
    }
};

jasmine.Spec.prototype.restoreAfter = function(object, propertyName) {
    var originalValue = object[propertyName];
    this.after(function() {
        object[propertyName] = originalValue;
    });
};

jasmine.Matchers.prototype.toEqualOneOf = function (expectedPossibilities) {
    for (var i = 0; i < expectedPossibilities.length; i++) {
        if (this.env.equals_(this.actual, expectedPossibilities[i])) {
            return true;
        }
    }
    return false;
};

jasmine.Matchers.prototype.toContainHtml = function (expectedHtml, postProcessCleanedHtml) {
    var cleanedHtml = this.actual.innerHTML.toLowerCase().replace(/\r\n/g, "");
    // IE < 9 strips whitespace immediately following comment nodes. Normalize by doing the same on all browsers.
    cleanedHtml = cleanedHtml.replace(/(<!--.*?-->)\s*/g, "$1");
    expectedHtml = expectedHtml.replace(/(<!--.*?-->)\s*/g, "$1");
    // Also remove __ko__ expando properties (for DOM data) - most browsers hide these anyway but IE < 9 includes them in innerHTML
    cleanedHtml = cleanedHtml.replace(/ __ko__\d+=\"(ko\d+|null)\"/g, "");
    if (postProcessCleanedHtml) {
        cleanedHtml = postProcessCleanedHtml(cleanedHtml);
    }
    this.actual = cleanedHtml;      // Fix explanatory message
    return cleanedHtml === expectedHtml;
};

jasmine.nodeText = function(node) {
    return node.nodeType == 3 ? node.data : 'textContent' in node ? node.textContent : node.innerText;
}

jasmine.Matchers.prototype.toContainText = function (expectedText, ignoreSpaces) {
    if (ignoreSpaces) {
        expectedText = expectedText.replace(/\s/g, "");
    }

    var actualText = jasmine.nodeText(this.actual);
    var cleanedActualText = actualText.replace(/\r\n/g, "\n");
    if (ignoreSpaces) {
        cleanedActualText = cleanedActualText.replace(/\s/g, "");
    }

    this.actual = cleanedActualText;    // Fix explanatory message
    return cleanedActualText === expectedText;
};

jasmine.Matchers.prototype.toHaveOwnProperties = function (expectedProperties) {
    var ownProperties = [];
    for (var prop in this.actual) {
        if (this.actual.hasOwnProperty(prop)) {
            ownProperties.push(prop);
        }
    }
    return this.env.equals_(ownProperties, expectedProperties);
};

jasmine.Matchers.prototype.toHaveTexts = function (expectedTexts) {
    var texts = ko.utils.arrayMap(this.actual.childNodes, jasmine.nodeText);
    this.actual = texts;   // Fix explanatory message
    return this.env.equals_(texts, expectedTexts);
};

jasmine.Matchers.prototype.toHaveValues = function (expectedValues) {
    var values = ko.utils.arrayMap(this.actual.childNodes, function (node) { return node.value; });
    this.actual = values;   // Fix explanatory message
    return this.env.equals_(values, expectedValues);
};

jasmine.Matchers.prototype.toHaveSelectedValues = function (expectedValues) {
    var selectedNodes = ko.utils.arrayFilter(this.actual.childNodes, function (node) { return node.selected; }),
        selectedValues = ko.utils.arrayMap(selectedNodes, function (node) { return ko.selectExtensions.readValue(node); });
    this.actual = selectedValues;   // Fix explanatory message
    return this.env.equals_(selectedValues, expectedValues);
};

jasmine.Matchers.prototype.toThrowContaining = function(expected) {
    var exception;
    try {
        this.actual();
    } catch (e) {
        exception = e;
    }
    var exceptionMessage = exception && (exception.message || exception);

    this.message = function () {
        var notText = this.isNot ? " not" : "";
        var expectation = "Expected " + this.actual.toString() + notText + " to throw exception containing '" + expected + "'";
        var result = exception ? (", but it threw '" + exceptionMessage + "'") : ", but it did not throw anything";
        return expectation + result;
    }

    return exception ? this.env.contains_(exceptionMessage, expected) : false;
};

jasmine.addScriptReference = function(scriptUrl) {
    if (window.console)
        console.log("Loading " + scriptUrl + "...");
    document.write("<scr" + "ipt type='text/javascript' src='" + scriptUrl + "'></sc" + "ript>");
};

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

jasmine.browserSupportsProtoAssignment = { __proto__: [] } instanceof Array;
