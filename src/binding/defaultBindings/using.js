ko.bindingHandlers['using'] = {
    'init': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var options;

        if (allBindings['has']('as')) {
            options = { 'as': allBindings.get('as'), 'noChildContext': allBindings.get('noChildContext') };
        }

        var innerContext = bindingContext['createChildContext'](valueAccessor, options);
        ko.applyBindingsToDescendants(innerContext, element);

        return { 'controlsDescendantBindings': true };
    }
};
ko.virtualElements.allowedBindings['using'] = true;
