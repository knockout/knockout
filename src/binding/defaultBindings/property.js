ko.bindingHandlers['property'] = {
    'update': function (element, valueAccessor, allBindings) {
        var value = ko.utils.unwrapObservable(valueAccessor()) || {};
        ko.utils.objectForEach(value, function (attrName, attrValue) {
            attrValue = ko.utils.unwrapObservable(attrValue);
            element[attrName] = attrValue;
        });
    }
};
