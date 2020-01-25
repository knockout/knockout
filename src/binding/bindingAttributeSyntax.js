(function () {
    // Hide or don't minify context properties, see https://github.com/knockout/knockout/issues/2294
    var contextSubscribable = ko.utils.createSymbolOrString('_subscribable');
    var contextAncestorBindingInfo = ko.utils.createSymbolOrString('_ancestorBindingInfo');
    var contextDataDependency = ko.utils.createSymbolOrString('_dataDependency');

    ko.bindingHandlers = {};

    // The following element types will not be recursed into during binding.
    var bindingDoesNotRecurseIntoElementTypes = {
        // Don't want bindings that operate on text nodes to mutate <script> and <textarea> contents,
        // because it's unexpected and a potential XSS issue.
        // Also bindings should not operate on <template> elements since this breaks in Internet Explorer
        // and because such elements' contents are always intended to be bound in a different context
        // from where they appear in the document.
        'script': true,
        'textarea': true,
        'template': true
    };

    // Use an overridable method for retrieving binding handlers so that plugins may support dynamically created handlers
    ko['getBindingHandler'] = function(bindingKey) {
        return ko.bindingHandlers[bindingKey];
    };

    var inheritParentVm = {};

    // The ko.bindingContext constructor is only called directly to create the root context. For child
    // contexts, use bindingContext.createChildContext or bindingContext.extend.
    ko.bindingContext = function(dataItemOrAccessor, parentContext, dataItemAlias, extendCallback, options) {

        // The binding context object includes static properties for the current, parent, and root view models.
        // If a view model is actually stored in an observable, the corresponding binding context object, and
        // any child contexts, must be updated when the view model is changed.
        function updateContext() {
            // Most of the time, the context will directly get a view model object, but if a function is given,
            // we call the function to retrieve the view model. If the function accesses any observables or returns
            // an observable, the dependency is tracked, and those observables can later cause the binding
            // context to be updated.
            var dataItemOrObservable = isFunc ? realDataItemOrAccessor() : realDataItemOrAccessor,
                dataItem = ko.utils.unwrapObservable(dataItemOrObservable);

            if (parentContext) {
                // Copy $root and any custom properties from the parent context
                ko.utils.extend(self, parentContext);

                // Copy Symbol properties
                if (contextAncestorBindingInfo in parentContext) {
                    self[contextAncestorBindingInfo] = parentContext[contextAncestorBindingInfo];
                }
            } else {
                self['$parents'] = [];
                self['$root'] = dataItem;

                // Export 'ko' in the binding context so it will be available in bindings and templates
                // even if 'ko' isn't exported as a global, such as when using an AMD loader.
                // See https://github.com/SteveSanderson/knockout/issues/490
                self['ko'] = ko;
            }

            self[contextSubscribable] = subscribable;

            if (shouldInheritData) {
                dataItem = self['$data'];
            } else {
                self['$rawData'] = dataItemOrObservable;
                self['$data'] = dataItem;
            }

            if (dataItemAlias)
                self[dataItemAlias] = dataItem;

            // The extendCallback function is provided when creating a child context or extending a context.
            // It handles the specific actions needed to finish setting up the binding context. Actions in this
            // function could also add dependencies to this binding context.
            if (extendCallback)
                extendCallback(self, parentContext, dataItem);

            // When a "parent" context is given and we don't already have a dependency on its context, register a dependency on it.
            // Thus whenever the parent context is updated, this context will also be updated.
            if (parentContext && parentContext[contextSubscribable] && !ko.computedContext.computed().hasAncestorDependency(parentContext[contextSubscribable])) {
                parentContext[contextSubscribable]();
            }

            if (dataDependency) {
                self[contextDataDependency] = dataDependency;
            }

            return self['$data'];
        }

        var self = this,
            shouldInheritData = dataItemOrAccessor === inheritParentVm,
            realDataItemOrAccessor = shouldInheritData ? undefined : dataItemOrAccessor,
            isFunc = typeof(realDataItemOrAccessor) == "function" && !ko.isObservable(realDataItemOrAccessor),
            nodes,
            subscribable,
            dataDependency = options && options['dataDependency'];

        if (options && options['exportDependencies']) {
            // The "exportDependencies" option means that the calling code will track any dependencies and re-create
            // the binding context when they change.
            updateContext();
        } else {
            subscribable = ko.pureComputed(updateContext);
            subscribable.peek();

            // At this point, the binding context has been initialized, and the "subscribable" computed observable is
            // subscribed to any observables that were accessed in the process. If there is nothing to track, the
            // computed will be inactive, and we can safely throw it away. If it's active, the computed is stored in
            // the context object.
            if (subscribable.isActive()) {
                // Always notify because even if the model ($data) hasn't changed, other context properties might have changed
                subscribable['equalityComparer'] = null;
            } else {
                self[contextSubscribable] = undefined;
            }
        }
    }

    // Extend the binding context hierarchy with a new view model object. If the parent context is watching
    // any observables, the new child context will automatically get a dependency on the parent context.
    // But this does not mean that the $data value of the child context will also get updated. If the child
    // view model also depends on the parent view model, you must provide a function that returns the correct
    // view model on each update.
    ko.bindingContext.prototype['createChildContext'] = function (dataItemOrAccessor, dataItemAlias, extendCallback, options) {
        if (!options && dataItemAlias && typeof dataItemAlias == "object") {
            options = dataItemAlias;
            dataItemAlias = options['as'];
            extendCallback = options['extend'];
        }

        if (dataItemAlias && options && options['noChildContext']) {
            var isFunc = typeof(dataItemOrAccessor) == "function" && !ko.isObservable(dataItemOrAccessor);
            return new ko.bindingContext(inheritParentVm, this, null, function (self) {
                if (extendCallback)
                    extendCallback(self);
                self[dataItemAlias] = isFunc ? dataItemOrAccessor() : dataItemOrAccessor;
            }, options);
        }

        return new ko.bindingContext(dataItemOrAccessor, this, dataItemAlias, function (self, parentContext) {
            // Extend the context hierarchy by setting the appropriate pointers
            self['$parentContext'] = parentContext;
            self['$parent'] = parentContext['$data'];
            self['$parents'] = (parentContext['$parents'] || []).slice(0);
            self['$parents'].unshift(self['$parent']);
            if (extendCallback)
                extendCallback(self);
        }, options);
    };

    // Extend the binding context with new custom properties. This doesn't change the context hierarchy.
    // Similarly to "child" contexts, provide a function here to make sure that the correct values are set
    // when an observable view model is updated.
    ko.bindingContext.prototype['extend'] = function(properties, options) {
        return new ko.bindingContext(inheritParentVm, this, null, function(self, parentContext) {
            ko.utils.extend(self, typeof(properties) == "function" ? properties(self) : properties);
        }, options);
    };

    var boundElementDomDataKey = ko.utils.domData.nextKey();

    function asyncContextDispose(node) {
        var bindingInfo = ko.utils.domData.get(node, boundElementDomDataKey),
            asyncContext = bindingInfo && bindingInfo.asyncContext;
        if (asyncContext) {
            bindingInfo.asyncContext = null;
            asyncContext.notifyAncestor();
        }
    }
    function AsyncCompleteContext(node, bindingInfo, ancestorBindingInfo) {
        this.node = node;
        this.bindingInfo = bindingInfo;
        this.asyncDescendants = [];
        this.childrenComplete = false;

        if (!bindingInfo.asyncContext) {
            ko.utils.domNodeDisposal.addDisposeCallback(node, asyncContextDispose);
        }

        if (ancestorBindingInfo && ancestorBindingInfo.asyncContext) {
            ancestorBindingInfo.asyncContext.asyncDescendants.push(node);
            this.ancestorBindingInfo = ancestorBindingInfo;
        }
    }
    AsyncCompleteContext.prototype.notifyAncestor = function () {
        if (this.ancestorBindingInfo && this.ancestorBindingInfo.asyncContext) {
            this.ancestorBindingInfo.asyncContext.descendantComplete(this.node);
        }
    };
    AsyncCompleteContext.prototype.descendantComplete = function (node) {
        ko.utils.arrayRemoveItem(this.asyncDescendants, node);
        if (!this.asyncDescendants.length && this.childrenComplete) {
            this.completeChildren();
        }
    };
    AsyncCompleteContext.prototype.completeChildren = function () {
        this.childrenComplete = true;
        if (this.bindingInfo.asyncContext && !this.asyncDescendants.length) {
            this.bindingInfo.asyncContext = null;
            ko.utils.domNodeDisposal.removeDisposeCallback(this.node, asyncContextDispose);
            ko.bindingEvent.notify(this.node, ko.bindingEvent.descendantsComplete);
            this.notifyAncestor();
        }
    };

    ko.bindingEvent = {
        childrenComplete: "childrenComplete",
        descendantsComplete : "descendantsComplete",

        subscribe: function (node, event, callback, context, options) {
            var bindingInfo = ko.utils.domData.getOrSet(node, boundElementDomDataKey, {});
            if (!bindingInfo.eventSubscribable) {
                bindingInfo.eventSubscribable = new ko.subscribable;
            }
            if (options && options['notifyImmediately'] && bindingInfo.notifiedEvents[event]) {
                ko.dependencyDetection.ignore(callback, context, [node]);
            }
            return bindingInfo.eventSubscribable.subscribe(callback, context, event);
        },

        notify: function (node, event) {
            var bindingInfo = ko.utils.domData.get(node, boundElementDomDataKey);
            if (bindingInfo) {
                bindingInfo.notifiedEvents[event] = true;
                if (bindingInfo.eventSubscribable) {
                    bindingInfo.eventSubscribable['notifySubscribers'](node, event);
                }
                if (event == ko.bindingEvent.childrenComplete) {
                    if (bindingInfo.asyncContext) {
                        bindingInfo.asyncContext.completeChildren();
                    } else if (bindingInfo.asyncContext === undefined && bindingInfo.eventSubscribable && bindingInfo.eventSubscribable.hasSubscriptionsForEvent(ko.bindingEvent.descendantsComplete)) {
                        // It's currently an error to register a descendantsComplete handler for a node that was never registered as completing asynchronously.
                        // That's because without the asyncContext, we don't have a way to know that all descendants have completed.
                        throw new Error("descendantsComplete event not supported for bindings on this node");
                    }
                }
            }
        },

        startPossiblyAsyncContentBinding: function (node, bindingContext) {
            var bindingInfo = ko.utils.domData.getOrSet(node, boundElementDomDataKey, {});

            if (!bindingInfo.asyncContext) {
                bindingInfo.asyncContext = new AsyncCompleteContext(node, bindingInfo, bindingContext[contextAncestorBindingInfo]);
            }

            // If the provided context was already extended with this node's binding info, just return the extended context
            if (bindingContext[contextAncestorBindingInfo] == bindingInfo) {
                return bindingContext;
            }

            return bindingContext['extend'](function (ctx) {
                ctx[contextAncestorBindingInfo] = bindingInfo;
            });
        }
    };

    // Returns the valueAccessor function for a binding value
    function makeValueAccessor(value) {
        return function() {
            return value;
        };
    }

    // Returns the value of a valueAccessor function
    function evaluateValueAccessor(valueAccessor) {
        return valueAccessor();
    }

    // Given a function that returns bindings, create and return a new object that contains
    // binding value-accessors functions. Each accessor function calls the original function
    // so that it always gets the latest value and all dependencies are captured. This is used
    // by ko.applyBindingsToNode and getBindingsAndMakeAccessors.
    function makeAccessorsFromFunction(callback) {
        return ko.utils.objectMap(ko.dependencyDetection.ignore(callback), function(value, key) {
            return function() {
                return callback()[key];
            };
        });
    }

    // Given a bindings function or object, create and return a new object that contains
    // binding value-accessors functions. This is used by ko.applyBindingsToNode.
    function makeBindingAccessors(bindings, context, node) {
        if (typeof bindings === 'function') {
            return makeAccessorsFromFunction(bindings.bind(null, context, node));
        } else {
            return ko.utils.objectMap(bindings, makeValueAccessor);
        }
    }

    // This function is used if the binding provider doesn't include a getBindingAccessors function.
    // It must be called with 'this' set to the provider instance.
    function getBindingsAndMakeAccessors(node, context) {
        return makeAccessorsFromFunction(this['getBindings'].bind(this, node, context));
    }

    function validateThatBindingIsAllowedForVirtualElements(bindingName) {
        var validator = ko.virtualElements.allowedBindings[bindingName];
        if (!validator)
            throw new Error("The binding '" + bindingName + "' cannot be used with virtual elements")
    }

    function applyBindingsToDescendantsInternal(bindingContext, elementOrVirtualElement) {
        var nextInQueue = ko.virtualElements.firstChild(elementOrVirtualElement);

        if (nextInQueue) {
            var currentChild,
                provider = ko.bindingProvider['instance'],
                preprocessNode = provider['preprocessNode'];

            // Preprocessing allows a binding provider to mutate a node before bindings are applied to it. For example it's
            // possible to insert new siblings after it, and/or replace the node with a different one. This can be used to
            // implement custom binding syntaxes, such as {{ value }} for string interpolation, or custom element types that
            // trigger insertion of <template> contents at that point in the document.
            if (preprocessNode) {
                while (currentChild = nextInQueue) {
                    nextInQueue = ko.virtualElements.nextSibling(currentChild);
                    preprocessNode.call(provider, currentChild);
                }
                // Reset nextInQueue for the next loop
                nextInQueue = ko.virtualElements.firstChild(elementOrVirtualElement);
            }

            while (currentChild = nextInQueue) {
                // Keep a record of the next child *before* applying bindings, in case the binding removes the current child from its position
                nextInQueue = ko.virtualElements.nextSibling(currentChild);
                applyBindingsToNodeAndDescendantsInternal(bindingContext, currentChild);
            }
        }
        ko.bindingEvent.notify(elementOrVirtualElement, ko.bindingEvent.childrenComplete);
    }

    function applyBindingsToNodeAndDescendantsInternal(bindingContext, nodeVerified) {
        var bindingContextForDescendants = bindingContext;

        var isElement = (nodeVerified.nodeType === 1);
        if (isElement) // Workaround IE <= 8 HTML parsing weirdness
            ko.virtualElements.normaliseVirtualElementDomStructure(nodeVerified);

        // Perf optimisation: Apply bindings only if...
        // (1) We need to store the binding info for the node (all element nodes)
        // (2) It might have bindings (e.g., it has a data-bind attribute, or it's a marker for a containerless template)
        var shouldApplyBindings = isElement || ko.bindingProvider['instance']['nodeHasBindings'](nodeVerified);
        if (shouldApplyBindings)
            bindingContextForDescendants = applyBindingsToNodeInternal(nodeVerified, null, bindingContext)['bindingContextForDescendants'];

        if (bindingContextForDescendants && !bindingDoesNotRecurseIntoElementTypes[ko.utils.tagNameLower(nodeVerified)]) {
            applyBindingsToDescendantsInternal(bindingContextForDescendants, nodeVerified);
        }
    }

    function topologicalSortBindings(bindings) {
        // Depth-first sort
        var result = [],                // The list of key/handler pairs that we will return
            bindingsConsidered = {},    // A temporary record of which bindings are already in 'result'
            cyclicDependencyStack = []; // Keeps track of a depth-search so that, if there's a cycle, we know which bindings caused it
        ko.utils.objectForEach(bindings, function pushBinding(bindingKey) {
            if (!bindingsConsidered[bindingKey]) {
                var binding = ko['getBindingHandler'](bindingKey);
                if (binding) {
                    // First add dependencies (if any) of the current binding
                    if (binding['after']) {
                        cyclicDependencyStack.push(bindingKey);
                        ko.utils.arrayForEach(binding['after'], function(bindingDependencyKey) {
                            if (bindings[bindingDependencyKey]) {
                                if (ko.utils.arrayIndexOf(cyclicDependencyStack, bindingDependencyKey) !== -1) {
                                    throw Error("Cannot combine the following bindings, because they have a cyclic dependency: " + cyclicDependencyStack.join(", "));
                                } else {
                                    pushBinding(bindingDependencyKey);
                                }
                            }
                        });
                        cyclicDependencyStack.length--;
                    }
                    // Next add the current binding
                    result.push({ key: bindingKey, handler: binding });
                }
                bindingsConsidered[bindingKey] = true;
            }
        });

        return result;
    }

    function applyBindingsToNodeInternal(node, sourceBindings, bindingContext) {
        var bindingInfo = ko.utils.domData.getOrSet(node, boundElementDomDataKey, {});

        // Prevent multiple applyBindings calls for the same node, except when a binding value is specified
        var alreadyBound = bindingInfo.alreadyBound;
        if (!sourceBindings) {
            if (alreadyBound) {
                throw Error("You cannot apply bindings multiple times to the same element.");
            }
            bindingInfo.alreadyBound = true;
        }
        if (!alreadyBound) {
            bindingInfo.context = bindingContext;
        }
        if (!bindingInfo.notifiedEvents) {
            bindingInfo.notifiedEvents = {};
        }

        // Use bindings if given, otherwise fall back on asking the bindings provider to give us some bindings
        var bindings;
        if (sourceBindings && typeof sourceBindings !== 'function') {
            bindings = sourceBindings;
        } else {
            var provider = ko.bindingProvider['instance'],
                getBindings = provider['getBindingAccessors'] || getBindingsAndMakeAccessors;

            // Get the binding from the provider within a computed observable so that we can update the bindings whenever
            // the binding context is updated or if the binding provider accesses observables.
            var bindingsUpdater = ko.dependentObservable(
                function() {
                    bindings = sourceBindings ? sourceBindings(bindingContext, node) : getBindings.call(provider, node, bindingContext);
                    // Register a dependency on the binding context to support observable view models.
                    if (bindings) {
                        if (bindingContext[contextSubscribable]) {
                            bindingContext[contextSubscribable]();
                        }
                        if (bindingContext[contextDataDependency]) {
                            bindingContext[contextDataDependency]();
                        }
                    }
                    return bindings;
                },
                null, { disposeWhenNodeIsRemoved: node }
            );

            if (!bindings || !bindingsUpdater.isActive())
                bindingsUpdater = null;
        }

        var contextToExtend = bindingContext;
        var bindingHandlerThatControlsDescendantBindings;
        if (bindings) {
            // Return the value accessor for a given binding. When bindings are static (won't be updated because of a binding
            // context update), just return the value accessor from the binding. Otherwise, return a function that always gets
            // the latest binding value and registers a dependency on the binding updater.
            var getValueAccessor = bindingsUpdater
                ? function(bindingKey) {
                    return function() {
                        return evaluateValueAccessor(bindingsUpdater()[bindingKey]);
                    };
                } : function(bindingKey) {
                    return bindings[bindingKey];
                };

            // Use of allBindings as a function is maintained for backwards compatibility, but its use is deprecated
            function allBindings() {
                return ko.utils.objectMap(bindingsUpdater ? bindingsUpdater() : bindings, evaluateValueAccessor);
            }
            // The following is the 3.x allBindings API
            allBindings['get'] = function(key) {
                return bindings[key] && evaluateValueAccessor(getValueAccessor(key));
            };
            allBindings['has'] = function(key) {
                return key in bindings;
            };

            if (ko.bindingEvent.childrenComplete in bindings) {
                ko.bindingEvent.subscribe(node, ko.bindingEvent.childrenComplete, function () {
                    var callback = evaluateValueAccessor(bindings[ko.bindingEvent.childrenComplete]);
                    if (callback) {
                        var nodes = ko.virtualElements.childNodes(node);
                        if (nodes.length) {
                            callback(nodes, ko.dataFor(nodes[0]));
                        }
                    }
                });
            }

            if (ko.bindingEvent.descendantsComplete in bindings) {
                contextToExtend = ko.bindingEvent.startPossiblyAsyncContentBinding(node, bindingContext);
                ko.bindingEvent.subscribe(node, ko.bindingEvent.descendantsComplete, function () {
                    var callback = evaluateValueAccessor(bindings[ko.bindingEvent.descendantsComplete]);
                    if (callback && ko.virtualElements.firstChild(node)) {
                        callback(node);
                    }
                });
            }

            // First put the bindings into the right order
            var orderedBindings = topologicalSortBindings(bindings);

            // Go through the sorted bindings, calling init and update for each
            ko.utils.arrayForEach(orderedBindings, function(bindingKeyAndHandler) {
                // Note that topologicalSortBindings has already filtered out any nonexistent binding handlers,
                // so bindingKeyAndHandler.handler will always be nonnull.
                var handlerInitFn = bindingKeyAndHandler.handler["init"],
                    handlerUpdateFn = bindingKeyAndHandler.handler["update"],
                    bindingKey = bindingKeyAndHandler.key;

                if (node.nodeType === 8) {
                    validateThatBindingIsAllowedForVirtualElements(bindingKey);
                }

                try {
                    // Run init, ignoring any dependencies
                    if (typeof handlerInitFn == "function") {
                        ko.dependencyDetection.ignore(function() {
                            var initResult = handlerInitFn(node, getValueAccessor(bindingKey), allBindings, contextToExtend['$data'], contextToExtend);

                            // If this binding handler claims to control descendant bindings, make a note of this
                            if (initResult && initResult['controlsDescendantBindings']) {
                                if (bindingHandlerThatControlsDescendantBindings !== undefined)
                                    throw new Error("Multiple bindings (" + bindingHandlerThatControlsDescendantBindings + " and " + bindingKey + ") are trying to control descendant bindings of the same element. You cannot use these bindings together on the same element.");
                                bindingHandlerThatControlsDescendantBindings = bindingKey;
                            }
                        });
                    }

                    // Run update in its own computed wrapper
                    if (typeof handlerUpdateFn == "function") {
                        ko.dependentObservable(
                            function() {
                                handlerUpdateFn(node, getValueAccessor(bindingKey), allBindings, contextToExtend['$data'], contextToExtend);
                            },
                            null,
                            { disposeWhenNodeIsRemoved: node }
                        );
                    }
                } catch (ex) {
                    ex.message = "Unable to process binding \"" + bindingKey + ": " + bindings[bindingKey] + "\"\nMessage: " + ex.message;
                    throw ex;
                }
            });
        }

        var shouldBindDescendants = bindingHandlerThatControlsDescendantBindings === undefined;
        return {
            'shouldBindDescendants': shouldBindDescendants,
            'bindingContextForDescendants': shouldBindDescendants && contextToExtend
        };
    };

    ko.storedBindingContextForNode = function (node) {
        var bindingInfo = ko.utils.domData.get(node, boundElementDomDataKey);
        return bindingInfo && bindingInfo.context;
    }

    function getBindingContext(viewModelOrBindingContext, extendContextCallback) {
        return viewModelOrBindingContext && (viewModelOrBindingContext instanceof ko.bindingContext)
            ? viewModelOrBindingContext
            : new ko.bindingContext(viewModelOrBindingContext, undefined, undefined, extendContextCallback);
    }

    ko.applyBindingAccessorsToNode = function (node, bindings, viewModelOrBindingContext) {
        if (node.nodeType === 1) // If it's an element, workaround IE <= 8 HTML parsing weirdness
            ko.virtualElements.normaliseVirtualElementDomStructure(node);
        return applyBindingsToNodeInternal(node, bindings, getBindingContext(viewModelOrBindingContext));
    };

    ko.applyBindingsToNode = function (node, bindings, viewModelOrBindingContext) {
        var context = getBindingContext(viewModelOrBindingContext);
        return ko.applyBindingAccessorsToNode(node, makeBindingAccessors(bindings, context, node), context);
    };

    ko.applyBindingsToDescendants = function(viewModelOrBindingContext, rootNode) {
        if (rootNode.nodeType === 1 || rootNode.nodeType === 8)
            applyBindingsToDescendantsInternal(getBindingContext(viewModelOrBindingContext), rootNode);
    };

    ko.applyBindings = function (viewModelOrBindingContext, rootNode, extendContextCallback) {
        // If jQuery is loaded after Knockout, we won't initially have access to it. So save it here.
        if (!jQueryInstance && window['jQuery']) {
            jQueryInstance = window['jQuery'];
        }

        if (arguments.length < 2) {
            rootNode = document.body;
            if (!rootNode) {
                throw Error("ko.applyBindings: could not find document.body; has the document been loaded?");
            }
        } else if (!rootNode || (rootNode.nodeType !== 1 && rootNode.nodeType !== 8)) {
            throw Error("ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node");
        }

        applyBindingsToNodeAndDescendantsInternal(getBindingContext(viewModelOrBindingContext, extendContextCallback), rootNode);
    };

    // Retrieving binding context from arbitrary nodes
    ko.contextFor = function(node) {
        // We can only do something meaningful for elements and comment nodes (in particular, not text nodes, as IE can't store domdata for them)
        if (node && (node.nodeType === 1 || node.nodeType === 8)) {
            return ko.storedBindingContextForNode(node);
        }
        return undefined;
    };
    ko.dataFor = function(node) {
        var context = ko.contextFor(node);
        return context ? context['$data'] : undefined;
    };

    ko.exportSymbol('bindingHandlers', ko.bindingHandlers);
    ko.exportSymbol('bindingEvent', ko.bindingEvent);
    ko.exportSymbol('bindingEvent.subscribe', ko.bindingEvent.subscribe);
    ko.exportSymbol('bindingEvent.startPossiblyAsyncContentBinding', ko.bindingEvent.startPossiblyAsyncContentBinding);
    ko.exportSymbol('applyBindings', ko.applyBindings);
    ko.exportSymbol('applyBindingsToDescendants', ko.applyBindingsToDescendants);
    ko.exportSymbol('applyBindingAccessorsToNode', ko.applyBindingAccessorsToNode);
    ko.exportSymbol('applyBindingsToNode', ko.applyBindingsToNode);
    ko.exportSymbol('contextFor', ko.contextFor);
    ko.exportSymbol('dataFor', ko.dataFor);
})();
