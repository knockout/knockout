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
            url: "http://code.jquery.com/jquery-1.11.3.js",
            include: false,
            versionString: "1.11.3"
        },
        modernizr: {
            url: "http://modernizr.com/downloads/modernizr-latest.js",
            include: false
        },
        // Knockout polyfills
        innershiv: {
            // Note: innerShiv is deprecated in favour of html5shiv (https://github.com/aFarkas/html5shiv)
            // KO retains back-compatible support for innershiv, but we will consider dropping this and
            // supporting only html5shiv as of the next major version of KO (unless KO itself drops support
            // for IE 6-8 in the next major version, in which case this is all irrelevant).
            // It doesn't really matter very much, because essentially everyone who targets IE6-8 is also
            // using jQuery, and if you are using jQuery then you don't need innerShiv.
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
                if (shouldInclude && shouldInclude !== "1" && shouldInclude !== "true") {
                    url = url.replace(dependency.versionString || 'latest', shouldInclude);
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
