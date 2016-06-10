// Makes a binding like with or if
function makeWithIfBinding(bindingKey, isWith, isNot) {
    ko.bindingHandlers[bindingKey] = {
        'init': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var savedNodes;
            var ifCondition = !isWith && ko.computed(function() {
                return !isNot !== !ko.utils.unwrapObservable(valueAccessor());
            }, null, { disposeWhenNodeIsRemoved: element });

            ko.computed(function() {
                var rawWithValue = isWith && ko.utils.unwrapObservable(valueAccessor()),
                    shouldDisplay = isWith ? !!rawWithValue : ifCondition(),
                    isFirstRender = !savedNodes,
                    renderNodes;

                // Save a copy of the inner nodes on the initial update, but only if we have dependencies.
                if (isFirstRender && ko.computedContext.getDependenciesCount()) {
                    savedNodes = ko.utils.cloneNodes(renderNodes = ko.virtualElements.childNodes(element), true /* shouldCleanNodes */);
                }

                if (shouldDisplay) {
                    if (!isFirstRender) {
                        ko.virtualElements.setDomNodeChildren(element, renderNodes = ko.utils.cloneNodes(savedNodes));
                    }
                    var newContext = isWith ?
                            bindingContext['createChildContext'](typeof rawWithValue == "function" ? rawWithValue : valueAccessor, allBindings.get('as')) :
                            ifCondition.isActive() ?
                                bindingContext['extend'](function() { ifCondition(); return null; }) :
                                bindingContext;
                    ko.applyBindingsToDescendants(newContext, element);
                    if (allBindings.has('afterRender')) {
                        ko.dependencyDetection.ignore(allBindings.get('afterRender'), null, [renderNodes || ko.virtualElements.childNodes(element), newContext['$data']]);
                    }
                } else {
                    ko.virtualElements.emptyNode(element);
                }
            }, null, { disposeWhenNodeIsRemoved: element });

            return { 'controlsDescendantBindings': true };
        }
    };
    ko.expressionRewriting.bindingRewriteValidators[bindingKey] = false; // Can't rewrite control flow bindings
    ko.virtualElements.allowedBindings[bindingKey] = true;
}

// Construct the actual binding handlers
makeWithIfBinding('if');
makeWithIfBinding('ifnot', false /* isWith */, true /* isNot */);
makeWithIfBinding('with', true /* isWith */, false /* isNot */);
