(function () {
    var defaultBindingAttributeName = "data-bind";
    ko.bindingHandlers = {};

    ko.bindingContext = function(dataItem, parentBindingContext) {
        this['$data'] = dataItem;
        if (parentBindingContext) {
            this['$parent'] = parentBindingContext['$data'];
            this['$parents'] = (parentBindingContext['$parents'] || []).slice(0);
            this['$parents'].unshift(this['$parent']);
            this['$root'] = parentBindingContext['$root'];
        } else {
            this['$parents'] = [];
            this['$root'] = dataItem;        	
        }
    }
    ko.bindingContext.prototype = {
        createChildContext: function (dataItem) {
            return new ko.bindingContext(dataItem, this);
        }
    };

    function parseBindingAttribute(attributeText, viewModel, extraScope) {
        try {
            var json = " { " + ko.jsonExpressionRewriting.insertPropertyAccessorsIntoJson(attributeText) + " } ";
            return ko.utils.evalWithinScope(json, viewModel === null ? window : viewModel, extraScope);
        } catch (ex) {
            throw new Error("Unable to parse binding attribute.\nMessage: " + ex + ";\nAttribute value: " + attributeText);
        }
    }

    function applyBindingsToDescendantsInternal (viewModel, elementVerified) {
        var currentChild = elementVerified.childNodes[0];
        while (currentChild) {
            applyBindingsToNodeAndDescendantsInternal(viewModel, currentChild, false);
            currentChild = ko.virtualElements.nextSibling(currentChild);
        }
    }
    
    function applyBindingsToNodeAndDescendantsInternal (viewModel, nodeVerified, isRootNodeForBindingContext) {
        var shouldBindDescendants = true;

        // Apply bindings only if:
        // (1) It's a root element for this binding context, as we will need to store the binding context on this node
        //     Note that we can't store binding contexts on non-elements (e.g., text nodes), as IE doesn't allow expando properties for those
        // (2) It might have bindings (e.g., it has a data-bind attribute, or it's a marker for a containerless template)
        var isElement = (nodeVerified.nodeType == 1);
        var isContainerlessTemplate = ko.virtualElements.virtualNodeBindingValue(nodeVerified);
        var domDataBindings = ko.utils.domData.get(nodeVerified, "bindings");
        var shouldApplyBindings = isContainerlessTemplate                                                // Case (2)
                               || domDataBindings                                                        // Case (2)
                               || (isElement && isRootNodeForBindingContext)                             // Case (1)
                               || (isElement && nodeVerified.getAttribute(defaultBindingAttributeName)); // Case (2)
        
        if (shouldApplyBindings)
            shouldBindDescendants = applyBindingsToNodeInternal(nodeVerified, domDataBindings, viewModel, isRootNodeForBindingContext).shouldBindDescendants;
            
        if (isElement && shouldBindDescendants)
            applyBindingsToDescendantsInternal(viewModel, nodeVerified);
    }    

    function applyBindingsToNodeInternal (node, bindings, viewModelOrBindingContext, isRootNodeForBindingContext) {
        var isFirstEvaluation = true;
        var bindingAttributeName = defaultBindingAttributeName; // Todo: Make this overridable
            
        // Pre-process any anonymous template bounded by comment nodes
        ko.virtualElements.extractAnonymousTemplateIfVirtualElement(node);

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
        
        var bindingHandlerThatControlsDescendantBindings;
        new ko.dependentObservable(
            function () {
                // Ensure we have a nonnull binding context to work with
                var bindingContextInstance = viewModelOrBindingContext && (viewModelOrBindingContext instanceof ko.bindingContext)
                    ? viewModelOrBindingContext
                    : new ko.bindingContext(ko.utils.unwrapObservable(viewModelOrBindingContext));
                var viewModel = bindingContextInstance['$data'];

                // We only need to store the bindingContext at the root of the subtree where it applies
                // as all descendants will be able to find it by scanning up their ancestry
                if (isRootNodeForBindingContext)
                    ko.storedBindingContextForNode(node, bindingContextInstance);

                var evaluatedBindings = (typeof bindings == "function") ? bindings() : bindings;
                var bindingAttributeValue = ((node.nodeType == 1) && node.getAttribute(bindingAttributeName))
                                         || ko.virtualElements.virtualNodeBindingValue(node);
                if (evaluatedBindings || bindingAttributeValue) {
                    parsedBindings = evaluatedBindings || parseBindingAttribute(bindingAttributeValue, viewModel, bindingContextInstance);
                    
                    // First run all the inits, so bindings can register for notification on changes
                    if (isFirstEvaluation) {
                        for (var bindingKey in parsedBindings) {
                            if (ko.bindingHandlers[bindingKey] && typeof ko.bindingHandlers[bindingKey]["init"] == "function") {
                                var handlerInitFn = ko.bindingHandlers[bindingKey]["init"];
                                var initResult = handlerInitFn(node, makeValueAccessor(bindingKey), parsedBindingsAccessor, viewModel, bindingContextInstance);
                                
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
                            handlerUpdateFn(node, makeValueAccessor(bindingKey), parsedBindingsAccessor, viewModel, bindingContextInstance);
                        }
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

    var storedBindingContextDomDataKey = "__ko_bindingContext__";
    ko.storedBindingContextForNode = function (node, bindingContext) {
        if (arguments.length == 2)
            ko.utils.domData.set(node, storedBindingContextDomDataKey, bindingContext);
        else
            return ko.utils.domData.get(node, storedBindingContextDomDataKey);
    }

    ko.applyBindingsToNode = function (node, bindings, viewModel) {
        return applyBindingsToNodeInternal(node, bindings, viewModel, true);
    };

    ko.applyBindings = function (viewModel, rootNode) {
        if (rootNode && (rootNode.nodeType !== 1) && (rootNode.nodeType !== 8))
            throw new Error("ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node");
        rootNode = rootNode || window.document.body; // Make "rootNode" parameter optional

        // An opportunity for bindings to be applied externally
        if (typeof ko['beforeApplyBindings'] === "function")
            ko['beforeApplyBindings'](rootNode);

        applyBindingsToNodeAndDescendantsInternal(viewModel, rootNode, true);
    };

    // Retrieving binding context from arbitrary nodes
    ko.contextFor = function(node) {
        var context = ko.storedBindingContextForNode(node);
        if (context) return context;
        if (node.parentNode) return ko.contextFor(node.parentNode);
        return undefined;
    };
    ko.dataFor = function(node) {
        var context = ko.contextFor(node);
        return context ? context['$data'] : undefined;
    };    
    
    ko.exportSymbol('ko.bindingHandlers', ko.bindingHandlers);
    ko.exportSymbol('ko.applyBindings', ko.applyBindings);
    ko.exportSymbol('ko.applyBindingsToNode', ko.applyBindingsToNode);
    ko.exportSymbol('ko.contextFor', ko.contextFor);
    ko.exportSymbol('ko.dataFor', ko.dataFor);
})();