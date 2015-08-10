ko.computed = ko.dependentObservable = function (evaluatorFunctionOrOptions, evaluatorFunctionTarget, options) {
    if (typeof evaluatorFunctionOrOptions === "object") {
        // Single-parameter syntax - everything is on this "options" param
        options = evaluatorFunctionOrOptions;
    } else {
        // Multi-parameter syntax - construct the options according to the params passed
        options = options || {};
        if (evaluatorFunctionOrOptions) {
            options["read"] = evaluatorFunctionOrOptions;
        }
    }
    if (typeof options["read"] != "function")
        throw new Error("Pass a function that returns the value of the ko.computed");

    var state = {
        _latestValue: undefined,
        _needsEvaluation: true,
        _isBeingEvaluated: false,
        _suppressDisposalUntilDisposeWhenReturnsFalse: false,
        _isDisposed: false,
        pure: false,
        isSleeping: false,
        readFunction: options["read"],
        writeFunction: options["write"],
        disposeWhenNodeIsRemoved: options["disposeWhenNodeIsRemoved"] || options.disposeWhenNodeIsRemoved || null,
        disposeWhenOption: options["disposeWhen"] || options.disposeWhen,
        disposeWhen: options["disposeWhen"] || options.disposeWhen,
        disposeHandler: disposeComputed,
        dependencyTracking: {},
        _dependenciesCount: 0,
        evaluationTimeoutInstance: null,
        originalLimit: ko.dependentObservable['fn'].limit || ko.subscribable['fn'].limit,
        evaluatorFunctionTarget: evaluatorFunctionTarget || options["owner"],
        options: options
    };

    function addDependencyTracking(id, target, trackingObj) {
        if (state.pure && target === dependentObservable) {
            throw Error("A 'pure' computed must not be called recursively");
        }

        state.dependencyTracking[id] = trackingObj;
        trackingObj._order = state._dependenciesCount++;
        trackingObj._version = target.getVersion();
    }

    function haveDependenciesChanged() {
        var id, dependency;
        for (id in state.dependencyTracking) {
            if (state.dependencyTracking.hasOwnProperty(id)) {
                dependency = state.dependencyTracking[id];
                if (dependency._target.hasChanged(dependency._version)) {
                    return true;
                }
            }
        }
    }

    function disposeComputed() {
        if (!state.isSleeping && state.dependencyTracking) {
            ko.utils.objectForEach(state.dependencyTracking, function (id, dependency) {
                if (dependency.dispose)
                    dependency.dispose();
            });
        }
        state.dependencyTracking = null;
        state._dependenciesCount = 0;
        state._isDisposed = true;
        state._needsEvaluation = false;
        state.isSleeping = false;
    }

    function subscribeToDependency(target) {
        if (target._deferUpdates && !state.disposeWhenNodeIsRemoved) {
            var dirtySub = target.subscribe(markDirty, null, 'dirty'),
                changeSub = target.subscribe(respondToChange);
            return {
                _target: target,
                dispose: function () {
                    dirtySub.dispose();
                    changeSub.dispose();
                }
            };
        } else {
            return target.subscribe(evaluatePossiblyAsync);
        }
    }

    function markDirty() {
        // Process "dirty" events if we can handle delayed notifications
        if (dependentObservable._evalDelayed && !state._isBeingEvaluated) {
            dependentObservable._evalDelayed();
        }
    }

    function respondToChange() {
        // Ignore "change" events if we've already scheduled a delayed notification
        if (!dependentObservable._notificationIsPending) {
            evaluatePossiblyAsync();
        }
    }

    function evaluatePossiblyAsync() {
        var throttleEvaluationTimeout = dependentObservable['throttleEvaluation'];
        if (throttleEvaluationTimeout && throttleEvaluationTimeout >= 0) {
            clearTimeout(state.evaluationTimeoutInstance);
            state.evaluationTimeoutInstance = ko.utils.setTimeout(function () {
                evaluateImmediate(true /*notifyChange*/);
            }, throttleEvaluationTimeout);
        } else if (dependentObservable._evalDelayed) {
            dependentObservable._evalDelayed();
        } else {
            evaluateImmediate(true /*notifyChange*/);
        }
    }

    function evaluateImmediate(notifyChange) {
        if (state._isBeingEvaluated) {
            // If the evaluation of a ko.computed causes side effects, it's possible that it will trigger its own re-evaluation.
            // This is not desirable (it's hard for a developer to realise a chain of dependencies might cause this, and they almost
            // certainly didn't intend infinite re-evaluations). So, for predictability, we simply prevent ko.computeds from causing
            // their own re-evaluation. Further discussion at https://github.com/SteveSanderson/knockout/pull/387
            return;
        }

        // Do not evaluate (and possibly capture new dependencies) if disposed
        if (state._isDisposed) {
            return;
        }

        if (state.disposeWhen && state.disposeWhen()) {
            // See comment below about state._suppressDisposalUntilDisposeWhenReturnsFalse
            if (!state._suppressDisposalUntilDisposeWhenReturnsFalse) {
                state.disposeHandler();
                return;
            }
        } else {
            // It just did return false, so we can stop suppressing now
            state._suppressDisposalUntilDisposeWhenReturnsFalse = false;
        }

        state._isBeingEvaluated = true;

        try {
            // Initially, we assume that none of the subscriptions are still being used (i.e., all are candidates for disposal).
            // Then, during evaluation, we cross off any that are in fact still being used.
            var disposalCandidates = state.dependencyTracking,
                disposalCount = state._dependenciesCount,
                isInitial = state.pure ? undefined : !state._dependenciesCount;   // If we're evaluating when there are no previous dependencies, it must be the first time

            ko.dependencyDetection.begin({
                callback: function(subscribable, id) {
                    if (!state._isDisposed) {
                        if (disposalCount && disposalCandidates[id]) {
                            // Don't want to dispose this subscription, as it's still being used
                            addDependencyTracking(id, subscribable, disposalCandidates[id]);
                            delete disposalCandidates[id];
                            --disposalCount;
                        } else if (!state.dependencyTracking[id]) {
                            // Brand new subscription - add it
                            addDependencyTracking(id, subscribable, state.isSleeping ? { _target: subscribable } : subscribeToDependency(subscribable));
                        }
                    }
                },
                computed: dependentObservable,
                isInitial: isInitial
            });

            state.dependencyTracking = {};
            state._dependenciesCount = 0;

            try {
                var newValue = state.evaluatorFunctionTarget ? state.readFunction.call(state.evaluatorFunctionTarget) : state.readFunction();

            } finally {
                ko.dependencyDetection.end();

                // For each subscription no longer being used, remove it from the active subscriptions list and dispose it
                if (disposalCount && !state.isSleeping) {
                    ko.utils.objectForEach(disposalCandidates, function(id, toDispose) {
                        if (toDispose.dispose)
                            toDispose.dispose();
                    });
                }

                state._needsEvaluation = false;
            }

            if (dependentObservable.isDifferent(state._latestValue, newValue)) {
                if (!state.isSleeping) {
                    notify(state._latestValue, "beforeChange");
                }

                state._latestValue = newValue;

                if (state.isSleeping) {
                    dependentObservable.updateVersion();
                } else if (notifyChange) {
                    notify(state._latestValue);
                }
            }

            if (isInitial) {
                notify(state._latestValue, "awake");
            }
        } finally {
            state._isBeingEvaluated = false;
        }

        if (!state._dependenciesCount)
            state.disposeHandler();
    }

    function dependentObservable() {
        if (arguments.length > 0) {
            if (typeof state.writeFunction === "function") {
                // Writing a value
                state.writeFunction.apply(state.evaluatorFunctionTarget, arguments);
            } else {
                throw new Error("Cannot write a value to a ko.computed unless you specify a 'write' option. If you wish to read the current value, don't pass any parameters.");
            }
            return this; // Permits chained assignments
        } else {
            // Reading the value
            ko.dependencyDetection.registerDependency(dependentObservable);
            if (state._needsEvaluation || (state.isSleeping && haveDependenciesChanged())) {
                evaluateImmediate();
            }
            return state._latestValue;
        }
    }

    function peek() {
        // Peek won't re-evaluate, except while the computed is sleeping or to get the initial value when "deferEvaluation" is set.
        if ((state._needsEvaluation && !state._dependenciesCount) || (state.isSleeping && haveDependenciesChanged())) {
            evaluateImmediate();
        }
        return state._latestValue;
    }

    function isActive() {
        return state._needsEvaluation || state._dependenciesCount > 0;
    }

    function notify(value, event) {
        dependentObservable["notifySubscribers"](value, event);
    }

    ko.subscribable.call(dependentObservable);
    ko.utils.setPrototypeOfOrExtend(dependentObservable, ko.dependentObservable['fn']);

    dependentObservable.peek = peek;
    dependentObservable.getDependenciesCount = function () { return state._dependenciesCount; };
    dependentObservable.hasWriteFunction = typeof state.writeFunction === "function";
    dependentObservable.dispose = function () { state.disposeHandler(); };
    dependentObservable.isActive = isActive;

    // Replace the limit function with one that delays evaluation as well.
    dependentObservable.limit = function(limitFunction) {
        state.originalLimit.call(dependentObservable, limitFunction);
        dependentObservable._evalDelayed = function() {
            dependentObservable._limitBeforeChange(state._latestValue);

            state._needsEvaluation = true;    // Mark as dirty

            // Pass the observable to the "limit" code, which will access it when
            // it's time to do the notification.
            dependentObservable._limitChange(dependentObservable);
        }
    };

    if (state.options['pure']) {
        state.pure = true;
        state.isSleeping = true;     // Starts off sleeping; will awake on the first subscription
        dependentObservable.beforeSubscriptionAdd = function (event) {
            // If asleep, wake up the computed by subscribing to any dependencies.
            if (!state._isDisposed && state.isSleeping && event == 'change') {
                state.isSleeping = false;
                if (state._needsEvaluation || haveDependenciesChanged()) {
                    state.dependencyTracking = null;
                    state._dependenciesCount = 0;
                    state._needsEvaluation = true;
                    evaluateImmediate();
                } else {
                    // First put the dependencies in order
                    var dependeciesOrder = [];
                    ko.utils.objectForEach(state.dependencyTracking, function (id, dependency) {
                        dependeciesOrder[dependency._order] = id;
                    });
                    // Next, subscribe to each one
                    ko.utils.arrayForEach(dependeciesOrder, function(id, order) {
                        var dependency = state.dependencyTracking[id],
                            subscription = subscribeToDependency(dependency._target);
                        subscription._order = order;
                        subscription._version = dependency._version;
                        state.dependencyTracking[id] = subscription;
                    });
                }
                if (!state._isDisposed) {     // test since evaluating could trigger disposal
                    notify(state._latestValue, "awake");
                }
            }
        };

        dependentObservable.afterSubscriptionRemove = function (event) {
            if (!state._isDisposed && event == 'change' && !dependentObservable.hasSubscriptionsForEvent('change')) {
                ko.utils.objectForEach(state.dependencyTracking, function (id, dependency) {
                    if (dependency.dispose) {
                        state.dependencyTracking[id] = {
                            _target: dependency._target,
                            _order: dependency._order,
                            _version: dependency._version
                        };
                        dependency.dispose();
                    }
                });
                state.isSleeping = true;
                notify(undefined, "asleep");
            }
        };

        // Because a pure computed is not automatically updated while it is sleeping, we can't
        // simply return the version number. Instead, we check if any of the dependencies have
        // changed and conditionally re-evaluate the computed observable.
        dependentObservable._originalGetVersion = dependentObservable.getVersion;
        dependentObservable.getVersion = function () {
            if (state.isSleeping && (state._needsEvaluation || haveDependenciesChanged())) {
                evaluateImmediate();
            }
            return dependentObservable._originalGetVersion();
        };
    } else if (state.options['deferEvaluation']) {
        // This will force a computed with deferEvaluation to evaluate when the first subscriptions is registered.
        dependentObservable.beforeSubscriptionAdd = function (event) {
            if (event == 'change' || event == 'beforeChange') {
                peek();
            }
        }
    }

    ko.exportProperty(dependentObservable, 'peek', dependentObservable.peek);
    ko.exportProperty(dependentObservable, 'dispose', dependentObservable.dispose);
    ko.exportProperty(dependentObservable, 'isActive', dependentObservable.isActive);
    ko.exportProperty(dependentObservable, 'getDependenciesCount', dependentObservable.getDependenciesCount);

    // Add a "disposeWhen" callback that, on each evaluation, disposes if the node was removed without using ko.removeNode.
    if (state.disposeWhenNodeIsRemoved) {
        // Since this computed is associated with a DOM node, and we don't want to dispose the computed
        // until the DOM node is *removed* from the document (as opposed to never having been in the document),
        // we'll prevent disposal until "disposeWhen" first returns false.
        state._suppressDisposalUntilDisposeWhenReturnsFalse = true;

        // Only watch for the node's disposal if the value really is a node. It might not be,
        // e.g., { disposeWhenNodeIsRemoved: true } can be used to opt into the "only dispose
        // after first false result" behaviour even if there's no specific node to watch. This
        // technique is intended for KO's internal use only and shouldn't be documented or used
        // by application code, as it's likely to change in a future version of KO.
        if (state.disposeWhenNodeIsRemoved.nodeType) {
            state.disposeWhen = function () {
                return !ko.utils.domNodeIsAttachedToDocument(state.disposeWhenNodeIsRemoved) || (state.disposeWhenOption && state.disposeWhenOption());
            };
        }
    }

    if (ko.options['deferUpdates']) {
        ko.extenders['deferred'](dependentObservable, true);
    }

    // Evaluate, unless sleeping or deferEvaluation is true
    if (!state.isSleeping && !state.options['deferEvaluation'])
        evaluateImmediate();

    // Attach a DOM node disposal callback so that the computed will be proactively disposed as soon as the node is
    // removed using ko.removeNode. But skip if isActive is false (there will never be any dependencies to dispose).
    if (state.disposeWhenNodeIsRemoved && isActive() && state.disposeWhenNodeIsRemoved.nodeType) {
        state.disposeHandler = function() {
            ko.utils.domNodeDisposal.removeDisposeCallback(state.disposeWhenNodeIsRemoved, state.disposeHandler);
            disposeComputed();
        };
        ko.utils.domNodeDisposal.addDisposeCallback(state.disposeWhenNodeIsRemoved, state.disposeHandler);
    }

    if (DEBUG) {
        // #1731 - Aid debugging by exposing the computed's options
        dependentObservable["_options"] = state.options;
        if (!state.options["read"]) {
            state.options["read"] = state.readFunction;
        }
    }

    return dependentObservable;
};

