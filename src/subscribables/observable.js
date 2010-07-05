/// <reference path="dependencyDetection.js" />

ko.observable = function (initialValue) {
    var _latestValue = initialValue;

    function observable(newValue) {
        if (arguments.length > 0) {
            _latestValue = newValue;
            observable.notifySubscribers(_latestValue);
        }
        else // The caller only needs to be notified of changes if they did a "read" operation
            ko.dependencyDetection.registerDependency(observable);

        return _latestValue;
    }
    observable.__ko_proto__ = ko.observable;
    observable.valueHasMutated = function () { observable.notifySubscribers(_latestValue); }

    ko.subscribable.call(observable);
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