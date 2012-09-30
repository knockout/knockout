var withIfDomDataKey = '__ko_withIfBindingData';
// Makes a binding like with or if
function makeWithIfBinding(bindingKey, isWith, isNot, makeContextCallback) {
    ko.bindingHandlers[bindingKey] = {
        'init': function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            ko.utils.domData.set(element, withIfDomDataKey, { isFirstRender: true });
            return { 'controlsDescendantBindings': true };
        },
        'update': function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var withData = ko.utils.domData.get(element, withIfDomDataKey),
                dataValue = ko.utils.unwrapObservable(valueAccessor()),
                shouldDisplay = isNot ? !dataValue : !!dataValue, // Ensure it's really a bool, to avoid storing extra refs to model objects
                needsRefresh = withData.isFirstRender || isWith || (shouldDisplay !== withData.didDisplayOnLastUpdate);

            if (needsRefresh) {
                if (withData.isFirstRender) {
                    withData.savedNodes = ko.utils.cloneNodes(ko.virtualElements.childNodes(element));
                }

                if (shouldDisplay) {
                    if (!withData.isFirstRender) {
                        ko.virtualElements.setDomNodeChildren(element, ko.utils.cloneNodes(withData.savedNodes));
                    }
                    ko.applyBindingsToDescendants(makeContextCallback ? makeContextCallback(bindingContext, dataValue) : bindingContext, element);
                } else {
                    ko.virtualElements.emptyNode(element);
                }

                withData.isFirstRender = false;
                withData.didDisplayOnLastUpdate = shouldDisplay;
            }
        }
    };
    ko.expressionRewriting.bindingRewriteValidators[bindingKey] = false; // Can't rewrite control flow bindings
    ko.virtualElements.allowedBindings[bindingKey] = true;
}

// Construct the actual binding handlers
makeWithIfBinding('if');
makeWithIfBinding('ifnot', false /* isWith */, true /* isNot */);
makeWithIfBinding('with', true /* isWith */, false /* isNot */,
    function(bindingContext, dataValue) {
        return bindingContext['createChildContext'](dataValue);
    }
);
