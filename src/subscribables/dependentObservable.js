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
        evaluatorFunctionTarget: evaluatorFunctionTarget || options["owner"],
        options: options
    };

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
            if (state._needsEvaluation || (state.isSleeping && dependentObservable.haveDependenciesChanged())) {
                dependentObservable.evaluateImmediate();
            }
            return state._latestValue;
        }
    }

    dependentObservable.state = state;
    dependentObservable.hasWriteFunction = typeof state.writeFunction === "function";

    ko.subscribable.call(dependentObservable);
    ko.utils.setPrototypeOfOrExtend(dependentObservable, ko.dependentObservable['fn']);

    if (state.options['pure']) {
        state.pure = true;
        state.isSleeping = true;     // Starts off sleeping; will awake on the first subscription
        ko.utils.extend(dependentObservable, pureComputedOverrides);
    } else if (state.options['deferEvaluation']) {
        ko.utils.extend(dependentObservable, deferEvaluationOverrides);
    }

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
        dependentObservable.evaluateImmediate();

    // Attach a DOM node disposal callback so that the computed will be proactively disposed as soon as the node is
    // removed using ko.removeNode. But skip if isActive is false (there will never be any dependencies to dispose).
    if (state.disposeWhenNodeIsRemoved && dependentObservable.isActive() && state.disposeWhenNodeIsRemoved.nodeType) {
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
    "equalityComparer": valuesArePrimitiveAndEqual,
    getDependenciesCount: function () {
        return this.state._dependenciesCount;
    },
    addDependencyTracking: function(id, target, trackingObj) {
        if (this.state.pure && target === this) {
            throw Error("A 'pure' computed must not be called recursively");
        }

        this.state.dependencyTracking[id] = trackingObj;
        trackingObj._order = this.state._dependenciesCount++;
        trackingObj._version = target.getVersion();
    },
    haveDependenciesChanged: function() {
        var id, dependency;
        for (id in this.state.dependencyTracking) {
            if (this.state.dependencyTracking.hasOwnProperty(id)) {
                dependency = this.state.dependencyTracking[id];
                if (dependency._target.hasChanged(dependency._version)) {
                    return true;
                }
            }
        }
    },
    markDirty: function() {
        // Process "dirty" events if we can handle delayed notifications
        if (this._evalDelayed && !this.state._isBeingEvaluated) {
            this._evalDelayed();
        }
    },
    isActive: function() {
        return this.state._needsEvaluation || this.state._dependenciesCount > 0;
    },
    notify: function(value, event) {
        this["notifySubscribers"](value, event);
    },
    respondToChange: function() {
        // Ignore "change" events if we've already scheduled a delayed notification
        if (!this._notificationIsPending) {
            this.evaluatePossiblyAsync();
        }
    },
    subscribeToDependency: function(target) {
        if (target._deferUpdates && !this.state.disposeWhenNodeIsRemoved) {
            var dirtySub = target.subscribe(this.markDirty, this, 'dirty'),
                changeSub = target.subscribe(this.respondToChange, this);
            return {
                _target: target,
                dispose: function () {
                    dirtySub.dispose();
                    changeSub.dispose();
                }
            };
        } else {
            return target.subscribe(this.evaluatePossiblyAsync, this);
        }
    },
    evaluatePossiblyAsync: function() {
        var dependentObservable = this,
            throttleEvaluationTimeout = dependentObservable['throttleEvaluation'];
        if (throttleEvaluationTimeout && throttleEvaluationTimeout >= 0) {
            clearTimeout(this.state.evaluationTimeoutInstance);
            this.state.evaluationTimeoutInstance = ko.utils.setTimeout(function () {
                dependentObservable.evaluateImmediate(true /*notifyChange*/);
            }, throttleEvaluationTimeout);
        } else if (dependentObservable._evalDelayed) {
            dependentObservable._evalDelayed();
        } else {
            dependentObservable.evaluateImmediate(true /*notifyChange*/);
        }
    },
    evaluateImmediate: function(notifyChange) {
        var state = this.state,
            dependentObservable = this;

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
                            dependentObservable.addDependencyTracking(id, subscribable, disposalCandidates[id]);
                            delete disposalCandidates[id];
                            --disposalCount;
                        } else if (!state.dependencyTracking[id]) {
                            // Brand new subscription - add it
                            dependentObservable.addDependencyTracking(id, subscribable, state.isSleeping ? { _target: subscribable } : dependentObservable.subscribeToDependency(subscribable));
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
                    dependentObservable.notify(state._latestValue, "beforeChange");
                }

                state._latestValue = newValue;

                if (state.isSleeping) {
                    dependentObservable.updateVersion();
                } else if (notifyChange) {
                    dependentObservable.notify(state._latestValue);
                }
            }

            if (isInitial) {
                dependentObservable.notify(state._latestValue, "awake");
            }
        } finally {
            state._isBeingEvaluated = false;
        }

        if (!state._dependenciesCount)
            state.disposeHandler();
    },
    peek: function() {
        // Peek won't re-evaluate, except while the computed is sleeping or to get the initial value when "deferEvaluation" is set.
        var state = this.state;
        if ((state._needsEvaluation && !state._dependenciesCount) || (state.isSleeping && this.haveDependenciesChanged())) {
            this.evaluateImmediate();
        }
        return state._latestValue;
    },
    limit: function(limitFunction) {
        // Override the limit function with one that delays evaluation as well
        ko.subscribable['fn'].limit.call(this, limitFunction);
        this._evalDelayed = function() {
            this._limitBeforeChange(this.state._latestValue);

            this.state._needsEvaluation = true; // Mark as dirty

            // Pass the observable to the "limit" code, which will access it when
            // it's time to do the notification.
            this._limitChange(this);
        }
    },
    dispose: function() {
        this.state.disposeHandler();
    }
};

