(function() {
    function getParam(name) {
        var match = location.search.match(RegExp('[?&]' + name + '=([^&]+)'));
        if (match) {
            return decodeURIComponent(match[1]);
        }
    }

    var dependencies = {
        // All specs should pass with or without jQuery+Modernizr being referenced
        jquery: {
            url: "http://code.jquery.com/jquery-latest.js",
            include: false
        },
        modernizr: {
            url: "http://modernizr.com/downloads/modernizr-latest.js",
            include: false
        },
        // Knockout polyfills
        innershiv: {
            url: "lib/innershiv.js",
            include: true
        },
        json2: {
            url: "lib/json2.js",
            include: true
        }
    };

    for (var name in dependencies) {
        var dependency = dependencies[name],
            url = dependency && dependency.url;
        if (url) {
            var shouldInclude = getParam(name);
            if ((dependency.include || shouldInclude) && shouldInclude !== "0" && shouldInclude !== "false") {
                if (shouldInclude && /^[0-9]+\.[0-9.]+$/.test(shouldInclude)) {
                    url = url.replace('latest', shouldInclude);
                }
                jasmine.addScriptReference(url);
            }
        }
    }

    // By default, we run the tests against knockout-raw.js, but you can specify an alternative test
    // subject as a querystring parameter, e.g., runner.html?src=build/output/knockout-latest.js.
    // This is used by our automated test runners (PhantomJS and Testling CI).
    var koFilename = getParam('src') || "build/knockout-raw.js";
    jasmine.addScriptReference("../" + koFilename);
})();
