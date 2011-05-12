ko.observableArray = function (initialValues) {
    if (arguments.length == 0) {
        // Zero-parameter constructor initializes to empty array
        initialValues = [];
    }
    if ((initialValues !== null) && (initialValues !== undefined) && !('length' in initialValues))
        throw new Error("The argument passed when initializing an observable array must be an array, or null, or undefined.");
    var result = new ko.observable(initialValues);

    ko.utils.arrayForEach(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function (methodName) {
        result[methodName] = function () {
            var underlyingArray = result();
            var methodCallResult = underlyingArray[methodName].apply(underlyingArray, arguments);
            result.valueHasMutated();
            return methodCallResult;
        };
    });

    ko.utils.arrayForEach(["slice"], function (methodName) {
        result[methodName] = function () {
            var underlyingArray = result();
            return underlyingArray[methodName].apply(underlyingArray, arguments);
        };
    });

    result.remove = function (valueOrPredicate) {
        var underlyingArray = result();
        var remainingValues = [];
        var removedValues = [];
        var predicate = typeof valueOrPredicate == "function" ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
        for (var i = 0, j = underlyingArray.length; i < j; i++) {
            var value = underlyingArray[i];
            if (!predicate(value))
                remainingValues.push(value);
            else
                removedValues.push(value);
        }
        result(remainingValues);
        return removedValues;
    };

    result.removeAll = function (arrayOfValues) {
        // If you passed zero args, we remove everything
        if (arrayOfValues === undefined) {
            var allValues = result();
            result([]);
            return allValues;
        }
        
        // If you passed an arg, we interpret it as an array of entries to remove
        if (!arrayOfValues)
            return [];
        return result.remove(function (value) {
            return ko.utils.arrayIndexOf(arrayOfValues, value) >= 0;
        });
    };
    
    result.destroy = function (valueOrPredicate) {
        var underlyingArray = result();
        var predicate = typeof valueOrPredicate == "function" ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
        for (var i = underlyingArray.length - 1; i >= 0; i--) {
            var value = underlyingArray[i];
            if (predicate(value))
                underlyingArray[i]["_destroy"] = true;
        }
        result.valueHasMutated();
    };
    
    result.destroyAll = function (arrayOfValues) {
        // If you passed zero args, we destroy everything
        if (arrayOfValues === undefined)
            return result.destroy(function() { return true });
                
        // If you passed an arg, we interpret it as an array of entries to destroy
        if (!arrayOfValues)
            return [];
        return result.destroy(function (value) {
            return ko.utils.arrayIndexOf(arrayOfValues, value) >= 0;
        });		    	
    };

    result.indexOf = function (item) {
        var underlyingArray = result();
        return ko.utils.arrayIndexOf(underlyingArray, item);
    };
    
    result.replace = function(oldItem, newItem) {
        var index = result.indexOf(oldItem);
        if (index >= 0) {
            result()[index] = newItem;
            result.valueHasMutated();
        }	
    };
    
    ko.exportProperty(result, "remove", result.remove);
    ko.exportProperty(result, "removeAll", result.removeAll);
    ko.exportProperty(result, "destroy", result.destroy);
    ko.exportProperty(result, "destroyAll", result.destroyAll);
    ko.exportProperty(result, "indexOf", result.indexOf);
    
    return result;
}

ko.exportSymbol('ko.observableArray', ko.observableArray);
