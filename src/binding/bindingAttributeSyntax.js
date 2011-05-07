
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

    function invokeBindingHandler(handler, element, valueAccessor, allBindingsAccessor, viewModel, dataStore) {
        handler(element, valueAccessor, allBindingsAccessor, viewModel, dataStore);
    }
    
    function applyBindingsToDescendantsInternal (viewModel, nodeVerified) {
        var child;
        for (var i = 0; child = nodeVerified.childNodes[i]; i++) {
            if (child.nodeType === 1)
                applyBindingsToNodeAndDescendantsInternal(viewModel, child);
        }       	
    }
    
    function applyBindingsToNodeAndDescendantsInternal (viewModel, nodeVerified) {
        var shouldBindDescendants = true;
        if (nodeVerified.getAttribute(defaultBindingAttributeName))
            shouldBindDescendants = ko.applyBindingsToNode(nodeVerified, null, viewModel).shouldBindDescendants;
            
        if (shouldBindDescendants)
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
        
        var bindingsDataStores = {}, bindingHandlerThatControlsDescendantBindings;
        new ko.dependentObservable(
            function () {
                var evaluatedBindings = (typeof bindings == "function") ? bindings() : bindings;
                parsedBindings = evaluatedBindings || parseBindingAttribute(node.getAttribute(bindingAttributeName), viewModel);
                
                // First run all the inits, so bindings can register for notification on changes
                if (isFirstEvaluation) {
                    for (var bindingKey in parsedBindings) {
                        bindingsDataStores[bindingKey] = {};
                        if (ko.bindingHandlers[bindingKey] && typeof ko.bindingHandlers[bindingKey]["init"] == "function") {
                            var handlerInitFn = ko.bindingHandlers[bindingKey]["init"];
                            var dataStore = bindingsDataStores[bindingKey];
                            var initResult = handlerInitFn(node, makeValueAccessor(bindingKey), parsedBindingsAccessor, viewModel, dataStore);
                            
                            // If this binding handler claims to control descendant bindings, make a note of this
                            if (initResult && initResult['controlsDescendantBindings']) {
                                if (bindingHandlerThatControlsDescendantBindings !== undefined)
                                    throw new Error("Multiple bindings (" + bindingHandlerThatControlsDescendantBindings + " and " + bindingKey + ") are trying to control descendant bindings of the same element. You cannot use these bindings together on the same element.");
                                bindingHandlerThatControlsDescendantBindings = bindingKey;
                            }
                        }
                    }                	
                }
                
                // ... then run all the updates, which might trigger changes even on the first evaluation
                for (var bindingKey in parsedBindings) {
                    if (ko.bindingHandlers[bindingKey] && typeof ko.bindingHandlers[bindingKey]["update"] == "function") {
                        var handlerUpdateFn = ko.bindingHandlers[bindingKey]["update"];
                        var dataStore = bindingsDataStores[bindingKey];
                        handlerUpdateFn(node, makeValueAccessor(bindingKey), parsedBindingsAccessor, viewModel, dataStore);
                    }
                }
            },
            null,
            { 'disposeWhenNodeIsRemoved' : node }
        );
        
        isFirstEvaluation = false;
        return { 
            shouldBindDescendants: bindingHandlerThatControlsDescendantBindings === undefined
        };
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