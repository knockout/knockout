ko.bindingHandlers['submit'] = {
    'init': function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        ko.bindingHandlers.event.init(element, function() {
            return {
                "submit": function(event) {
                    return valueAccessor().call(this, element);
                }
            }
        }, allBindings, viewModel, bindingContext);
    }
};
