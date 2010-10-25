
(function() {
	// Clones the supplied object graph, making certain things observable as per comments
    ko.fromJS = function(jsObject) {
        if (arguments.length == 0)
            throw new Error("When calling ko.fromJS, pass the object you want to convert.");
        
        return mapJsObjectGraph(jsObject, function(valueToMap, isArrayMember) {
            valueToMap = ko.utils.unwrapObservable(valueToMap); // Don't add an extra layer of observability
            
            // Don't map direct array members (although we will map any child properties they may have)
            if (isArrayMember)
            	return valueToMap;
            
        	// Convert arrays to observableArrays
            if (valueToMap instanceof Array)
            	return ko.observableArray(valueToMap);
            
            // Map non-atomic values as non-observable objects
            if ((typeof valueToMap == "object") && (valueToMap !== null))
            	return valueToMap;
            
            // Map atomic values (other than array members) as observables
            return ko.observable(valueToMap);
        });
    };
    
    function visitPropertiesOrArrayEntries(rootObject, visitorCallback) {
        if (rootObject instanceof Array) {
            for (var i = 0; i < rootObject.length; i++)
                visitorCallback(i);
        } else {
            for (var propertyName in rootObject)
                visitorCallback(propertyName);
        }
    };
    
    function mapJsObjectGraph(rootObject, callback, visitedObjects, isArrayMember) {
        visitedObjects = visitedObjects || new objectLookup();
        
        var canHaveProperties = (typeof rootObject == "object") && (rootObject !== null) && (rootObject !== undefined);
        if (!canHaveProperties)
        	return callback(rootObject, isArrayMember);
        	
    	var rootObjectIsArray = rootObject instanceof Array;
        var outputProperties = rootObjectIsArray ? [] : {};
        var mappedRootObject = callback(outputProperties, isArrayMember);
        visitedObjects.save(rootObject, mappedRootObject);            
        
        visitPropertiesOrArrayEntries(rootObject, function(indexer) {
            var propertyValue = rootObject[indexer];
            
            switch (typeof propertyValue) {
                case "boolean":
                case "number":
                case "string":
                case "function":
                    outputProperties[indexer] = callback(propertyValue, rootObjectIsArray);
                    break;
                case "object":
                case "undefined":				
                	var previouslyMappedValue = visitedObjects.get(propertyValue);
            		outputProperties[indexer] = (previouslyMappedValue !== undefined)
            			? previouslyMappedValue
            			: mapJsObjectGraph(propertyValue, callback, visitedObjects, rootObjectIsArray);
                    break;							
            }
        });
        
        return mappedRootObject;
    }
    
    function objectLookup() {
        var keys = [];
        var values = [];
        this.save = function(key, value) {
            var existingIndex = ko.utils.arrayIndexOf(keys, key);
            if (existingIndex >= 0)
                values[existingIndex] = value;
            else {
                keys.push(key);
                values.push(value);	
            }				
        };
        this.get = function(key) {
            var existingIndex = ko.utils.arrayIndexOf(keys, key);
            return (existingIndex >= 0) ? values[existingIndex] : undefined;
        };
    };
})();

ko.exportSymbol('ko.fromJS', ko.fromJS);