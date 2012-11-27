(function () {
    ko.bindingHandlers = {};

    // Use an overridable method for retrieving binding handlers so that a plugins may support dynamically created handlers
    ko['getBindingHandler'] = function(bindingKey) {
        return ko.bindingHandlers[bindingKey];
    };

    ko.bindingContext = function(dataItem, parentBindingContextOrOptions, dataItemAlias) {
        if (parentBindingContextOrOptions && (parentBindingContextOrOptions instanceof ko.bindingContext)) {
            var parentBindingContext = parentBindingContextOrOptions;
            ko.utils.extend(this, parentBindingContext); // Inherit $root and any custom properties
            this['$parentContext'] = parentBindingContext;
            this['$parent'] = parentBindingContext['$data'];
            this['$parents'] = (parentBindingContext['$parents'] || []).slice(0);
            this['$parents'].unshift(this['$parent']);
            parentBindingContextOrOptions = parentBindingContext['$options'];
        } else {
            this['$parents'] = [];
            this['$root'] = dataItem;
            // Export 'ko' in the binding context so it will be available in bindings and templates
            // even if 'ko' isn't exported as a global, such as when using an AMD loader.
            // See https://github.com/SteveSanderson/knockout/issues/490
            this['ko'] = ko;
        }
        this['$options'] = ko.utils.extend({}, parentBindingContextOrOptions);
        this['$data'] = dataItem;
        if (dataItemAlias)
            this[dataItemAlias] = dataItem;
    }
    ko.bindingContext.prototype['createChildContext'] = function (dataItem, dataItemAlias) {
        return new ko.bindingContext(dataItem, this, dataItemAlias);
    };
    ko.bindingContext.prototype['extend'] = function(properties) {
        var clone = ko.utils.extend(new ko.bindingContext(), this);
        return ko.utils.extend(clone, properties);
    };

    function wrapValue(value) {
        return function() {
            return value;
        };
    }

    function unwrapValue(valueAccessor) {
        return valueAccessor();
    }

    function makeAccessorsFromFunction(callback) {
        return ko.utils.objectMap(ko.dependencyDetection.ignore(callback), function(value, key) {
            return function() {
                return callback()[key];
            };
        });
    }

    function makeBindingAccessors(bindings, context, node) {
        if (typeof bindings === 'function') {
            return makeAccessorsFromFunction(bindings.bind(null, context, node));
        } else {
            return ko.utils.objectMap(bindings, wrapValue);
        }
    }

    // This function can be used if the binding provider doesn't include a getBindingAccessors function
    // It must be called with 'this' set to the provider instance.
    function defaultGetBindingAccessors(node, context) {
        return makeAccessorsFromFunction(this['getBindings'].bind(this, node, context));
    }

    function validateThatBindingIsAllowedForVirtualElements(bindingName) {
        var validator = ko.virtualElements.allowedBindings[bindingName];
        if (!validator)
            throw new Error("The binding '" + bindingName + "' cannot be used with virtual elements")
    }

    function applyBindingsToDescendantsInternal (bindingContext, elementOrVirtualElement, bindingContextsMayDifferFromDomParentElement) {
        var currentChild, nextInQueue = ko.virtualElements.firstChild(elementOrVirtualElement);
        while (currentChild = nextInQueue) {
            // Keep a record of the next child *before* applying bindings, in case the binding removes the current child from its position
            nextInQueue = ko.virtualElements.nextSibling(currentChild);
            applyBindingsToNodeAndDescendantsInternal(bindingContext, currentChild, bindingContextsMayDifferFromDomParentElement);
        }
    }

    function applyBindingsToNodeAndDescendantsInternal (bindingContext, nodeVerified, bindingContextMayDifferFromDomParentElement) {
        var shouldBindDescendants = true;

        // Perf optimisation: Apply bindings only if...
        // (1) We need to store the binding context on this node (because it may differ from the DOM parent node's binding context)
        //     Note that we can't store binding contexts on non-elements (e.g., text nodes), as IE doesn't allow expando properties for those
        // (2) It might have bindings (e.g., it has a data-bind attribute, or it's a marker for a containerless template)
        var isElement = (nodeVerified.nodeType === 1);
        if (isElement) // Workaround IE <= 8 HTML parsing weirdness
            ko.virtualElements.normaliseVirtualElementDomStructure(nodeVerified);

        var shouldApplyBindings = (isElement && bindingContextMayDifferFromDomParentElement)             // Case (1)
                               || ko.bindingProvider['instance']['nodeHasBindings'](nodeVerified);       // Case (2)
        if (shouldApplyBindings)
            shouldBindDescendants = applyBindingsToNodeInternal(nodeVerified, null, bindingContext, bindingContextMayDifferFromDomParentElement)['shouldBindDescendants'];

        if (shouldBindDescendants) {
            // We're recursing automatically into (real or virtual) child nodes without changing binding contexts. So,
            //  * For children of a *real* element, the binding context is certainly the same as on their DOM .parentNode,
            //    hence bindingContextsMayDifferFromDomParentElement is false
            //  * For children of a *virtual* element, we can't be sure. Evaluating .parentNode on those children may
            //    skip over any number of intermediate virtual elements, any of which might define a custom binding context,
            //    hence bindingContextsMayDifferFromDomParentElement is true
            applyBindingsToDescendantsInternal(bindingContext, nodeVerified, /* bindingContextsMayDifferFromDomParentElement: */ !isElement);
        }
    }

    function applyBindingsToNodeInternal(node, bindings, bindingContext, bindingContextMayDifferFromDomParentElement) {
        var runInits = true, // true = inits need to run, false = inits don't need to run
            isElement = (node.nodeType === 1),
            independentBindings = bindingContext['$options']['independentBindings'],
            bindingHandlerThatControlsDescendantBindings;

        // Optimization: Don't store the binding context on this node if it's definitely the same as on node.parentNode, because
        // we can easily recover it just by scanning up the node's ancestors in the DOM
        // (note: here, parent node means "real DOM parent" not "virtual parent", as there's no O(1) way to find the virtual parent)
        if (bindingContextMayDifferFromDomParentElement)
            ko.storedBindingContextForNode(node, bindingContext);

        // Use bindings if given, otherwise fall back on asking the bindings provider to give us some bindings
        if (!bindings) {
            var provider = ko.bindingProvider['instance'];
            bindings = (provider['getBindingAccessors'] || defaultGetBindingAccessors).call(provider, node, bindingContext);
        }

        if (bindings) {
            // Create an accessor function that will unwrap a specific binding value or all values (for backwards compatibility)
            function allBindingsAccessor(key) {
                return key ?
                    (bindings[key] && bindings[key]()) :
                    ko.utils.objectMap(bindings, unwrapValue);
            }

            // Go through the bindings, check that they are valid and put them in the right order
            var orderedBindings = [];
            for (var bindingKey in bindings) {
                // Also store the binding value accessors in allBindingsAccessor so it's easy to check if a binding value is present
                allBindingsAccessor[bindingKey] = bindings[bindingKey];

                var handler = ko['getBindingHandler'](bindingKey);
                if (handler) {
                    if (!isElement) {
                        validateThatBindingIsAllowedForVirtualElements(bindingKey);
                    }
                    orderedBindings.push({
                        key: bindingKey,
                        valueAccessor: bindings[bindingKey],
                        handler: handler
                    });
                }
            }

            if (orderedBindings.length) {
                var forEachBinding = ko.utils.arrayForEach.bind(null, orderedBindings);

                function wrapBindingCall(callback) {
                    ko.computed(callback, null, { disposeWhenNodeIsRemoved: node });
                }
                function callBindingFunc(binding, methodName) {
                    if (typeof binding.handler[methodName] == "function") {
                        var handlerFn = binding.handler[methodName];
                        return handlerFn(node, binding.valueAccessor, allBindingsAccessor, bindingContext['$data'], bindingContext);
                    }
                }
                function callInit(binding) {
                    var initResult = callBindingFunc(binding, "init");

                    // If this binding handler claims to control descendant bindings, make a note of this
                    if (initResult && initResult['controlsDescendantBindings']) {
                        if (bindingHandlerThatControlsDescendantBindings !== undefined)
                            throw new Error("Multiple bindings (" + bindingHandlerThatControlsDescendantBindings + " and " + binding.key + ") are trying to control descendant bindings of the same element. You cannot use these bindings together on the same element.");
                        bindingHandlerThatControlsDescendantBindings = binding.key;
                    }
                }
                function callUpdate(binding) {
                    callBindingFunc(binding, "update");
                }

                if (independentBindings) {
                    // For independent bindings, go through each binding, and call init and then update
                    forEachBinding(function(binding) {
                        // Run init, ignoring any dependencies
                        ko.dependencyDetection.ignore(callInit, null, [binding]);

                        // Run update in its own computed wrapper
                        wrapBindingCall(callUpdate.bind(null, binding));
                    });
                } else {
                    // For dependent bindings, call init for each binding and then update each binding
                    wrapBindingCall(function () {
                        // First run all the inits
                        if (runInits)
                            forEachBinding(callInit);

                        // then run all the updates
                        forEachBinding(callUpdate);
                    });
                }
            }
        }

        runInits = false;

        return {
            'shouldBindDescendants': bindingHandlerThatControlsDescendantBindings === undefined
        };
    };

    var storedBindingContextDomDataKey = "__ko_bindingContext__";
    ko.storedBindingContextForNode = function (node, bindingContext) {
        if (arguments.length == 2)
            ko.utils.domData.set(node, storedBindingContextDomDataKey, bindingContext);
        else
            return ko.utils.domData.get(node, storedBindingContextDomDataKey);
    }

    function getBindingContext(viewModelOrBindingContext, options) {
        return viewModelOrBindingContext && (viewModelOrBindingContext instanceof ko.bindingContext)
            ? viewModelOrBindingContext
            : new ko.bindingContext(ko.utils.peekObservable(viewModelOrBindingContext), options);
    }

    ko.applyBindingAccessorsToNode = function (node, bindings, viewModelOrBindingContext) {
        if (node.nodeType === 1) // If it's an element, workaround IE <= 8 HTML parsing weirdness
            ko.virtualElements.normaliseVirtualElementDomStructure(node);
        return applyBindingsToNodeInternal(node, bindings, getBindingContext(viewModelOrBindingContext), true);
    };

    ko.applyBindingsToNode = function (node, bindings, viewModelOrBindingContext) {
        var context = getBindingContext(viewModelOrBindingContext);
        return ko.applyBindingAccessorsToNode(node, makeBindingAccessors(bindings, context, node), context);
    };

    ko.applyBindingsToDescendants = function(viewModelOrBindingContext, rootNode) {
        if (rootNode.nodeType === 1 || rootNode.nodeType === 8)
            applyBindingsToDescendantsInternal(getBindingContext(viewModelOrBindingContext), rootNode, true);
    };

    ko.applyBindings = function (viewModelOrBindingContext, rootNode, options) {
        if (rootNode && (rootNode.nodeType !== 1) && (rootNode.nodeType !== 8))
            throw new Error("ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node");
        rootNode = rootNode || window.document.body; // Make "rootNode" parameter optional

        applyBindingsToNodeAndDescendantsInternal(getBindingContext(viewModelOrBindingContext, options), rootNode, true);
    };

    // Retrieving binding context from arbitrary nodes
    ko.contextFor = function(node) {
        // We can only do something meaningful for elements and comment nodes (in particular, not text nodes, as IE can't store domdata for them)
        switch (node.nodeType) {
            case 1:
            case 8:
                var context = ko.storedBindingContextForNode(node);
                if (context) return context;
                if (node.parentNode) return ko.contextFor(node.parentNode);
                break;
        }
        return undefined;
    };
    ko.dataFor = function(node) {
        var context = ko.contextFor(node);
        return context ? context['$data'] : undefined;
    };

    ko.exportSymbol('bindingHandlers', ko.bindingHandlers);
    ko.exportSymbol('applyBindings', ko.applyBindings);
    ko.exportSymbol('applyBindingsToDescendants', ko.applyBindingsToDescendants);
    ko.exportSymbol('applyBindingAccessorsToNode', ko.applyBindingAccessorsToNode);
    ko.exportSymbol('applyBindingsToNode', ko.applyBindingsToNode);
    ko.exportSymbol('contextFor', ko.contextFor);
    ko.exportSymbol('dataFor', ko.dataFor);
})();
