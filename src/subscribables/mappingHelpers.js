
(function() {	    
    ko.fromJS = function(jsObject) {
        if (arguments.length == 0)
            throw new Error("When calling ko.fromJS, pass the object you want to convert.");
        
        return mapJsObjectGraph(jsObject, function(valueToMap) {
            valueToMap = ko.utils.unwrapObservable(valueToMap); // Don't add an extra layer of observability
            return (valueToMap instanceof Array) ? ko.observableArray(valueToMap) : ko.observable(valueToMap);
        });
    };
    
    function visitPropertiesOrArrayEntries(rootObject, callback) {
        if (rootObject instanceof Array) {
            for (var i = 0; i < rootObject.length; i++)
                callback(i);
        } else {
            for (var propertyName in rootObject)
                callback(propertyName);
        }
    };
    
    function mapJsObjectGraph(rootObject, callback, visitedObjects) {
        visitedObjects = visitedObjects || new objectLookup();
        
        var canHaveProperties = (typeof rootObject == "object") && (rootObject !== null) && (rootObject !== undefined);		
        if (canHaveProperties) {
            var outputProperties = (rootObject instanceof Array) ? [] : {};
            var mappedRootObject = callback(outputProperties);
            visitedObjects.save(rootObject, mappedRootObject);
            
            visitPropertiesOrArrayEntries(rootObject, function(propertyName) {
                var propertyValue = rootObject[propertyName];
                
                var previouslyMappedValue = visitedObjects.get(propertyValue);
                if (previouslyMappedValue !== undefined) {
                    outputProperties[propertyName] = previouslyMappedValue;
                } else {
                    switch (typeof propertyValue) {
                        case "boolean":
                        case "number":
                        case "string":
                        case "function":
                            outputProperties[propertyName] = callback(propertyValue);
                            break;
                        case "object":
                        case "undefined":					
                            outputProperties[propertyName] = mapJsObjectGraph(propertyValue, callback, visitedObjects);
                            break;							
                    }
                }
            });
            
            return mappedRootObject;
        }
        else
            return callback(rootObject);    	
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