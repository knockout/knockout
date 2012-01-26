function DictionaryItem(key, value, dictionary) {
    var observableKey = new ko.observable(key);

    this.value = new ko.observable(value);
    this.key = new ko.computed({
        read: observableKey,
        write: function (newKey) {
            var current = observableKey();

            if (current == newKey) return;

            // no two items are allowed to share the same key.
            dictionary.remove(newKey);

            observableKey(newKey);
        }
    });
}
ko.observableDictionary = function (initialValues, keySelector, valueSelector) {
    if ((initialValues !== null) && (initialValues !== undefined) && !(typeof initialValues == "object") && !('length' in initialValues))
        throw new Error("The argument passed when initializing an observable array must be an array, or null, or undefined.");

    var initialArray = []
    if (arguments.length != 0 && (initialValues === null || initialValues === undefined)) {
        initialArray = initialValues;
    }
    var items = []
    var result = new ko.observableArray(initialArray);

    result['transform'] = function(dictionary){
        if(dictionary === null || dictionary === undefined)
            return dictionary;

        return transformItems(dictionary, result._keySelector, result._valueSelector, result);
    };

    result._keySelector = keySelector || function(value, key){ return key; };
    result._valueSelector = valueSelector || function(value){ return value; };
    
    if(typeof keySelector == "string")
        result._keySelector = function(value){ return value[keySelector]; };
    if(typeof valueSelector == "string")
        result._valueSelector = function(value){ return value[valueSelector]; };
    
    ko.utils.extend(result, ko.observableDictionary['fn']);
    
    result.pushAll(initialValues);

    ko.exportProperty(result, "get", result.get);
    ko.exportProperty(result, "set", result.set);
    ko.exportProperty(result, "keys", result.keys);
    ko.exportProperty(result, "values", result.values);
    ko.exportProperty(result, "toJSON", result.toJSON);

    return result; 
}

function getValue(key, items) {
    var found = ko.utils.arrayFirst(items, function (item) {
        return item.key() == key;
    });
    return found ? found.value : null;
}

function getPredicate(valueOrPredicate) {
    if (valueOrPredicate instanceof DictionaryItem) {
        return function (item) {
            return item.key() === valueOrPredicate.key();
        };
    }
    else if (typeof valueOrPredicate != "function") {
        return function (item) {
            return item.key() === valueOrPredicate;
        };
    }

    return valueOrPredicate;
}
function transformItems(dictionary, keySelector, valueSelector, parent) {
    if(dictionary === null || dictionary === undefined)
        return dictionary;

    var result = [];

    if (dictionary instanceof Array) {
        var index = 0;
        ko.utils.arrayForEach(dictionary, function (item) {
            var key = keySelector(item, index++);
            var value = valueSelector(item);
            result.push(new DictionaryItem(key, value, parent));
        });
    }
    else {
        for (var prop in dictionary) {
            if (dictionary.hasOwnProperty(prop)) {
                var item = dictionary[prop];
                var key = keySelector(item, prop);
                var value = valueSelector(item);
                result.push(new DictionaryItem(key, value, parent));
            }
        }
    }

    return result;
}

ko.observableDictionary['fn'] = {
    remove: function (valueOrPredicate) {
        var predicate = getPredicate(valueOrPredicate);

        return ko.observableArray['fn'].remove.call(this, predicate);
    },
    
    removeAll: function (arrayOfKeys) {
        // If you passed zero args, we remove everything
        if (arguments.length === 0) {
            return ko.observableArray['fn'].removeAll.call(this);
        }
        // If you passed an arg, we interpret it as an array of entries to remove
        if (!arrayOfKeys)
            return [];

        return this.remove(function(item){
            return ko.utils.arrayIndexOf(arrayOfKeys, item.key()) !== -1;
        });
    },
    
    destroy: function (valueOrPredicate) {
        var underlyingArray = this();
        var predicate = getPredicate(valueOrPredicate);
        
        this.valueWillMutate();
        for (var i = underlyingArray.length - 1; i >= 0; i--) {
            var item = underlyingArray[i];
            if (predicate(item))
                underlyingArray[i].value["_destroy"] = true;
        }
        this.valueHasMutated();
    },

    destroyAll: function (arrayOfKeys) {
        // If you passed zero args, we destroy everything
        if (arguments.length === 0)
            return this.destroy(function() { return true });

        // If you passed an arg, we interpret it as an array of entries to destroy
        if (!arrayOfKeys)
            return [];

        return this.destroy(function(item){
            return ko.utils.arrayIndexOf(arrayOfKeys, item.key()) !== -1;
        });
    },

    push: function (key, value) {
        var item = null;

        if (key instanceof DictionaryItem) {
            // handle the case where only a DictionaryItem is passed in
            item = key;
            value = key.value();
            key = key.key();
        }

        if (value === undefined) {
            value = this._valueSelector(key);
            key = this._keySelector(value);
        }
        else {
            value = this._valueSelector(value);
        }

        var current = this.get(key, false);
        if (current) {
            // update existing value
            current(value);
            return current;
        }

        if (!item) {
            item = new DictionaryItem(key, value, this);
        }

        ko.observableArray['fn'].push.call(this, item);

        return value;
    },

    pushAll: function (dictionary) {
        var items = transformItems(dictionary, this._keySelector, this._valueSelector, this);
        var underlyingArray = this();

        this.valueWillMutate();

        if(underlyingArray === null || underlyingArray === undefined)
            this(items);
        else
            Array.prototype.push.apply(this(), items);

        this.valueHasMutated();
    },

    sort: function (method) {
        if (method === undefined) {
            method = function (a, b) {
                return defaultComparison(a.key(), b.key());
            };
        }

        return ko.observableArray['fn'].sort.call(this.items, method);
    },

    indexOf: function (key) {
        if (key instanceof DictionaryItem) {
            return ko.observableArray['fn'].indexOf.call(this, key);
        }

        var underlyingArray = this();
        for (var index = 0; index < underlyingArray.length; index++) {
            if (underlyingArray[index].key() == key)
                return index;
        }
        return -1;
    },

    get: function (key, wrap) {
        if (wrap == false)
            return getValue(key, this());

        var wrapper = this._wrappers[key];

        if (wrapper == null) {
            wrapper = this._wrappers[key] = new ko.computed({
                read: function () {
                    var value = getValue(key, this());
                    return value ? value() : null;
                },
                write: function (newValue) {
                    var value = getValue(key, this());

                    if (value)
                        value(newValue);
                    else
                        this.push(key, newValue);
                }
            }, this);
        }

        return wrapper;
    },

    set: function (key, value) {
        return this.push(key, value);
    },

    keys: function () {
        return ko.utils.arrayMap(this(), function (item) { return item.key(); });
    },

    values: function () {
        return ko.utils.arrayMap(this(), function (item) { return item.value(); });
    },

    toJSON: function () {
        var result = {};
        var items = ko.utils.unwrapObservable(this);

        ko.utils.arrayForEach(items, function (item) {
            var key = ko.utils.unwrapObservable(item.key);
            var value = ko.utils.unwrapObservable(item.value);

            result[key] = value;
        });

        return result;
    },
    
    replace: function(key, newItem) {
        throw new Error("replace is not valid on an Observable Dictionary");
    } 
}

ko.exportSymbol('observableDictionary', ko.observableDictionary);
