(function () {
    var defaultBindingAttributeName = "data-bind";
    ko.bindingHandlers = {};

    function bindingContext(dataItem) {
        this['$data'] = dataItem;
    }

    function parseBindingAttribute(attributeText, viewModel, extraScope) {
        try {
            var json = " { " + ko.jsonExpressionRewriting.insertPropertyAccessorsIntoJson(attributeText) + " } ";
            return ko.utils.evalWithinScope(json, viewModel === null ? window : viewModel, extraScope);
        } catch (ex) {
            throw new Error("Unable to parse binding attribute.\nMessage: " + ex + ";\nAttribute value: " + attributeText);
        }
    }

    function applyBindingsToDescendantsInternal (viewModel, nodeVerified, options) {
        var child;
        for (var i = 0; child = nodeVerified.childNodes[i]; i++) {
            if (child.nodeType === 1)
                applyBindingsToNodeAndDescendantsInternal(viewModel, child, options);
        }       	
    }
    
    function applyBindingsToNodeAndDescendantsInternal (viewModel, nodeVerified, options) {
        var shouldBindDescendants = true;
        if (nodeVerified.getAttribute(defaultBindingAttributeName))
            shouldBindDescendants = applyBindingsToNodeInternal(nodeVerified, null, viewModel, options).shouldBindDescendants;
            
        if (shouldBindDescendants)
            applyBindingsToDescendantsInternal(viewModel, nodeVerified, options);
    }    

    function applyBindingsToNodeInternal (node, bindings, viewModel, options) {
        // Ensure we have a nonnull binding context to work with
        options = options || {};
        options['_bindingContext'] = options['_bindingContext'] || new bindingContext(viewModel);
        
        var isFirstEvaluation = true;
        var bindingAttributeName = options['bindingAttributeName'] || defaultBindingAttributeName;
            
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
        
        var optionsPerBinding = {}, bindingHandlerThatControlsDescendantBindings;
        new ko.dependentObservable(
            function () {
                var evaluatedBindings = (typeof bindings == "function") ? bindings() : bindings;
                parsedBindings = evaluatedBindings || parseBindingAttribute(node.getAttribute(bindingAttributeName), viewModel, options['_bindingContext']);
                
                // First run all the inits, so bindings can register for notification on changes
                if (isFirstEvaluation) {
                    for (var bindingKey in parsedBindings) {
                        optionsPerBinding[bindingKey] = {
                            'valueAccessor': makeValueAccessor(bindingKey),
                            'dataStore': {}
                        };
                        if (ko.bindingHandlers[bindingKey] && typeof ko.bindingHandlers[bindingKey]["init"] == "function") {
                            var handlerInitFn = ko.bindingHandlers[bindingKey]["init"];
                            var initResult = handlerInitFn(node, optionsPerBinding[bindingKey]['valueAccessor'], parsedBindingsAccessor, viewModel, optionsPerBinding[bindingKey]);
                            
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
                        handlerUpdateFn(node, optionsPerBinding[bindingKey]['valueAccessor'], parsedBindingsAccessor, viewModel, optionsPerBinding[bindingKey]);
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

    ko.applyBindingsToNode = function (node, bindings, viewModel, options) {
        return applyBindingsToNodeInternal(node, bindings, viewModel, options);
    };
    
    ko.applyBindingsToDescendants = function(viewModel, node, options) {
        if ((!node) || (node.nodeType !== 1))
            throw new Error("ko.applyBindingsToDescendants: first parameter should be your view model; second parameter should be a DOM node");
        applyBindingsToDescendantsInternal(viewModel, node, options);
    };

    ko.applyBindings = function (viewModel, rootNode, options) {
        if (rootNode && (rootNode.nodeType !== 1))
            throw new Error("ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node");
        rootNode = rootNode || window.document.body; // Make "rootNode" parameter optional
        applyBindingsToNodeAndDescendantsInternal(viewModel, rootNode, options);
    };
    
    ko.exportSymbol('ko.bindingHandlers', ko.bindingHandlers);
    ko.exportSymbol('ko.applyBindings', ko.applyBindings);
    ko.exportSymbol('ko.applyBindingsToDescendants', ko.applyBindingsToDescendants);
    ko.exportSymbol('ko.applyBindingsToNode', ko.applyBindingsToNode);
})();