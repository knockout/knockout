ko.observableArray = function (initialValues) {
    if (arguments.length == 0) {
        // Zero-parameter constructor initializes to empty array
        initialValues = [];
    }
    if ((initialValues !== null) && (initialValues !== undefined) && !('length' in initialValues))
        throw new Error("The argument passed when initializing an observable array must be an array, or null, or undefined.");

    var result = ko.observable(initialValues);
    ko.utils.extend(result, ko.observableArray['fn']);
    return result;
}

ko.observableArray['fn'] = {
    'remove': function (valueOrPredicate) {
        var underlyingArray = this.peek();
        var removedValues = [];
        var predicate = typeof valueOrPredicate == "function" ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
        for (var i = 0; i < underlyingArray.length; i++) {
            var value = underlyingArray[i];
            if (predicate(value)) {
                if (removedValues.length === 0) {
                    this.valueWillMutate();
                }
                removedValues.push(value);
                underlyingArray.splice(i, 1);
                i--;
            }
        }
        if (removedValues.length) {
            this.valueHasMutated();
        }
        return removedValues;
    },

    'removeAll': function (arrayOfValues) {
        // If you passed zero args, we remove everything
        if (arrayOfValues === undefined) {
            var underlyingArray = this.peek();
            var allValues = underlyingArray.slice(0);
            this.valueWillMutate();
            underlyingArray.splice(0, underlyingArray.length);
            this.valueHasMutated();
            return allValues;
        }
        // If you passed an arg, we interpret it as an array of entries to remove
        if (!arrayOfValues)
            return [];
        return this['remove'](function (value) {
            return ko.utils.arrayIndexOf(arrayOfValues, value) >= 0;
        });
    },

    'destroy': function (valueOrPredicate) {
        var underlyingArray = this.peek();
        var predicate = typeof valueOrPredicate == "function" ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
        this.valueWillMutate();
        for (var i = underlyingArray.length - 1; i >= 0; i--) {
            var value = underlyingArray[i];
            if (predicate(value))
                underlyingArray[i]["_destroy"] = true;
        }
        this.valueHasMutated();
    },

    'destroyAll': function (arrayOfValues) {
        // If you passed zero args, we destroy everything
        if (arrayOfValues === undefined)
            return this['destroy'](function() { return true });

        // If you passed an arg, we interpret it as an array of entries to destroy
        if (!arrayOfValues)
            return [];
        return this['destroy'](function (value) {
            return ko.utils.arrayIndexOf(arrayOfValues, value) >= 0;
        });
    },

    'indexOf': function (item) {
        var underlyingArray = this();
        return ko.utils.arrayIndexOf(underlyingArray, item);
    },

    'replace': function(oldItem, newItem) {
        var index = this['indexOf'](oldItem);
        if (index >= 0) {
            this.valueWillMutate();
            this.peek()[index] = newItem;
            this.valueHasMutated();
        }
    }
}

// Populate ko.observableArray.fn with read/write functions from native arrays
// Important: Do not add any additional functions here that may reasonably be used to *read* data from the array
// because we'll eval them without causing subscriptions, so ko.computed output could end up getting stale
ko.utils.arrayForEach(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function (methodName) {
    ko.observableArray['fn'][methodName] = function () {
        // Use "peek" to avoid creating a subscription in any computed that we're executing in the context of
        // (for consistency with mutating regular observables)
        var underlyingArray = this.peek();
        this.valueWillMutate();
        var methodCallResult = underlyingArray[methodName].apply(underlyingArray, arguments);
        this.valueHasMutated();
        return methodCallResult;
    };
});

// Populate ko.observableArray.fn with read-only functions from native arrays
ko.utils.arrayForEach(["slice"], function (methodName) {
    ko.observableArray['fn'][methodName] = function () {
        var underlyingArray = this();
        return underlyingArray[methodName].apply(underlyingArray, arguments);
    };
});

var filter = Array.prototype.filter;

if (!filter) {
    // Source: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/filter
    filter = function(fun /*, thisp */) {
    "use strict";

    if (this == null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun != "function")
      throw new TypeError();

    var res = [];
    var thisp = arguments[1];
    for (var i = 0; i < len; i++) {
      if (i in t) {
        var val = t[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, t))
          res.push(val);
      }
    }

    return res;
  };
}

