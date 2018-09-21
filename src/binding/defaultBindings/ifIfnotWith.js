(function () {

// Makes a binding like with or if
function makeWithIfBinding(bindingKey, isWith, isNot) {
    ko.bindingHandlers[bindingKey] = {
        'init': function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var savedNodes, wrapCondition = true, withOptions, ifCondition, completeOnRender, needAsyncContext;

            if (isWith) {
                var as = allBindings.get('as'), noChildContext = allBindings.get('noChildContext');
                wrapCondition = as && noChildContext;
                withOptions = { 'as': as, 'noChildContext': noChildContext };
            }

            if (wrapCondition) {
                ifCondition = ko.computed(function() {
                    return !isNot !== !ko.utils.unwrapObservable(valueAccessor());
                }, null, { disposeWhenNodeIsRemoved: element });
            }

            completeOnRender = allBindings.get("completeOn") == "render";
            needAsyncContext = completeOnRender || allBindings['has'](ko.bindingEvent.descendantsComplete);

            ko.computed(function() {
                var value = wrapCondition ? ifCondition() : ko.utils.unwrapObservable(valueAccessor()),
                    shouldDisplay = !!value,
                    isFirstRender = !savedNodes;

                // Save a copy of the inner nodes on the initial update, but only if we have dependencies.
                if (isFirstRender && ko.computedContext.getDependenciesCount()) {
                    savedNodes = ko.utils.cloneNodes(ko.virtualElements.childNodes(element), true /* shouldCleanNodes */);
                }

                if (needAsyncContext) {
                    bindingContext = ko.bindingEvent.startPossiblyAsyncContentBinding(element, bindingContext);
                }

                if (shouldDisplay) {
                    if (!isFirstRender) {
                        ko.virtualElements.setDomNodeChildren(element, ko.utils.cloneNodes(savedNodes));
                    }

                    var childContext;
                    if (isWith) {
                        childContext = bindingContext['createChildContext'](typeof value == "function" ? value : valueAccessor, withOptions);
                    } else if (ifCondition.isActive()) {
                        childContext = bindingContext['extend'](function() { ifCondition(); return null; });
                    } else {
                        childContext = bindingContext;
                    }

                    ko.applyBindingsToDescendants(childContext, element);
                } else {
                    ko.virtualElements.emptyNode(element);

                    if (!completeOnRender) {
                        ko.bindingEvent.notify(element, ko.bindingEvent.childrenComplete);
                    }
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

})();