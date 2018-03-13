(function () {

// Makes a binding like with or if
function makeWithIfBinding(bindingKey, isWith, isNot, isWhen) {
    ko.bindingHandlers[bindingKey] = {
        'init': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var savedNodes, asOption, wrapCondition, ifCondition, contextToExtend;

            if (isWith) {
                asOption = allBindings.get('as');
                wrapCondition = asOption && !ko.options['createChildContextWithAs'];
            } else {
                wrapCondition = true;
            }

            if (wrapCondition) {
                ifCondition = ko.computed(function() {
                    return !isNot !== !ko.utils.unwrapObservable(valueAccessor());
                }, null, { disposeWhenNodeIsRemoved: element });
            }

            if (isWhen) {
                contextToExtend = ko.bindingEvent.startPossiblyAsyncContentBinding(element);
            } else {
                contextToExtend = bindingContext;
            }

            ko.computed(function() {
                var rawWithValue, shouldDisplay, isFirstRender = !savedNodes;

                if (wrapCondition) {
                    shouldDisplay = ifCondition();
                } else {
                    rawWithValue = ko.utils.unwrapObservable(valueAccessor());
                    shouldDisplay = !!rawWithValue;
                }

                // Save a copy of the inner nodes on the initial update, but only if we have dependencies.
                if (isFirstRender && ko.computedContext.getDependenciesCount()) {
                    savedNodes = ko.utils.cloneNodes(ko.virtualElements.childNodes(element), true /* shouldCleanNodes */);
                }

                if (shouldDisplay) {
                    if (!isFirstRender) {
                        ko.virtualElements.setDomNodeChildren(element, ko.utils.cloneNodes(savedNodes));
                    }

                    var childContext;
                    if (isWith) {
                        childContext = bindingContext['createChildContext'](typeof rawWithValue == "function" ? rawWithValue : valueAccessor, asOption);
                    } else if (ifCondition.isActive()) {
                        childContext = contextToExtend['extend'](function() { ifCondition(); return null; });
                    } else {
                        childContext = bindingContext;
                    }

                    ko.applyBindingsToDescendants(childContext, element);
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
makeWithIfBinding('when', false /* isWith */, false /* isNot */, true /* isWhen */);

})();