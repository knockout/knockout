(function () {
    // Normally, SELECT elements and their OPTIONs can only take value of type 'string' (because the values
    // are stored on DOM attributes). ko.selectExtensions provides a way for SELECTs/OPTIONs to have values
    // that are arbitrary objects. This is very convenient when implementing things like cascading dropdowns.
    ko.selectExtensions = {
        readValue : function(element) {
            if (element.tagName == 'OPTION') {
                if (element['__ko__hasDomDataOptionValue__'] === true)
                    return ko.utils.domData.get(element, ko.bindingHandlers.options.optionValueDomDataKey);
                return element.getAttribute("value");
            } else if (element.tagName == 'SELECT')
                return element.selectedIndex >= 0 ? ko.selectExtensions.readValue(element.options[element.selectedIndex]) : undefined;
            else
                return element.value;
        },
        
        writeValue: function(element, value) {
            if (element.tagName == 'OPTION') {
                switch(typeof value) {
                    case "string":
                    case "number":
                        ko.utils.domData.set(element, ko.bindingHandlers.options.optionValueDomDataKey, undefined);
                        if ('__ko__hasDomDataOptionValue__' in element) { // IE <= 8 throws errors if you delete non-existent properties from a DOM node
                            delete element['__ko__hasDomDataOptionValue__'];
                        }
                        element.value = value;                                   
                        break;
                    default:
                        // Store arbitrary object using DomData
                        ko.utils.domData.set(element, ko.bindingHandlers.options.optionValueDomDataKey, value);
                        element['__ko__hasDomDataOptionValue__'] = true;
                        element.value = "";
                        break;
                }			
            } else if (element.tagName == 'SELECT') {
                for (var i = element.options.length - 1; i >= 0; i--) {
                    if (ko.selectExtensions.readValue(element.options[i]) == value) {
                        element.selectedIndex = i;
                        break;
                    }
                }
            } else {
                if ((value === null) || (value === undefined))
                    value = "";
                element.value = value;
            }
        }
    };        
})();

ko.exportSymbol('ko.selectExtensions', ko.selectExtensions);
ko.exportSymbol('ko.selectExtensions.readValue', ko.selectExtensions.readValue);
ko.exportSymbol('ko.selectExtensions.writeValue', ko.selectExtensions.writeValue);
