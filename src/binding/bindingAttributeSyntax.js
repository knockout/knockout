
(function () {
    var defaultBindingAttributeName = "data-bind";
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

    ko.applyBindingsToNode = function (node, bindings, viewModel, bindingAttributeName) {
        var isFirstEvaluation = true;
        bindingAttributeName = bindingAttributeName || defaultBindingAttributeName;

        // Each time the dependentObservable is evaluated (after data changes),
        // the binding attribute is reparsed so that it can pick out the correct
        // model properties in the context of the changed data.
        // DOM event callbacks need to be able to access this changed data,
        // so we need a single parsedBindings variable (shared by all callbacks
        // associated with this node's bindings) that all the closures can access.
        var parsedBindings;
        function makeValueAccessor(bindingKey) {
            return function () { return parsedBindings[bindingKey] }
        }
        function parsedBindingsAccessor() {
            return parsedBindings;
        }
        
        new ko.dependentObservable(
            function () {
                var evaluatedBindings = (typeof bindings == "function") ? bindings() : bindings;
                parsedBindings = evaluatedBindings || parseBindingAttribute(node.getAttribute(bindingAttributeName), viewModel);
                
                // First run all the inits, so bindings can register for notification on changes
                if (isFirstEvaluation) {
                	var propagateBindings = true;
                    for (var bindingKey in parsedBindings) {
                        if (ko.bindingHandlers[bindingKey]) {
                        	if(typeof ko.bindingHandlers[bindingKey]["init"] == "function")
                            	invokeBindingHandler(ko.bindingHandlers[bindingKey]["init"], node, makeValueAccessor(bindingKey), parsedBindingsAccessor, viewModel);
                            propagateBindings &= !ko.bindingHandlers[bindingKey]["customChildBinding"];
                        }
                    }
                    
                    // A binding can handle the binding of its element's children - in this case, we don't want to
                    // automatically bind them.
                    if(propagateBindings) ko.applyBindingsToChildren(viewModel, node);
                }
                
                // ... then run all the updates, which might trigger changes even on the first evaluation
                for (var bindingKey in parsedBindings) {
                    if (ko.bindingHandlers[bindingKey] && typeof ko.bindingHandlers[bindingKey]["update"] == "function")
                        invokeBindingHandler(ko.bindingHandlers[bindingKey]["update"], node, makeValueAccessor(bindingKey), parsedBindingsAccessor, viewModel);
                }
            },
            null,
            { 'disposeWhenNodeIsRemoved' : node }
        );
        isFirstEvaluation = false;
    };
	
	ko.applyBindingsToChildren = function (viewModel, parentNode) {
		ko.utils.arrayForEach(parentNode.childNodes, function(element) {
        	if(element.nodeType === 1) ko.applyBindings(viewModel, element);
        });
	};
	
    ko.applyBindings = function (viewModel, rootNode) {
        if (rootNode && (rootNode.nodeType == undefined))
            throw new Error("ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node (note: this is a breaking change since KO version 1.05)");
        rootNode = rootNode || window.document.body; // Make "rootNode" parameter optional
        
       	if (rootNode.getAttribute(defaultBindingAttributeName) !== null) {
            ko.applyBindingsToNode(rootNode, null, viewModel);
       	} else {
       		ko.applyBindingsToChildren(viewModel, rootNode);
       	};
    };
    
    ko.removeBindingsFromChildren = function (parentNode) {
    	var children = ko.utils.arrayUpdate([], parentNode.childNodes);
    	for(var i = 0; i < children.length; i++) {
    		ko.removeNode(children[i]);
    	};
    	for(var i = 0; i < children.length; i++) {
    		parentNode.appendChild(children[i]);
    	};
    };
    
    ko.exportSymbol('ko.bindingHandlers', ko.bindingHandlers);
    ko.exportSymbol('ko.applyBindings', ko.applyBindings);
    ko.exportSymbol('ko.applyBindingsToNode', ko.applyBindingsToNode);
    ko.exportSymbol('ko.applyBindingsToChildren', ko.applyBindingsToChildren)
    ko.exportSymbol('ko.removeBindingsFromChildren', ko.removeBindingsFromChildren);
})();