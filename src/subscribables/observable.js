var primitiveTypes = { 'undefined':true, 'boolean':true, 'number':true, 'string':true };

ko.observable = function (initialValue) {
    var _latestValue = initialValue;

    function observable() {
        if (arguments.length > 0) {
            // Write            
            
            // Ignore writes if the value hasn't changed
            if ((!observable['equalityComparer']) || !observable['equalityComparer'](_latestValue, arguments[0])) {
                _latestValue = arguments[0];
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
    ko.subscribable.call(observable);
    observable.valueHasMutated = function () { observable.notifySubscribers(_latestValue); }
    ko.utils.extend(observable, ko.observable['fn']);    
    
    ko.exportProperty(observable, "valueHasMutated", observable.valueHasMutated);

	observable.isKnockoutObservable = true;
    observable.isKnockoutWritableObservable = true;

    return observable;
}

ko.observable['fn'] = {
    __ko_proto__: ko.observable,

    "equalityComparer": function valuesArePrimitiveAndEqual(a, b) {
        var oldValueIsPrimitive = (a === null) || (typeof(a) in primitiveTypes);
        return oldValueIsPrimitive ? (a === b) : false;
    }
};

ko.isObservable = function (instance) {
	return (typeof instance == "function") && instance.isKnockoutObservable;
}
ko.isWriteableObservable = function (instance) {
    return (typeof instance == "function") && instance.isKnockoutWritableObservable;
}


ko.exportSymbol('ko.observable', ko.observable);
ko.exportSymbol('ko.isObservable', ko.isObservable);
ko.exportSymbol('ko.isWriteableObservable', ko.isWriteableObservable);
