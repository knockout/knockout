function prepareOptions(evaluatorFunctionOrOptions, evaluatorFunctionTarget, options) {
    if (evaluatorFunctionOrOptions && typeof evaluatorFunctionOrOptions == "object") {
        // Single-parameter syntax - everything is on this "options" param
        options = evaluatorFunctionOrOptions;
    } else {
        // Multi-parameter syntax - construct the options according to the params passed
        options = options || {};
        options["read"] = evaluatorFunctionOrOptions || options["read"];
        options["owner"] = evaluatorFunctionTarget || options["owner"];
    }
    // By here, "options" is always non-null
    
    if (typeof options["read"] != "function")
        throw "Pass a function that returns the value of the dependentObservable";
        
    return options;    
}

ko.dependentObservable = function (evaluatorFunctionOrOptions, evaluatorFunctionTarget, options) {
    var _latestValue, 
        _hasBeenEvaluated = false, 
        options = prepareOptions(evaluatorFunctionOrOptions, evaluatorFunctionTarget, options);

    // Build "disposeWhenNodeIsRemoved" and "disposeWhenNodeIsRemovedCallback" option values
    // (Note: "disposeWhenNodeIsRemoved" option both proactively disposes as soon as the node is removed using ko.removeNode(),
    // plus adds a "disposeWhen" callback that, on each evaluation, disposes if the node was removed by some other means.)
    var disposeWhenNodeIsRemoved = (typeof options["disposeWhenNodeIsRemoved"] == "object") ? options["disposeWhenNodeIsRemoved"] : null;
    var disposeWhenNodeIsRemovedCallback = null;
    if (disposeWhenNodeIsRemoved) {
        disposeWhenNodeIsRemovedCallback = function() { dependentObservable.dispose() };
        ko.utils.domNodeDisposal.addDisposeCallback(disposeWhenNodeIsRemoved, disposeWhenNodeIsRemovedCallback);
        var existingDisposeWhenFunction = options["disposeWhen"];
        options["disposeWhen"] = function () {
            return (!ko.utils.domNodeIsAttachedToDocument(disposeWhenNodeIsRemoved)) 
                || ((typeof existingDisposeWhenFunction == "function") && existingDisposeWhenFunction());
        }    	
    }
    
    var _subscriptionsToDependencies = [];
    function disposeAllSubscriptionsToDependencies() {
        ko.utils.arrayForEach(_subscriptionsToDependencies, function (subscription) {
            subscription.dispose();
        });
        _subscriptionsToDependencies = [];
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
        if ((_hasBeenEvaluated) && typeof options["disposeWhen"] == "function") {
            if (options["disposeWhen"]()) {
                dependentObservable.dispose();
                return;
            }
        }

        try {
            disposeAllSubscriptionsToDependencies();
            ko.dependencyDetection.begin(function(subscribable) {
                _subscriptionsToDependencies.push(subscribable.subscribe(evaluatePossiblyAsync));
            });
            _latestValue = options["owner"] ? options["read"].call(options["owner"]) : options["read"]();
        } finally {
            ko.dependencyDetection.end();
        }

        dependentObservable.notifySubscribers(_latestValue);
        _hasBeenEvaluated = true;
    }

    function dependentObservable() {
        if (arguments.length > 0) {
            if (typeof options["write"] === "function") {
                // Writing a value
                var valueForThis = options["owner"]; // If undefined, it will default to "window" by convention. This might change in the future.
                options["write"].apply(valueForThis, arguments);
            } else {
                throw "Cannot write a value to a dependentObservable unless you specify a 'write' option. If you wish to read the current value, don't pass any parameters.";
            }
        } else {
            // Reading the value
            if (!_hasBeenEvaluated)
                evaluateImmediate();
            ko.dependencyDetection.registerDependency(dependentObservable);
            return _latestValue;
        }
    }    
    dependentObservable.getDependenciesCount = function () { return _subscriptionsToDependencies.length; }
    dependentObservable.hasWriteFunction = typeof options["write"] === "function";
    dependentObservable.dispose = function () {
        if (disposeWhenNodeIsRemoved)
            ko.utils.domNodeDisposal.removeDisposeCallback(disposeWhenNodeIsRemoved, disposeWhenNodeIsRemovedCallback);
        disposeAllSubscriptionsToDependencies();
    };
    
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

ko.exportSymbol('ko.dependentObservable', ko.dependentObservable);
ko.exportSymbol('ko.computed', ko.dependentObservable); // Make "ko.computed" an alias for "ko.dependentObservable"