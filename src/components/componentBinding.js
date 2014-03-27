(function(undefined) {

    var componentViewModelDomDataKey = '_ko_componentvm_' + new Date().valueOf(),
        componentLoadingExpandoProperty = '_ko_componentload_' + new Date().valueOf(),
        componentLoadingOperationUniqueId = 0;

    ko.bindingHandlers['component'] = {
        'init': function(element) {
            ko.utils.domNodeDisposal.addDisposeCallback(element, disposeAssociatedComponentViewModel);

            return { 'controlsDescendantBindings': true };
        },
        'update': function(element, valueAccessor, ignored1, ignored2, bindingContext) {
            var value = valueAccessor(),
                componentName = ko.utils.unwrapObservable(value['name']),
                componentParams = ko.utils.unwrapObservable(value['params']);
            if (!componentName) {
                throw new Error('No component name specified');
            }

            var loadingOperationId = element[componentLoadingExpandoProperty] = ++componentLoadingOperationUniqueId;
            ko.components.get(componentName, function(componentDefinition) {
                // If this is not the current load operation for this element, ignore it.
                if (element[componentLoadingExpandoProperty] !== loadingOperationId) {
                    return;
                }

                // Clean up previous state
                delete element[componentLoadingExpandoProperty];
                disposeAssociatedComponentViewModel(element);

                // Instantiate and bind new component. Implicitly this cleans any old DOM nodes.
                if (!componentDefinition) {
                    throw new Error('Unknown component \'' + componentName + '\'');
                }
                cloneTemplateIntoElement(componentName, componentDefinition, element);
                var componentViewModel = createViewModel(componentDefinition, element, componentParams),
                    childBindingContext = bindingContext['createChildContext'](componentViewModel);
                ko.utils.domData.set(element, componentViewModelDomDataKey, componentViewModel);
                ko.applyBindingsToDescendants(childBindingContext, element);
            });
        }
    };

    ko.virtualElements.allowedBindings['component'] = true;

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

    function disposeAssociatedComponentViewModel(element) {
        var currentViewModel = ko.utils.domData.get(element, componentViewModelDomDataKey),
            currentViewModelDispose = currentViewModel && currentViewModel['dispose'];
        if (typeof currentViewModelDispose === 'function') {
            currentViewModelDispose.call(currentViewModel);
        }
    }

})();
