ko.groupedSetTimeout = (function() {
    var minimum = undefined;
    var asyncQueue = [];
    var asyncTimeoutInstance = null;

    function processAsync() {
        var now = new Date().getTime();
        var ops = [];
        var newQueue = [];
        minimum = undefined;
        ko.utils.arrayForEach(asyncQueue, function(item) {
            if (item.time <= now) {
                ops.push(item.op);
            } else {
                enableAsyncProcessing(item.time);
                newQueue.push(item);
            }
        });
        asyncQueue = newQueue;
        ko.propogateChanges(function() {
            ko.utils.arrayForEach(ops, function(op) { op(); });
        });
    }

    function enableAsyncProcessing(timestamp) {
        clearTimeout(asyncTimeoutInstance);
        if (minimum == undefined || minimum > timestamp)
            minimum = timestamp;
        var remaining = minimum - new Date().getTime();
        asyncTimeoutInstance = setTimeout(processAsync, remaining < 0 ? 0 : remaining);
    }

    return function(action, timeout) {
        var target = timeout + new Date().getTime();
        asyncQueue.push({ time: target, op: action});
        enableAsyncProcessing(target);
    };
})();

ko.evaluateImmediateDepth = 0;
ko.evaluateImmediateQueue = {};
ko.beforeChanging = function() {
    ko.evaluateImmediateDepth += 1;
};
ko.afterChanging = function() {
    ko.evaluateImmediateDepth -= 1;
    if (ko.evaluateImmediateDepth < 0) {
        // This is not an error. Client code is allowed to call observable.valueHasMutated to
        // "bump the television" and cause changes to propogate. =/
        ko.evaluateImmediateDepth = 0;
    }
    if (ko.evaluateImmediateDepth == 0) {
        ko.flushEvaluateImmediateQueue();
    }
};
ko.propogateChanges = function(func) {
    var original = ko.evaluateImmediateDepth;
    ko.beforeChanging();
    try {
        return func();
    } finally {
        ko.afterChanging();
        if (ko.evaluateImmediateDepth != original) {
            throw new Error("Integrity check failed. Probably some call to valueHasMutated is not matched by a call to valueWillMutate.");
        }
    }
};
ko.flushEvaluateImmediateQueue = (function() {
    var evaluateImmediateCompleted = {}; // prevent computeds from triggering their own re-evaluation
    return function() {
        var empty;
        do {
            empty = true;
            var copy = {};
            ko.utils.extend(copy, ko.evaluateImmediateQueue);
            for (var k in copy) {
                if (ko.evaluateImmediateQueue[k] && !evaluateImmediateCompleted[k]) {
                    empty = false;
                    ko.evaluateImmediateQueue[k](); // calls evaluateImmediate, which removes the key from the queue
                    evaluateImmediateCompleted[k] = true;
                }
            }
        // Have to loop in case extra subscribers were added to ko.evaluateImmediateQueue
        } while (!empty);
        evaluateImmediateCompleted = {};
    };
})();

