// Makes a binding like with or if
function makeWithIfBinding(bindingKey, isWith, isNot) {
    ko.bindingHandlers[bindingKey] = {
        'init': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var savedNodes,
                asOption = allBindings.get('as'),
                wrapCondition = !isWith || (asOption && !ko.options['createChildContextWithAs']),
                ifCondition = wrapCondition && ko.computed(function() {
                    return !isNot !== !ko.utils.unwrapObservable(valueAccessor());
                }, null, { disposeWhenNodeIsRemoved: element });

            ko.computed(function() {
                var rawWithValue = !wrapCondition && ko.utils.unwrapObservable(valueAccessor()),
                    shouldDisplay = wrapCondition ? ifCondition() : !!rawWithValue,
                    isFirstRender = !savedNodes;

                // Save a copy of the inner nodes on the initial update, but only if we have dependencies.
                if (isFirstRender && ko.computedContext.getDependenciesCount()) {
                    savedNodes = ko.utils.cloneNodes(ko.virtualElements.childNodes(element), true /* shouldCleanNodes */);
                }

                if (shouldDisplay) {
                    if (!isFirstRender) {
                        ko.virtualElements.setDomNodeChildren(element, ko.utils.cloneNodes(savedNodes));
                    }
                    ko.applyBindingsToDescendants(
                        isWith ?
                            bindingContext['createChildContext'](typeof rawWithValue == "function" ? rawWithValue : valueAccessor, asOption) :
                            ifCondition.isActive() ?
                                bindingContext['extend'](function() { ifCondition(); return null; }) :
                                bindingContext,
                        element);
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
makeWithIfBinding('with', true /* isWith */);
