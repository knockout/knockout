var unitlessCssProperties = { columnCount: 1, fillOpacity: 1, fontWeight: 1, lineHeight: 1, opacity: 1, orphans: 1, widows: 1, zIndex: 1, zoom: 1 };

ko.bindingHandlers['style'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor() || {});
        ko.utils.objectForEach(value, function(styleName, styleValue) {
            styleValue = ko.utils.unwrapObservable(styleValue);

            // Note that we don't care about zero here
            if (styleValue && typeof(styleValue) === "number" && !(styleName in unitlessCssProperties)) {
            	styleValue += "px";
            }

            // Empty string removes the value, whereas null/undefined have no effect
            element.style[styleName] = styleValue == null ? "" : styleValue;
        });
    }
};
