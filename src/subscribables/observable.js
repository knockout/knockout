
ko.observable = function (initialValue, options) {
    var _latestValue = initialValue;
    options = options || {};

    options = ko.setupCheckValueChanged(options);

    function observable() {
        if (arguments.length > 0) {
            var valueToWrite = arguments[0];
            if(ko.checkValueChanged(_latestValue, valueToWrite, options))
            {
              // Write
              _latestValue = valueToWrite;
              observable.notifySubscribers(_latestValue);
            }
            return this; // Permits chained assignments
        }
        else {
            // Read
            ko.dependencyDetection.registerDependency(observable); // The caller only needs to be notified of changes if they did a "read" operation
            return _latestValue;
        }
    }

    observable.__ko_proto__ = ko.observable;
    observable.valueHasMutated = function () { observable.notifySubscribers(_latestValue); }

    ko.subscribable.call(observable);
    
    ko.exportProperty(observable, "valueHasMutated", observable.valueHasMutated);
    
    return observable;
}
ko.isObservable = function (instance) {
    if ((instance === null) || (instance === undefined) || (instance.__ko_proto__ === undefined)) return false;
    if (instance.__ko_proto__ === ko.observable) return true;
    return ko.isObservable(instance.__ko_proto__); // Walk the prototype chain
}
ko.isWriteableObservable = function (instance) {
    // Observable
    if ((typeof instance == "function") && instance.__ko_proto__ === ko.observable)
        return true;
    // Writeable dependent observable
    if ((typeof instance == "function") && (instance.__ko_proto__ === ko.dependentObservable) && (instance.hasWriteFunction))
        return true;
    // Anything else
    return false;
}


ko.exportSymbol('ko.observable', ko.observable);
ko.exportSymbol('ko.isObservable', ko.isObservable);
ko.exportSymbol('ko.isWriteableObservable', ko.isWriteableObservable);
