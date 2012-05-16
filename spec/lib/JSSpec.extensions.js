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

JSSpec.addScriptReference = function(scriptUrl) {
    if (window.console)
        console.log("Loading " + scriptUrl + "...");
    document.write("<scr" + "ipt type='text/javascript' src='" + scriptUrl + "'></sc" + "ript>");
};