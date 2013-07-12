
(function() {
    var maxNestedObservableDepth = 10; // Escape the (unlikely) pathalogical case where an observable's current value is itself (or similar reference cycle)

    ko.toJSByPrototype = function(_theDataModel, rootObject){
        var isNumber = function (obj) {
            return (toString.call(obj) == "[object " + Number + "]") || !isNaN(obj);
        };
        var isString = function (obj) {
            return "[object String]" == toString.call(obj);
        };
        var isObject = function (obj) {
            return obj === Object(obj);
        };
        var isBoolean = function(obj) {
            return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
        };
        var isArray = Array.isArray || function(obj) {
            return toString.call(obj) == '[object Array]';
        };
        var isFunction = function (obj) {
            return toString.call(obj) == "[object " + Function + "]";
        };
        if (typeof (/./) !== 'function') {
            isFunction = function(obj) {
                return typeof obj === 'function';
            };
        }
        var toInnerJSON = function(obj, dataModel, viewModel){
            Object.keys(dataModel).forEach( function(key, index, array){
                var value = dataModel[key];
                if( isArray( value ) ){
                    if( isFunction( viewModel[key] ) ){
                        obj[ key ] = viewModel[key]();
                    } else if( isArray( viewModel[key] ) ){
                        obj[ key ] = [];
                        viewModel[key].forEach( function(element, _index, _array){
                            if( isFunction( element ) )
                                obj[ key ].push( element() );
                        } );
                    }
                }
                else if( isString( value ) || isNumber( value ) || isBoolean( value ) ){
                    if( viewModel[ key ] && isFunction( viewModel[ key ] ) ){
                        obj[ key ] = viewModel[ key ]();
                    }
                }
                else if( isObject( value ) ){
                    obj[ key ] = {};
                    toInnerJSON( obj[ key ], dataModel[ key ], viewModel[ key ] );
                }
            });
            return obj;
        };

        return toInnerJSON( {}, _theDataModel, rootObject );
    };
    ko.toJS = function(rootObject) {
        if (arguments.length == 0)
            throw new Error("When calling ko.toJS, pass the object you want to convert.");

        // We just unwrap everything at every level in the object graph
        return mapJsObjectGraph(rootObject, function(valueToMap) {
            // Loop because an observable's value might in turn be another observable wrapper
            for (var i = 0; ko.isObservable(valueToMap) && (i < maxNestedObservableDepth); i++)
                valueToMap = valueToMap();
            return valueToMap;
        });
    };

    ko.toJSON = function(rootObject, replacer, space) {     // replacer and space are optional
        var plainJavaScriptObject = ko.toJS(rootObject);
        return ko.utils.stringifyJson(plainJavaScriptObject, replacer, space);
    };

    function mapJsObjectGraph(rootObject, mapInputCallback, visitedObjects) {
        visitedObjects = visitedObjects || new objectLookup();

        rootObject = mapInputCallback(rootObject);
        var canHaveProperties = (typeof rootObject == "object") && (rootObject !== null) && (rootObject !== undefined) && (!(rootObject instanceof Date)) && (!(rootObject instanceof String)) && (!(rootObject instanceof Number)) && (!(rootObject instanceof Boolean));
        if (!canHaveProperties)
            return rootObject;

        var outputProperties = rootObject instanceof Array ? [] : {};
        visitedObjects.save(rootObject, outputProperties);

        visitPropertiesOrArrayEntries(rootObject, function(indexer) {
            var propertyValue = mapInputCallback(rootObject[indexer]);

            switch (typeof propertyValue) {
                case "boolean":
                case "number":
                case "string":
                case "function":
                    outputProperties[indexer] = propertyValue;
                    break;
                case "object":
                case "undefined":
                    var previouslyMappedValue = visitedObjects.get(propertyValue);
                    outputProperties[indexer] = (previouslyMappedValue !== undefined)
                        ? previouslyMappedValue
                        : mapJsObjectGraph(propertyValue, mapInputCallback, visitedObjects);
                    break;
            }
        });

        return outputProperties;
    }

    function visitPropertiesOrArrayEntries(rootObject, visitorCallback) {
        if (rootObject instanceof Array) {
            for (var i = 0; i < rootObject.length; i++)
                visitorCallback(i);

            // For arrays, also respect toJSON property for custom mappings (fixes #278)
            if (typeof rootObject['toJSON'] == 'function')
                visitorCallback('toJSON');
        } else {
            for (var propertyName in rootObject) {
                if ( !(typeof rootObject[propertyName] === 'function') || ko.isObservable(rootObject[propertyName]) )
                    visitorCallback(propertyName);
            }
        }
    };

    function objectLookup() {
        this.keys = [];
        this.values = [];
    };

    objectLookup.prototype = {
        constructor: objectLookup,
        save: function(key, value) {
            var existingIndex = ko.utils.arrayIndexOf(this.keys, key);
            if (existingIndex >= 0)
                this.values[existingIndex] = value;
            else {
                this.keys.push(key);
                this.values.push(value);
            }
        },
        get: function(key) {
            var existingIndex = ko.utils.arrayIndexOf(this.keys, key);
            return (existingIndex >= 0) ? this.values[existingIndex] : undefined;
        }
    };
})();

ko.exportSymbol('toJS', ko.toJS);
ko.exportSymbol('toJSON', ko.toJSON);