ko.isComputed = function(instance) {
    return ko.hasPrototype(instance, ko.dependentObservable);
};

var protoProp = ko.observable.protoProperty; // == "__ko_proto__"
ko.dependentObservable[protoProp] = ko.observable;

ko.dependentObservable['fn'] = {
    "equalityComparer": valuesArePrimitiveAndEqual
};
// Note that for browsers that don't support proto assignment, the
// inheritance chain is created manually in the ko.dependentObservable constructor
if (ko.utils.canSetPrototype) {
    ko.utils.setPrototypeOf(ko.dependentObservable['fn'], ko.subscribable['fn']);
}

ko.dependentObservable['fn'][protoProp] = ko.dependentObservable;

ko.exportSymbol('dependentObservable', ko.dependentObservable);
ko.exportSymbol('computed', ko.dependentObservable); // Make "ko.computed" an alias for "ko.dependentObservable"
ko.exportSymbol('isComputed', ko.isComputed);

ko.pureComputed = function (evaluatorFunctionOrOptions, evaluatorFunctionTarget) {
    if (typeof evaluatorFunctionOrOptions === 'function') {
        return ko.computed(evaluatorFunctionOrOptions, evaluatorFunctionTarget, {'pure':true});
    } else {
        evaluatorFunctionOrOptions = ko.utils.extend({}, evaluatorFunctionOrOptions);   // make a copy of the parameter object
        evaluatorFunctionOrOptions['pure'] = true;
        return ko.computed(evaluatorFunctionOrOptions, evaluatorFunctionTarget);
    }
}
ko.exportSymbol('pureComputed', ko.pureComputed);
