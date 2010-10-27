
(function() {
    // Clones the supplied object graph, making certain things observable as per comments
    ko.fromJS = function(jsObject, mapInputCallback) {
        if (arguments.length == 0)
            throw new Error("When calling ko.fromJS, pass the object you want to convert.");
			
		if (mapInputCallback === undefined)
			mapInputCallback = function(x) { return x; }

        return mapJsObjectGraph(jsObject, mapInputCallback, function(valueToMap, isArrayMember) {
            valueToMap = ko.utils.unwrapObservable(valueToMap); // Don't add an extra layer of observability

            // Don't map direct array members (although we will map any child properties they may have)
            if (isArrayMember)
                return valueToMap;

            // Convert arrays to observableArrays
            if (valueToMap instanceof Array)
                return ko.observableArray(valueToMap);

            // Map non-atomic values as non-observable objects
            if ((ko.utils.type(valueToMap) == "object") && (valueToMap !== null))
                return valueToMap;

            // Map atomic values (other than array members) as observables
            return ko.observable(valueToMap);
        });
    };

    ko.toJS = function(rootObject) {
        if (arguments.length == 0)
            throw new Error("When calling ko.toJS, pass the object you want to convert.");

        // We just unwrap everything at every level in the object graph
        return mapJsObjectGraph(rootObject, function(valueToMap) {
            return ko.utils.unwrapObservable(valueToMap);
        }, function(x) { return x /* No output mapping needed */ });
    };

    ko.fromJSON = function(jsonString, mapInputCallback) {
        var parsed = ko.utils.parseJson(jsonString);
        return ko.fromJS(parsed, mapInputCallback);
    };

    ko.toJSON = function(rootObject) {
        var plainJavaScriptObject = ko.toJS(rootObject);
        return ko.utils.stringifyJson(plainJavaScriptObject);
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

    function mapJsObjectGraph(rootObject, mapInputCallback, mapOutputCallback, visitedObjects, isArrayMember, parentName) {
        visitedObjects = visitedObjects || new objectLookup();

        rootObject = mapInputCallback(rootObject);
        var canHaveProperties = (ko.utils.type(rootObject) == "object") && (rootObject !== null) && (rootObject !== undefined);
        if (!canHaveProperties)
            return mapOutputCallback(rootObject, isArrayMember);

        var rootObjectIsArray = rootObject instanceof Array;
        var outputProperties = rootObjectIsArray ? [] : {};
        var mappedRootObject = mapOutputCallback(outputProperties, isArrayMember);
        visitedObjects.save(rootObject, mappedRootObject);

        visitPropertiesOrArrayEntries(rootObject, function(indexer) {
            var propertyValue = mapInputCallback(rootObject[indexer], parentName, indexer);

            switch (ko.utils.type(propertyValue)) {
                case "boolean":
                case "number":
                case "string":
                case "function":
                case "date":
                    outputProperties[indexer] = mapOutputCallback(propertyValue, rootObjectIsArray);
                    break;
                case "object":
                case "undefined":
                    var previouslyMappedValue = visitedObjects.get(propertyValue);
                    outputProperties[indexer] = (previouslyMappedValue !== undefined)
                        ? previouslyMappedValue
                        : mapJsObjectGraph(propertyValue, mapInputCallback, mapOutputCallback, visitedObjects, rootObjectIsArray, indexer);
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
ko.exportSymbol('ko.fromJSON', ko.fromJSON);
ko.exportSymbol('ko.toJS', ko.toJS);
ko.exportSymbol('ko.toJSON', ko.toJSON);