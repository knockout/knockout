
(function () {
    var bindingAttributeName = "data-bind";
    ko.bindingHandlers = {};

    function parseBindingAttribute(attributeText, viewModel) {
        try {
            var json = " { " + ko.jsonExpressionRewriting.insertPropertyAccessorsIntoJson(attributeText) + " } ";
            return ko.utils.evalWithinScope(json, viewModel === null ? window : viewModel);
        } catch (ex) {
            throw new Error("Unable to parse binding attribute.\nMessage: " + ex + ";\nAttribute value: " + attributeText);
        }
    }

    function invokeBindingHandler(handler, element, dataValue, allBindings, viewModel) {
        handler(element, dataValue, allBindings, viewModel);
    }

    ko.applyBindingsToNode = function (node, bindings, viewModel) {
        var isFirstEvaluation = true;
        new ko.dependentObservable(
            function () {
                var evaluatedBindings = (typeof bindings == "function") ? bindings() : bindings;
                var parsedBindings = evaluatedBindings || parseBindingAttribute(node.getAttribute(bindingAttributeName), viewModel);
                
                // First run all the inits, so bindings can register for notification on changes
                if (isFirstEvaluation) {
	                for (var bindingKey in parsedBindings) {
	                    if (ko.bindingHandlers[bindingKey] && typeof ko.bindingHandlers[bindingKey]["init"] == "function")
	                        invokeBindingHandler(ko.bindingHandlers[bindingKey]["init"], node, parsedBindings[bindingKey], parsedBindings, viewModel);
	                }                	
                }
                
                // ... then run all the updates, which might trigger changes even on the first evaluation
                for (var bindingKey in parsedBindings) {
                    if (ko.bindingHandlers[bindingKey] && typeof ko.bindingHandlers[bindingKey]["update"] == "function")
                            invokeBindingHandler(ko.bindingHandlers[bindingKey]["update"], node, parsedBindings[bindingKey], parsedBindings, viewModel);
                }
            },
            null,
            { 'disposeWhen' : function () { return !ko.utils.domNodeIsAttachedToDocument(node); } }
        );
        isFirstEvaluation = false;
    };

    ko.applyBindings = function (viewModel, rootNode) {
    	if (rootNode && (rootNode.nodeType == undefined))
    		throw new Error("ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node (note: this is a breaking change since KO version 1.05)");
    	rootNode = rootNode || window.document.body; // Make "rootNode" parameter optional
    			
        var elemsWithBindingAttribute = ko.utils.getElementsHavingAttribute(rootNode, bindingAttributeName);
        ko.utils.arrayForEach(elemsWithBindingAttribute, function (element) {
            ko.applyBindingsToNode(element, null, viewModel);
        });
    };
    
    ko.exportSymbol('ko.bindingHandlers', ko.bindingHandlers);
	ko.exportSymbol('ko.applyBindings', ko.applyBindings);
})();