ko.observableArray['fn']['filter'] = function () {
    var underlyingArray = this();
    return filter.apply(underlyingArray, arguments);
};

var map = Array.prototype.map;

if (!map) {
    //Source: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/map
    map = function(callback, thisArg) {

    var T, A, k;

    if (this == null) {
      throw new TypeError(" this is null or not defined");
    }

    // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
    var O = Object(this);

    // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    var len = O.length >>> 0;

    // 4. If IsCallable(callback) is false, throw a TypeError exception.
    // See: http://es5.github.com/#x9.11
    if (typeof callback !== "function") {
      throw new TypeError(callback + " is not a function");
    }

    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
    if (thisArg) {
      T = thisArg;
    }

    // 6. Let A be a new array created as if by the expression new Array(len) where Array is
    // the standard built-in constructor with that name and len is the value of len.
    A = new Array(len);

    // 7. Let k be 0
    k = 0;

    // 8. Repeat, while k < len
    while(k < len) {

      var kValue, mappedValue;

      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
      if (k in O) {

        // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
        kValue = O[ k ];

        // ii. Let mappedValue be the result of calling the Call internal method of callback
        // with T as the this value and argument list containing kValue, k, and O.
        mappedValue = callback.call(T, kValue, k, O);

        // iii. Call the DefineOwnProperty internal method of A with arguments
        // Pk, Property Descriptor {Value: mappedValue, : true, Enumerable: true, Configurable: true},
        // and false.

        // In browsers that support Object.defineProperty, use the following:
        // Object.defineProperty(A, Pk, { value: mappedValue, writable: true, enumerable: true, configurable: true });

        // For best browser support, use the following:
        A[ k ] = mappedValue;
      }
      // d. Increase k by 1.
      k++;
    }

    // 9. return A
    return A;
  };
}

ko.observableArray['fn']['map'] = function () {
    var underlyingArray = this();
    return map.apply(underlyingArray, arguments);
};

var reduce = Array.prototype.reduce;

if (!reduce) {
    reduce = function (accumulator) {
    "use strict";
    if (this===null || this===undefined) throw new TypeError("Object is null or undefined");
    var i = 0, l = this.length >> 0, curr;

    if(typeof accumulator !== "function") // ES5 : "If IsCallable(callbackfn) is false, throw a TypeError exception."
      throw new TypeError("First argument is not callable");

    if(arguments.length < 2) {
      if (l === 0) throw new TypeError("Array length is 0 and no second argument");
      curr = this[0];
      i = 1; // start accumulating at the second element
    } else {
      curr = arguments[1];
    }

    while (i < l) {
      if(i in this) curr = accumulator.call(undefined, curr, this[i], i, this);
      ++i;
    }

    return curr;
  };
}

ko.observableArray['fn']['reduce'] = function () {
    var underlyingArray = this();
    return reduce.apply(underlyingArray, arguments);
};

var reduceRight = Array.prototype.reduceRight;

if (!reduceRight) {
    reduceRight = function (callbackfn /*, initialValue */) {
    "use strict";

    if (this == null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof callbackfn != "function")
      throw new TypeError();

    // no value to return if no initial value, empty array
    if (len === 0 && arguments.length === 1)
      throw new TypeError();

    var k = len - 1;
    var accumulator;
    if (arguments.length >= 2) {
      accumulator = arguments[1];
    } else {
      do {
        if (k in this) {
          accumulator = this[k--];
          break;
        }

        // if array contains no values, no initial value to return
        if (--k < 0)
          throw new TypeError();
      }
      while (true);
    }

    while (k >= 0) {
      if (k in t)
        accumulator = callbackfn.call(undefined, accumulator, t[k], k, t);
      k--;
    }

    return accumulator;
  };
}

ko.observableArray['fn']['reduceRight'] = function () {
    var underlyingArray = this();
    return reduceRight.apply(underlyingArray, arguments);
};

ko.exportSymbol('observableArray', ko.observableArray);
