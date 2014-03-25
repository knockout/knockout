(function(undefined) {

    ko.bindingHandlers['component'] = {
        'init': function() {
            return { 'controlsDescendantBindings': true };
        },
        'update': function(element, valueAccessor, ignored1, ignored2, bindingContext) {
            var value = valueAccessor(),
                componentName = ko.unwrap(value['name']),
                componentParams = ko.unwrap(value['params']);
            if (!componentName) {
                throw new Error('No component name specified');
            }

            // TODO: Handle race conditions (if componentDefinitions load in a different order
            // than were requested, ignore all but the most recently requested).
            ko.components.get(componentName, function(componentDefinition) {
                if (!componentDefinition) {
                    throw new Error('Unknown component \'' + componentName + '\'');
                }

                cloneTemplateIntoElement(componentName, componentDefinition, element);

                var componentViewModel = createViewModel(componentDefinition, element, componentParams),
                    childBindingContext = bindingContext['createChildContext'](componentViewModel);
                ko.applyBindingsToDescendants(childBindingContext, element);
            });
        }
    };

    function cloneTemplateIntoElement(componentName, componentDefinition, element) {
        var template = componentDefinition['template'];
        if (!template) {
            throw new Error('Component \'' + componentName + '\' has no template');
        }

        var clonedNodesArray = ko.utils.makeArray(template.cloneNode(true).childNodes);
        ko.virtualElements.setDomNodeChildren(element, clonedNodesArray);
    }

    function createViewModel(componentDefinition, element, componentParams) {
        var componentViewModelFactory = componentDefinition['createViewModel'];
        return componentViewModelFactory
            ? componentViewModelFactory({ element: element }, componentParams)
            : componentParams; // Template-only component
    }

})();
