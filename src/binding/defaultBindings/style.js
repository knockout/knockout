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
                // Is styleName a custom CSS property?
                if(styleName.substring(0, 2) === "--"){
                    element.style.setProperty(styleName, styleValue);
                    return;
                }

                styleName = styleName.replace(/-(\w)/g, function (all, letter) {
                    return letter.toUpperCase();
                });

                var previousStyle = element.style[styleName];
                element.style[styleName] = styleValue;

                if (styleValue !== previousStyle && element.style[styleName] == previousStyle && !isNaN(styleValue)) {
                    element.style[styleName] = styleValue + "px";
                }
            }
        });
    }
};
