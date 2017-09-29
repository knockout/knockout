ko.bindingHandlers['style'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor() || {});
        ko.utils.objectForEach(value, function(styleName, styleValue) {
            styleValue = ko.utils.unwrapObservable(styleValue);

            if (styleValue === null || styleValue === undefined || styleValue === false) {
                // Empty string removes the value, whereas null/undefined have no effect
                styleValue = "";
            }

            if (jQueryInstance) {
                jQueryInstance(element)['css'](styleName, styleValue);
            } else {
                styleName = styleName.replace(/-(\w)/g, function (all, letter) {
                    return letter.toUpperCase();
                });

                element.style[styleName] = styleValue;

                if (styleValue !== '' && element.style[styleName] == '' && !isNaN(styleValue)) {
                    element.style[styleName] = styleValue + "px";
                }
            }
        });
    }
};
