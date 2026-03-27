ko.bindingHandlers['polymer'] = {
    'init': function (element, valueAccessor, allBindings) {
        var eventsToHandle = valueAccessor() || {};
        ko.utils.objectForEach(eventsToHandle, function (eventName, value) {
            if (typeof eventName == "string") {
                var polymerEvent = eventName.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase() + '-changed';
                var listener = function(e) {
                    value(e.detail.value);
                };
                element.addEventListener(polymerEvent, listener);
                ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    element.removeEventListener(polymerEvent, listener);
                });
            }
        });
    },
    'update': function (element, valueAccessor, allBindings) {
        var value = ko.utils.unwrapObservable(valueAccessor()) || {};
        ko.utils.objectForEach(value, function (attrName, attrValue) {
            attrValue = ko.utils.unwrapObservable(attrValue);
            element[attrName] = attrValue;
        });
    }
};
