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
                var previousStyle;
                var postStyle;
                var requiresGetPropertyValue = (styleName.substring(0, 2) === "--");

                if(requiresGetPropertyValue){
                    previousStyle = element.style.getPropertyValue(styleName);
                    element.style.setProperty(styleName, styleValue);
                    postStyle = element.style.getPropertyValue(styleName);

                    if (styleValue !== previousStyle && postStyle == previousStyle && !isNaN(styleValue)) {
                        element.style.setProperty(styleName, styleValue + "px");
                    }
                } else {
                    styleName = styleName.replace(/-(\w)/g, function (all, letter) {
                        return letter.toUpperCase();
                    });

                    previousStyle = element.style[styleName];
                    element.style[styleName] = styleValue;
                    postStyle = element.style[styleName];

                    if (styleValue !== previousStyle && postStyle == previousStyle && !isNaN(styleValue)) {
                        element.style[styleName] = styleValue + "px";
                    }
                }
            }
        });
    }
};
