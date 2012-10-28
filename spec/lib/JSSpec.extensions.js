JSSpec.DSL.Subject.prototype.should_be_one_of = function (expectedPossibilities) {
    for (var i = 0; i < expectedPossibilities.length; i++) {
        var matcher = JSSpec.EqualityMatcher.createInstance(expectedPossibilities[i], this.target);
        if (matcher.matches())
            return;
    }
    JSSpec._assertionFailure = { message: "Should be one of the values: " + expectedPossibilities.toString() + "; was: " + this.target.toString() };
    throw JSSpec._assertionFailure;
};

JSSpec.DSL.Subject.prototype.should_contain = function (expected) {
    if (this.target.indexOf(expected) >= 0)
        return;
    JSSpec._assertionFailure = { message: "Should contain: " + expected.toString() + "; was: " + this.target.toString() };
    throw JSSpec._assertionFailure;
};

JSSpec.DSL.Subject.prototype.should_contain_html = function (expectedHtml) {
    var cleanedHtml = this.target.innerHTML.toLowerCase().replace(/\r\n/g, "");
    // IE < 9 strips whitespace immediately following comment nodes. Normalize by doing the same on all browsers.
    cleanedHtml = cleanedHtml.replace(/(<!--.*?-->)\s*/g, "$1");
    expectedHtml = expectedHtml.replace(/(<!--.*?-->)\s*/g, "$1");
    // Also remove __ko__ expando properties (for DOM data) - most browsers hide these anyway but IE < 9 includes them in innerHTML
    cleanedHtml = cleanedHtml.replace(/ __ko__\d+=\"(ko\d+|null)\"/g, "");
    JSSpec.DSL.Subject.prototype.should_be.call({ target: cleanedHtml }, expectedHtml);
};

JSSpec.DSL.Subject.prototype.should_contain_text = function (expectedText) {
    var actualText = 'textContent' in this.target ? this.target.textContent : this.target.innerText;
    var cleanedActualText = actualText.replace(/\r\n/g, "\n");
    JSSpec.DSL.Subject.prototype.should_be.call({ target: cleanedActualText }, expectedText);
};

JSSpec.DSL.Subject.prototype.should_have_own_properties = function (expectedProperties) {
    var ownProperties = [];
    for (var prop in this.target) {
        if (this.target.hasOwnProperty(prop)) {
            ownProperties.push(prop);
        }
    }
    value_of(ownProperties).should_be(expectedProperties);
};

JSSpec.DSL.Subject.prototype.should_have_selected_values = function (expectedValues) {
    var selectedNodes = ko.utils.arrayFilter(this.target.childNodes, function (node) { return node.selected; }),
        selectedValues = ko.utils.arrayMap(selectedNodes, function (node) { return ko.selectExtensions.readValue(node); });
    value_of(selectedValues).should_be(expectedValues);
};

JSSpec.addScriptReference = function(scriptUrl) {
    if (window.console)
        console.log("Loading " + scriptUrl + "...");
    document.write("<scr" + "ipt type='text/javascript' src='" + scriptUrl + "'></sc" + "ript>");
};

JSSpec.prepareTestNode = function() {
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
JSSpec.Browser.IEVersion = (function() {
    var version = 3, div = document.createElement('div'), iElems = div.getElementsByTagName('i');

    // Keep constructing conditional HTML blocks until we hit one that resolves to an empty fragment
    while (
        div.innerHTML = '<!--[if gt IE ' + (++version) + ']><i></i><![endif]-->',
        iElems[0]
    );
    return version > 4 ? version : undefined;
}());