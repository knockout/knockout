ko.bindingHandlers['using'] = {
    'init': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var innerContext = bindingContext['createChildContext'](valueAccessor);
        ko.applyBindingsToDescendants(innerContext, element);

        return { 'controlsDescendantBindings': true };
    }
};
ko.virtualElements.allowedBindings['using'] = true;
