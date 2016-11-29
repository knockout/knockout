(function(undefined) {

    var componentLoadingOperationUniqueId = 0;

    ko.bindingHandlers['component'] = {
        'init': function(element, valueAccessor, ignored1, ignored2, bindingContext) {
            var currentViewModel,
                currentLoadingOperationId,
                componentAfterRenderHandle,
                disposeAssociatedComponentViewModel = function () {
                    if (componentAfterRenderHandle) {
                        ko.tasks.cancel(componentAfterRenderHandle);
                    }
                    var currentViewModelDispose = currentViewModel && currentViewModel['dispose'];
                    if (typeof currentViewModelDispose === 'function') {
                        currentViewModelDispose.call(currentViewModel);
                    }
                    currentViewModel = null;
                    // Any in-flight loading operation is no longer relevant, so make sure we ignore its completion
                    currentLoadingOperationId = null;
                    componentAfterRenderHandle = null;
                },
                rescheduleComponentAfterRender = function () {
                    componentAfterRenderHandle = ko.tasks.reschedule(componentAfterRenderHandle);
                    if (typeof bindingContext._rescheduleComponentAfterRender === 'function') {
                        bindingContext._rescheduleComponentAfterRender();
                    }
                },
                scheduleComponentAfterRender = function (childBindingContext) {
                    childBindingContext._rescheduleComponentAfterRender = rescheduleComponentAfterRender;
                    if (componentAfterRenderHandle) {
                        ko.tasks.cancel(componentAfterRenderHandle);
                    }
                    var currentViewModelafterRender = currentViewModel && currentViewModel['afterRender'];
                    if (typeof currentViewModelafterRender === 'function') {
                        componentAfterRenderHandle = ko.tasks.schedule(function () {
                            componentAfterRenderHandle = null;
                            currentViewModelafterRender.call(currentViewModel, element);
                        });
                        if (typeof bindingContext._rescheduleComponentAfterRender === 'function') {
                            bindingContext._rescheduleComponentAfterRender();
                        }
                    }
                },
                originalChildNodes = ko.utils.makeArray(ko.virtualElements.childNodes(element));

            ko.utils.domNodeDisposal.addDisposeCallback(element, disposeAssociatedComponentViewModel);

            ko.computed(function () {
                var value = ko.utils.unwrapObservable(valueAccessor()),
                    componentName, componentParams;

                if (typeof value === 'string') {
                    componentName = value;
                } else {
                    componentName = ko.utils.unwrapObservable(value['name']);
                    componentParams = ko.utils.unwrapObservable(value['params']);
                }

                if (!componentName) {
                    throw new Error('No component name specified');
                }

                var loadingOperationId = currentLoadingOperationId = ++componentLoadingOperationUniqueId,
                    completedAsync;
                ko.components.get(componentName, function(componentDefinition) {
                    // If this is not the current load operation for this element, ignore it.
                    if (currentLoadingOperationId !== loadingOperationId) {
                        return;
                    }

                    // Clean up previous state
                    disposeAssociatedComponentViewModel();

                    // Instantiate and bind new component. Implicitly this cleans any old DOM nodes.
                    if (!componentDefinition) {
                        throw new Error('Unknown component \'' + componentName + '\'');
                    }
                    cloneTemplateIntoElement(componentName, componentDefinition, element);
                    var componentViewModel = createViewModel(componentDefinition, element, originalChildNodes, componentParams),
                        childBindingContext = bindingContext['createChildContext'](componentViewModel, /* dataItemAlias */ undefined, function(ctx) {
                            ctx['$component'] = componentViewModel;
                            ctx['$componentTemplateNodes'] = originalChildNodes;
                        });
                    currentViewModel = componentViewModel;
                    ko.applyBindingsToDescendants(childBindingContext, element);

                    if (completedAsync) {
                        scheduleComponentAfterRender(childBindingContext);
                    } else {
                        var currentViewModelafterRender = currentViewModel && currentViewModel['afterRender'];
                        if (typeof currentViewModelafterRender === 'function') {
                            ko.dependencyDetection.ignore(currentViewModelafterRender, currentViewModel, [element]);
                        }
                    }
                });
                completedAsync = true;
            }, null, { disposeWhenNodeIsRemoved: element });

            return { 'controlsDescendantBindings': true };
        }
    };

    ko.virtualElements.allowedBindings['component'] = true;

    function cloneTemplateIntoElement(componentName, componentDefinition, element) {
        var template = componentDefinition['template'];
        if (!template) {
            throw new Error('Component \'' + componentName + '\' has no template');
        }

        var clonedNodesArray = ko.utils.cloneNodes(template);
        ko.virtualElements.setDomNodeChildren(element, clonedNodesArray);
    }

    function createViewModel(componentDefinition, element, originalChildNodes, componentParams) {
        var componentViewModelFactory = componentDefinition['createViewModel'];
        return componentViewModelFactory
            ? componentViewModelFactory.call(componentDefinition, componentParams, { 'element': element, 'templateNodes': originalChildNodes })
            : componentParams; // Template-only component
    }

})();
