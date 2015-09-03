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
            // Note: Nobody should use innershiv - it's deprecated in favour of html5shiv (https://github.com/aFarkas/html5shiv)
            // Using innershiv will prevent you from using custom elements on IE6/7, since innershiv always
            // parses HTML inside a new temporary document context, meaning that the document.createElement('my-element')
            // trick won't work.
            // Knockout retains backward-compatible support for innershiv just to avoid breaking any applications that
            // use innershiv-supported HTML5 elements (section, etc.) even though it's incompatible with custom elements.
            // KO should drop innershiv support completely as of the next major KO version.
            url: "lib/innershiv.js",
            include: false
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