ko.dependentObservable = function (evaluatorFunctionOrOptions, evaluatorFunctionTarget, options) {
    var _latestValue,
        _hasBeenEvaluated = false,
        _isBeingEvaluated = false,
        readFunction = evaluatorFunctionOrOptions;

    if (readFunction && typeof readFunction == "object") {
        // Single-parameter syntax - everything is on this "options" param
        options = readFunction;
        readFunction = options["read"];
    } else {
        // Multi-parameter syntax - construct the options according to the params passed
        options = options || {};
        if (!readFunction)
            readFunction = options["read"];
    }
    // By here, "options" is always non-null
    if (typeof readFunction != "function")
        throw new Error("Pass a function that returns the value of the ko.computed");

    var writeFunction = options["write"];
    if (!evaluatorFunctionTarget)
        evaluatorFunctionTarget = options["owner"];

    var _subscriptionsToDependencies = {};
    function disposeAllSubscriptionsToDependencies() {
        for (var identity in _subscriptionsToDependencies)
            _subscriptionsToDependencies[identity].dispose();
        _subscriptionsToDependencies = {};
        delete ko.evaluateImmediateQueue[dependentObservable.identity];
    }
    var dispose = disposeAllSubscriptionsToDependencies;

    // Build "disposeWhenNodeIsRemoved" and "disposeWhenNodeIsRemovedCallback" option values
    // (Note: "disposeWhenNodeIsRemoved" option both proactively disposes as soon as the node is removed using ko.removeNode(),
    // plus adds a "disposeWhen" callback that, on each evaluation, disposes if the node was removed by some other means.)
    var disposeWhenNodeIsRemoved = (typeof options["disposeWhenNodeIsRemoved"] == "object") ? options["disposeWhenNodeIsRemoved"] : null;
    var disposeWhen = options["disposeWhen"] || function() { return false; };
    if (disposeWhenNodeIsRemoved) {
        dispose = function() {
            ko.utils.domNodeDisposal.removeDisposeCallback(disposeWhenNodeIsRemoved, arguments.callee);
            disposeAllSubscriptionsToDependencies();
        };
        ko.utils.domNodeDisposal.addDisposeCallback(disposeWhenNodeIsRemoved, dispose);
        var existingDisposeWhenFunction = disposeWhen;
        disposeWhen = function () {
            return !ko.utils.domNodeIsAttachedToDocument(disposeWhenNodeIsRemoved) || existingDisposeWhenFunction();
        }
    }

    function evaluatePossiblyAsync() {
        var throttleEvaluationTimeout = dependentObservable['throttleEvaluation'];
        if (throttleEvaluationTimeout && throttleEvaluationTimeout >= 0) {
            ko.groupedSetTimeout(evaluateImmediate, throttleEvaluationTimeout);
        } else
            evaluateEventually();
    }

    // Doesn't evaluate immediately, but does evaluate before returning to code outside of the library.
    function evaluateEventually() {
        ko.evaluateImmediateQueue[dependentObservable.identity] = evaluateImmediate;
    }

    function evaluateImmediate() {
        if (_isBeingEvaluated) {
            // If the evaluation of a ko.computed causes side effects, it's possible that it will trigger its own re-evaluation.
            // This is not desirable (it's hard for a developer to realise a chain of dependencies might cause this, and they almost
            // certainly didn't intend infinite re-evaluations). So, for predictability, we simply prevent ko.computeds from causing
            // their own re-evaluation. Further discussion at https://github.com/SteveSanderson/knockout/pull/387
            return;
        }

        // Don't dispose on first evaluation, because the "disposeWhen" callback might
        // e.g., dispose when the associated DOM element isn't in the doc, and it's not
        // going to be in the doc until *after* the first evaluation
        if (_hasBeenEvaluated && disposeWhen()) {
            dispose();
            return;
        }

        _isBeingEvaluated = true;
        try {
            // Initially, we assume that none of the subscriptions are still being used (i.e., all are candidates for disposal).
            // Then, during evaluation, we cross off any that are in fact still being used.
            var disposalCandidates = {};
            for (var prop in _subscriptionsToDependencies) {
                disposalCandidates[prop] = true;
            }

            ko.dependencyDetection.begin(function(subscribable) {
                if (disposalCandidates[subscribable.identity])
                    delete disposalCandidates[subscribable.identity]; // Don't want to dispose this subscription, as it's still being used
                else {
                    var toPush = subscribable.subscribe(evaluatePossiblyAsync);
                    _subscriptionsToDependencies[toPush.target.identity] = toPush; // Brand new subscription - add it
                }
            });

            var newValue = readFunction.call(evaluatorFunctionTarget);

            // For each subscription no longer being used, remove it from the active subscriptions list and dispose it
            for (var identity in disposalCandidates) {
                _subscriptionsToDependencies[identity].dispose();
            }
            _hasBeenEvaluated = true;

            dependentObservable["notifySubscribers"](_latestValue, "beforeChange");
            _latestValue = newValue;
            if (DEBUG) dependentObservable._latestValue = _latestValue;
            delete ko.evaluateImmediateQueue[dependentObservable.identity];
        } finally {
            ko.dependencyDetection.end();
        }

        dependentObservable["notifySubscribers"](_latestValue);
        _isBeingEvaluated = false;

    }

    function dependentObservable() {
        if (arguments.length > 0) {
            set.apply(dependentObservable, arguments);
        } else {
            return get();
        }
    }

    function set() {
        if (typeof writeFunction === "function") {
            // Writing a value
            var args = arguments;
            return ko.propogateChanges(function() {
                return writeFunction.apply(evaluatorFunctionTarget, args);
            });
        } else {
            throw new Error("Cannot write a value to a ko.computed unless you specify a 'write' option. If you wish to read the current value, don't pass any parameters.");
        }
    }

    function get() {
        return ko.propogateChanges(function() {
            // Reading the value
            if (!_hasBeenEvaluated || ko.evaluateImmediateQueue[dependentObservable.identity])
                evaluateImmediate();
            ko.dependencyDetection.registerDependency(dependentObservable);
            return _latestValue;
        });
    }

    dependentObservable.getDependenciesCount = function () {
      var count = 0;
      for (var identity in _subscriptionsToDependencies) {
          count += 1;
      }
      return count;
    };
    dependentObservable.hasWriteFunction = typeof options["write"] === "function";
    dependentObservable.dispose = function () { dispose(); };

    ko.subscribable.call(dependentObservable);
    ko.utils.extend(dependentObservable, ko.dependentObservable['fn']);

    if (options['deferEvaluation'] !== true)
        evaluateImmediate();

    ko.exportProperty(dependentObservable, 'dispose', dependentObservable.dispose);
    ko.exportProperty(dependentObservable, 'getDependenciesCount', dependentObservable.getDependenciesCount);

    return dependentObservable;
};

ko.isComputed = function(instance) {
    return ko.hasPrototype(instance, ko.dependentObservable);
};

var protoProp = ko.observable.protoProperty; // == "__ko_proto__"
ko.dependentObservable[protoProp] = ko.observable;

ko.dependentObservable['fn'] = {};
ko.dependentObservable['fn'][protoProp] = ko.dependentObservable;

ko.exportSymbol('dependentObservable', ko.dependentObservable);
ko.exportSymbol('computed', ko.dependentObservable); // Make "ko.computed" an alias for "ko.dependentObservable"
ko.exportSymbol('isComputed', ko.isComputed);