var pureComputedOverrides = {
    beforeSubscriptionAdd: function (event) {
        // If asleep, wake up the computed by subscribing to any dependencies.
        var state = this.state;
        var dependentObservable = this;
        if (!state._isDisposed && state.isSleeping && event == 'change') {
            state.isSleeping = false;
            if (state._needsEvaluation || dependentObservable.haveDependenciesChanged()) {
                state.dependencyTracking = null;
                state._dependenciesCount = 0;
                state._needsEvaluation = true;
                dependentObservable.evaluateImmediate();
            } else {
                // First put the dependencies in order
                var dependeciesOrder = [];
                ko.utils.objectForEach(state.dependencyTracking, function (id, dependency) {
                    dependeciesOrder[dependency._order] = id;
                });
                // Next, subscribe to each one
                ko.utils.arrayForEach(dependeciesOrder, function(id, order) {
                    var dependency = state.dependencyTracking[id],
                        subscription = dependentObservable.subscribeToDependency(dependency._target);
                    subscription._order = order;
                    subscription._version = dependency._version;
                    state.dependencyTracking[id] = subscription;
                });
            }
            if (!state._isDisposed) {     // test since evaluating could trigger disposal
                dependentObservable.notify(state._latestValue, "awake");
            }
        }
    },
    afterSubscriptionRemove: function (event) {
        var state = this.state;
        if (!state._isDisposed && event == 'change' && !this.hasSubscriptionsForEvent('change')) {
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
            this.notify(undefined, "asleep");
        }
    },
    getVersion: function () {
        // Because a pure computed is not automatically updated while it is sleeping, we can't
        // simply return the version number. Instead, we check if any of the dependencies have
        // changed and conditionally re-evaluate the computed observable.
        var state = this.state;
        if (state.isSleeping && (state._needsEvaluation || this.haveDependenciesChanged())) {
            this.evaluateImmediate();
        }
        return ko.dependentObservable["fn"].getVersion.call(this);
    }
};

var deferEvaluationOverrides = {
    beforeSubscriptionAdd: function (event) {
        // This will force a computed with deferEvaluation to evaluate when the first subscriptions is registered.
        if (event == 'change' || event == 'beforeChange') {
            this.peek();
        }
    }
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

ko.exportProperty(ko.dependentObservable['fn'], 'peek', ko.dependentObservable['fn'].peek);
ko.exportProperty(ko.dependentObservable['fn'], 'dispose', ko.dependentObservable['fn'].dispose);
ko.exportProperty(ko.dependentObservable['fn'], 'isActive', ko.dependentObservable['fn'].isActive);
ko.exportProperty(ko.dependentObservable['fn'], 'getDependenciesCount', ko.dependentObservable['fn'].getDependenciesCount);

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
