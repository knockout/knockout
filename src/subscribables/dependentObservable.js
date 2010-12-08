
ko.dependentObservable = function (evaluatorFunctionOrOptions, evaluatorFunctionTarget, options) {
    if (evaluatorFunctionOrOptions && typeof evaluatorFunctionOrOptions == "object") {
        // Single-parameter syntax - everything is on this "options" param
        options = evaluatorFunctionOrOptions;
    } else {
        // Multi-parameter syntax - construct the options according to the params passed
        options = options || {};
        options["read"] = evaluatorFunctionOrOptions || options["read"];
        options["owner"] = evaluatorFunctionTarget || options["owner"];
    }
    
    if (typeof options["read"] != "function")
        throw "Pass a function that returns the value of the dependentObservable";

    var _subscriptionsToDependencies = [];
    function disposeAllSubscriptionsToDependencies() {
        ko.utils.arrayForEach(_subscriptionsToDependencies, function (subscription) {
            subscription.dispose();
        });
        _subscriptionsToDependencies = [];
    }

    function replaceSubscriptionsToDependencies(newDependencies) {
        disposeAllSubscriptionsToDependencies();
        ko.utils.arrayForEach(newDependencies, function (dependency) {
            _subscriptionsToDependencies.push(dependency.subscribe(evaluate));
        });
    };

    var _latestValue, _isFirstEvaluation = true;
    function evaluate() {
        if ((!_isFirstEvaluation) && typeof options["disposeWhen"] == "function") {
            if (options["disposeWhen"]()) {
                dependentObservable.dispose();
                return;
            }
        }

        try {
            ko.dependencyDetection.begin();
            _latestValue = options["owner"] ? options["read"].call(options["owner"]) : options["read"]();
        } catch(e) {
            // This 'fixes' an 'Object not found exception', which occurs in IE only.
            // See https://github.com/SteveSanderson/knockout/issues/#issue/20
        } finally {
            var distinctDependencies = ko.utils.arrayGetDistinctValues(ko.dependencyDetection.end());
            replaceSubscriptionsToDependencies(distinctDependencies);
        }

        dependentObservable.notifySubscribers(_latestValue);
        _isFirstEvaluation = false;
    }

    function dependentObservable() {
        if (arguments.length > 0) {
            if (typeof options["write"] === "function") {
                // Writing a value
                var valueToWrite = arguments[0];
                options["owner"] ? options["write"].call(options["owner"], valueToWrite) : options["write"](valueToWrite);
            } else {
                throw "Cannot write a value to a dependentObservable unless you specify a 'write' option. If you wish to read the current value, don't pass any parameters.";
            }
        } else {
            // Reading the value
            ko.dependencyDetection.registerDependency(dependentObservable);
            return _latestValue;
        }
    }
    dependentObservable.__ko_proto__ = ko.dependentObservable;
    dependentObservable.getDependenciesCount = function () { return _subscriptionsToDependencies.length; }
    dependentObservable.hasWriteFunction = typeof options["write"] === "function";
    dependentObservable.dispose = function () {
        disposeAllSubscriptionsToDependencies();
    };

    ko.subscribable.call(dependentObservable);
    evaluate();
    
    ko.exportProperty(dependentObservable, 'dispose', dependentObservable.dispose);
    ko.exportProperty(dependentObservable, 'getDependenciesCount', dependentObservable.getDependenciesCount);
    
    return dependentObservable;
};
ko.dependentObservable.__ko_proto__ = ko.observable;

ko.exportSymbol('ko.dependentObservable', ko.dependentObservable);
