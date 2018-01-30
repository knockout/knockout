ko.bindingHandlers['when'] = {
    'init': function(element, valueAccessor) {
        var template;
        var asyncContext = ko.bindingEvent.startPossiblyAsyncContentBinding(element);

        ko.computed(function () {
            var value = ko.utils.unwrapObservable(valueAccessor());
            if (value) {
                ko.computedContext.computed().dispose();
                if (template) {
                    ko.virtualElements.setDomNodeChildren(element, ko.utils.makeArray(template.childNodes));
                }
                ko.applyBindingsToDescendants(asyncContext.extend(), element);
            } else if (!template) {
                template = element.ownerDocument.createElement('div');
                ko.utils.setDomNodeChildren(template, ko.utils.makeArray(ko.virtualElements.childNodes(element)));
            }
        }, null, { disposeWhenNodeIsRemoved: element });

        return { 'controlsDescendantBindings': true };
    }
};
ko.virtualElements.allowedBindings['when'] = true;
