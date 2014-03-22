var unitlessCssProperties = { 'columnCount': 1, 'fillOpacity': 1, 'fontWeight': 1, 'lineHeight': 1, 'opacity': 1, 'orphans': 1, 'widows': 1, 'zIndex': 1, 'zoom': 1 };
var cssBrowserPrefixes = ['Webkit', 'O', 'Moz', 'ms'];
var currentBrowserPrefix;
var cssPropCache = {};
var camelCaseRegex = /-(.)/gi;

function toJavaScriptStyleName (value) {
		return value.replace(camelCaseRegex, function () { return arguments[1].toUpperCase(); });
}

function toBrowserStyleName (style, name) {
	if (name in style) {
		return name;
	}

	var upperCaseName = name.charAt(0).toUpperCase() + name.substr(1);
	var vendorSpecificName;

	if (currentBrowserPrefix) {
		vendorSpecificName = currentBrowserPrefix + upperCaseName;
		if (vendorSpecificName in style) {
			return vendorSpecificName;
		}
	}
	else {
		var i = cssBrowserPrefixes.length;
		while (i--) {
			vendorSpecificName = cssBrowserPrefixes[i] + upperCaseName;
			if (vendorSpecificName in style) {
				// Set the current browser prefix now that we know it
				currentBrowserPrefix = cssBrowserPrefixes[i];
				return vendorSpecificName;
			}
		}
	}

	return name;
}

// Account for discrepancies in `float`
cssPropCache['float'] = cssPropCache['cssFloat'] = cssPropCache['styleFloat'] = document && (function() {
	var div = document.createElement('div');

	// cssFloat is standard though older IE uses styleFloat
	 return 'styleFloat' in div.style ? 'styleFloat' : 'cssFloat';
})();

ko.bindingHandlers['style'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor() || {});
        ko.utils.objectForEach(value, function(styleName, styleValue) {
        		styleName = toJavaScriptStyleName(styleName);
            styleValue = ko.utils.unwrapObservable(styleValue);

            // Note that we don't care about zero here - zero doesn't need a unit
            if (styleValue && typeof(styleValue) === 'number' && !(styleName in unitlessCssProperties)) {
            	styleValue += 'px';
            }

            // Store properties in cache to save on future lookups
            styleName = cssPropCache[styleName] || (cssPropCache[styleName] = toBrowserStyleName(element.style, styleName));

            // Empty string/null/undefined removes the value
            element.style[styleName] = styleValue == null ? '' : styleValue;
        });
    }
};
