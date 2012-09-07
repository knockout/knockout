var withIfDomDataKey = '__ko_withIfBindingData';
// Makes a binding like with or if
function makeWithIfBinding(bindingKey, isWith, isNot, makeContextCallback) {
    ko.bindingHandlers[bindingKey] = {
        'init': function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var dataValue = ko.utils.unwrapObservable(valueAccessor()),
                nodesArray = ko.virtualElements.childNodes(element);

            if (!dataValue !== !isNot /* equivalent to isNot ? !dataValue : dataValue */) {
                // When the data value is initially truthy (or falsy for ifnot), save a copy of the nodes and bind to the originals
                nodesArray = ko.utils.cloneNodes(nodesArray);
                ko.applyBindingsToDescendants(makeContextCallback ? makeContextCallback(bindingContext, dataValue) : bindingContext, element);
            }

            // Store the copied nodes and the previous value for later
            ko.utils.domData.set(element, withIfDomDataKey, {
                savedNodes: ko.utils.moveCleanedNodesToContainerElement(nodesArray),
                savedDataValue: dataValue});

            return { 'controlsDescendantBindings': true };
        },
        'update': function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var withData = ko.utils.domData.get(element, withIfDomDataKey),
                savedDataValue = withData.savedDataValue,
                dataValue = ko.utils.unwrapObservable(valueAccessor());

            // Check to see if the value has changed; for with, compare the values, for if/ifnot, compare the truthiness of the values
            if (isWith ? (savedDataValue !== dataValue) : (!savedDataValue !== !dataValue)) {
                if (!dataValue !== !isNot) {
                    // If new value is truthy (or falsy for ifnot), replace nodes and re-bind
                    ko.virtualElements.setDomNodeChildren(element, ko.utils.cloneNodes(withData.savedNodes.childNodes));
                    ko.applyBindingsToDescendants(makeContextCallback ? makeContextCallback(bindingContext, dataValue) : bindingContext, element);
                } else {
                    // If new value is falsy, clear the nodes
                    ko.virtualElements.emptyNode(element);
                }
                withData.savedDataValue = dataValue;
            }
        }
    };
    ko.expressionRewriting.bindingRewriteValidators[bindingKey] = false; // Can't rewrite control flow bindings
    ko.virtualElements.allowedBindings[bindingKey] = true;
}

makeWithIfBinding('if');
