ko.bindingHandlers['style'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor() || {});
        ko.utils.objectForEach(value, function(styleName, styleValue) {
            styleValue = ko.utils.unwrapObservable(styleValue);
            // Empty string removes the value, whereas null/undefined have no effect
            element.style[styleName] = styleValue == null ? "" : styleValue;
        });
    }
};
