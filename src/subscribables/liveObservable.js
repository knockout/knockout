
ko.liveObservable = function(model, property) {
    function liveObservable() {
        if (arguments.length > 0) {  // Write
            // Ignore writes if the value hasn't changed
            if ((!liveObservable['equalityComparer']) || !liveObservable['equalityComparer'](model[property], arguments[0])) {
                model[property] = arguments[0];
                liveObservable.notifySubscribers(model[property]);
            }
            return this; // Permits chained assignments
        } else {
            ko.dependencyDetection.registerDependency(liveObservable); // The caller only needs to be notified of changes if they did a "read" operation
            return model[property];
        }
    }
    liveObservable.__ko_proto__ = ko.observable;
    ko.subscribable.call(liveObservable);
    liveObservable.valueHasMutated = function () { liveObservable.notifySubscribers(model[property]); };
    ko.exportProperty(liveObservable, "valueHasMutated", liveObservable.valueHasMutated);
    return liveObservable;
};

ko.exportSymbol('ko.liveObservable', ko.liveObservable);
