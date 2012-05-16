var fs = require('fs'),
    system = require('system'),
    page = require('webpage').create(),
    specFilename = fs.absolute((system.args.length > 1 && system.args[1]) || 'spec/runner.html'),
    specFailureLog = [];

// Configure the JsSpec runner to test the minified KO build. Paths are relative to specFilename.
page.onInitialized = function() {
    page.evaluate(function() { window.koFilename = '../build/output/knockout-latest.js'; });
};

// Intercept JsSpec log messages and map them to PhantomJS output
page.onConsoleMessage = function(msg) {
    var isExampleCompleted = typeof msg === 'string' && /^Result\:/.test(msg),
        isSuiteCompleted = typeof msg === 'string' && /^Finished\:/.test(msg);

    if (isExampleCompleted) {
        // Parse the JSON and log the example only if it failed
        var exampleResult = JSON.parse(msg.substring(7));
        if (!exampleResult.ok) {
            console.log(msg);
            specFailureLog.push(exampleResult);
        }
    } else if (isSuiteCompleted) {
        console.log('JsSpec ' + msg);
        phantom.exit(specFailureLog.length); // 0 means success
    } else {
        console.log(msg);
    }
};

page.open('file://' + specFilename, function (status) {
    if (status !== 'success') {
        console.log('Error: Could not load the runner page at ' + specFilename);
        phantom.exit(1);
    }
});