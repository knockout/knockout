
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
    
    function applyBindingsToDescendantsInternal (viewModel, nodeVerified) {
        var child;
        for (var i = 0; child = nodeVerified.childNodes[i]; i++) {
            if (child.nodeType === 1)
                applyBindingsToNodeAndDescendantsInternal(viewModel, child);
        }       	
    }
    
    function applyBindingsToNodeAndDescendantsInternal (viewModel, nodeVerified) {
        if (nodeVerified.getAttribute(defaultBindingAttributeName))
            ko.applyBindingsToNode(nodeVerified, null, viewModel);
        applyBindingsToDescendantsInternal(viewModel, nodeVerified);
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
                    for (var bindingKey in parsedBindings) {
                        if (ko.bindingHandlers[bindingKey] && typeof ko.bindingHandlers[bindingKey]["init"] == "function")
                            invokeBindingHandler(ko.bindingHandlers[bindingKey]["init"], node, makeValueAccessor(bindingKey), parsedBindingsAccessor, viewModel);	
                    }                	
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
    
    ko.applyBindingsToDescendants = function(viewModel, node) {
        if ((!node) || (node.nodeType !== 1))
            throw new Error("ko.applyBindingsToDescendants: first parameter should be your view model; second parameter should be a DOM node");
        applyBindingsToDescendantsInternal(viewModel, node);
    };

    ko.applyBindings = function (viewModel, rootNode) {
        if (rootNode && (rootNode.nodeType !== 1))
            throw new Error("ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node");
        rootNode = rootNode || window.document.body; // Make "rootNode" parameter optional
        applyBindingsToNodeAndDescendantsInternal(viewModel, rootNode);
    };
    
    ko.exportSymbol('ko.bindingHandlers', ko.bindingHandlers);
    ko.exportSymbol('ko.applyBindings', ko.applyBindings);
    ko.exportSymbol('ko.applyBindingsToDescendants', ko.applyBindingsToDescendants);
    ko.exportSymbol('ko.applyBindingsToNode', ko.applyBindingsToNode);
})();