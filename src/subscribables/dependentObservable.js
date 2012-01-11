ko.dependentObservable = function (evaluatorFunctionOrOptions, evaluatorFunctionTarget, options) {
    var _latestValue, 
        _hasBeenEvaluated = false,
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
        throw "Pass a function that returns the value of the dependentObservable";

    var writeFunction = options["write"];
    if (!evaluatorFunctionTarget)
        evaluatorFunctionTarget = options["owner"];

    var _subscriptionsToDependencies = [];
    function disposeAllSubscriptionsToDependencies() {
        ko.utils.arrayForEach(_subscriptionsToDependencies, function (subscription) {
            subscription.dispose();
        });
        _subscriptionsToDependencies = [];
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
    
    var evaluationTimeoutInstance = null;
    function evaluatePossiblyAsync() {
        var throttleEvaluationTimeout = dependentObservable['throttleEvaluation'];
        if (throttleEvaluationTimeout && throttleEvaluationTimeout >= 0) {
            clearTimeout(evaluationTimeoutInstance);
            evaluationTimeoutInstance = setTimeout(evaluateImmediate, throttleEvaluationTimeout);
        } else
            evaluateImmediate();
    }

    function evaluateImmediate() {
        // Don't dispose on first evaluation, because the "disposeWhen" callback might
        // e.g., dispose when the associated DOM element isn't in the doc, and it's not
        // going to be in the doc until *after* the first evaluation
        if (_hasBeenEvaluated && disposeWhen()) {
            dispose();
            return;
        }

        try {
            var oldSubscriptions = ko.utils.arrayMap(_subscriptionsToDependencies, function(item) {return item.target;});
            ko.dependencyDetection.begin(function(subscribable) {
                var inOld;
                if ((inOld = ko.utils.arrayIndexOf(oldSubscriptions, subscribable)) >= 0)
                    oldSubscriptions[inOld] = undefined;
                else
                    _subscriptionsToDependencies.push(subscribable.subscribe(evaluatePossiblyAsync));
            });

            var newValue = readFunction.call(evaluatorFunctionTarget);

            for (var oldPos = 0, i = 0, len = oldSubscriptions.length; i < len; i++) {
                if (oldSubscriptions[i])
                    _subscriptionsToDependencies.splice(oldPos, 1)[0].dispose();
                else
                    oldPos++;
            }

            dependentObservable["notifySubscribers"](_latestValue, "beforeChange");
            _latestValue = newValue;
        } finally {
            ko.dependencyDetection.end();
        }

        dependentObservable["notifySubscribers"](_latestValue);
        _hasBeenEvaluated = true;
    }

    function dependentObservable() {
        if (arguments.length > 0) {
            dependentObservable.set.apply(dependentObservable, arguments);
        } else {
            return dependentObservable.get();             
        }
    }
    
    dependentObservable.set = function() {
        if (typeof writeFunction === "function") {
            // Writing a value
            writeFunction.apply(evaluatorFunctionTarget, arguments);
        } else {
            throw "Cannot write a value to a dependentObservable unless you specify a 'write' option. If you wish to read the current value, don't pass any parameters.";
        }
    }

    dependentObservable.get = function() {
        // Reading the value
        if (!_hasBeenEvaluated)
            evaluateImmediate();
        ko.dependencyDetection.registerDependency(dependentObservable);
        return _latestValue;
    }

    dependentObservable.getDependenciesCount = function () { return _subscriptionsToDependencies.length; };
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

ko.dependentObservable['fn'] = {
    __ko_proto__: ko.dependentObservable
};

ko.dependentObservable.__ko_proto__ = ko.observable;

ko.exportSymbol('dependentObservable', ko.dependentObservable);
ko.exportSymbol('computed', ko.dependentObservable); // Make "ko.computed" an alias for "ko.dependentObservable"
