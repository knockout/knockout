var withIfDomDataKey = '__ko_withIfBindingData';
// Makes a binding like with or if
function makeWithIfBinding(bindingKey, isWith, isNot, makeContextCallback) {
    ko.bindingHandlers[bindingKey] = {
        'init': function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            ko.utils.domData.set(element, withIfDomDataKey, {});
            return { 'controlsDescendantBindings': true };
        },
        'update': function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var withIfData = ko.utils.domData.get(element, withIfDomDataKey),
                dataValue = ko.utils.unwrapObservable(valueAccessor()),
                shouldDisplay = !isNot !== !dataValue, // equivalent to isNot ? !dataValue : !!dataValue
                isFirstRender = !withIfData.savedNodes,
                needsRefresh = isFirstRender || isWith || (shouldDisplay !== withIfData.didDisplayOnLastUpdate);

            if (needsRefresh) {
                if (isFirstRender) {
                    withIfData.savedNodes = ko.utils.cloneNodes(ko.virtualElements.childNodes(element), true /* shouldCleanNodes */);
                }

                if (shouldDisplay) {
                    if (!isFirstRender) {
                        ko.virtualElements.setDomNodeChildren(element, ko.utils.cloneNodes(withIfData.savedNodes));
                    }
                    ko.applyBindingsToDescendants(makeContextCallback ? makeContextCallback(bindingContext, dataValue) : bindingContext, element);
                } else {
                    ko.virtualElements.emptyNode(element);
                }

                withIfData.didDisplayOnLastUpdate = shouldDisplay;
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
