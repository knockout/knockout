(function () {
    // Normally, SELECT elements and their OPTIONs can only take value of type 'string' (because the values
    // are stored on DOM attributes). ko.selectExtensions provides a way for SELECTs/OPTIONs to have values
    // that are arbitrary objects. This is very convenient when implementing things like cascading dropdowns.
    ko.selectExtensions = {
        readValue : function(element) {
            if (element.tagName == 'OPTION') {
                var valueAttributeValue = element.getAttribute("value");
                if (valueAttributeValue !== ko.bindingHandlers.options.optionValueDomDataKey)
                    return valueAttributeValue;
                return ko.utils.domData.get(element, ko.bindingHandlers.options.optionValueDomDataKey);
            } else if (element.tagName == 'SELECT')
                return element.selectedIndex >= 0 ? ko.selectExtensions.readValue(element.options[element.selectedIndex]) : undefined;
            else
                return element.value;
        },
        
        writeValue: function(element, value) {
            if (element.tagName == 'OPTION') {				
                ko.utils.domData.set(element, ko.bindingHandlers.options.optionValueDomDataKey, value);
                element.value = ko.bindingHandlers.options.optionValueDomDataKey;
            } else if (element.tagName == 'SELECT') {
                for (var i = element.options.length - 1; i >= 0; i--) {
                    if (ko.selectExtensions.readValue(element.options[i]) == value) {
                        element.selectedIndex = i;
                        break;
                    }
                }
            } else
                element.value = value;
        }
    };
})();