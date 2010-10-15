/// <reference path="dependencyDetection.js" />

ko.observable = function (initialValue) {
    var _latestValue = initialValue;

    function observable(newValue) {
        if (arguments.length > 0) {
        	// Write
            _latestValue = newValue;
            observable.notifySubscribers(_latestValue);
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
    return (typeof instance == "function") && instance.__ko_proto__ === ko.observable;
}


ko.exportSymbol('ko.observable', ko.observable);
ko.exportSymbol('ko.isObservable', ko.isObservable);
ko.exportSymbol('ko.isWriteableObservable', ko.isWriteableObservable);
