describe('unwrapObservable', function() {
    it('Should return the underlying value of observables', function() {
        var someObject = { abc: 123 },
            observablePrimitiveValue = ko.observable(123),
            observableObjectValue = ko.observable(someObject),
            observableNullValue = ko.observable(null),
            observableUndefinedValue = ko.observable(undefined),
            computedValue = ko.computed(function() { return observablePrimitiveValue() + 1; });

        expect(ko.utils.unwrapObservable(observablePrimitiveValue)).toBe(123);
        expect(ko.utils.unwrapObservable(observableObjectValue)).toBe(someObject);
        expect(ko.utils.unwrapObservable(observableNullValue)).toBe(null);
        expect(ko.utils.unwrapObservable(observableUndefinedValue)).toBe(undefined);
        expect(ko.utils.unwrapObservable(computedValue)).toBe(124);
    });

    it('Should return the supplied value for non-observables', function() {
        var someObject = { abc: 123 };

        expect(ko.utils.unwrapObservable(123)).toBe(123);
        expect(ko.utils.unwrapObservable(someObject)).toBe(someObject);
        expect(ko.utils.unwrapObservable(null)).toBe(null);
        expect(ko.utils.unwrapObservable(undefined)).toBe(undefined);
    });

    it('Should be aliased as ko.unwrap', function() {
        expect(ko.unwrap).toBe(ko.utils.unwrapObservable);
        expect(ko.unwrap(ko.observable('some value'))).toBe('some value');
    });
});

describe('wrap', function() {
    it('Should return an observable containing the non-observable parameter passed', function() {
        var someObject = { abc: 123 },
            primitiveValue = 123,
            someFunction = function() { return primitiveValue; },
            wrappedPrimitiveValue,
            wrappedObject,
            wrappedFunction,
            wrappedNull,
            wrappedUndefined;

        wrappedObject = ko.utils.wrap(someObject);
        expect(ko.isObservable(wrappedObject)).toBe(true);
        expect(wrappedObject()).toBe(someObject);

        wrappedPrimitiveValue = ko.utils.wrap(primitiveValue);
        expect(ko.isObservable(wrappedPrimitiveValue)).toBe(true);
        expect(wrappedPrimitiveValue()).toBe(123);

        wrappedFunction = ko.utils.wrap(someFunction);
        expect(ko.isObservable(wrappedFunction)).toBe(true);
        expect(wrappedFunction()).toBe(someFunction);

        wrappedNull = ko.utils.wrap(null);
        expect(ko.isObservable(wrappedNull)).toBe(true);
        expect(wrappedNull()).toBe(null);

        wrappedUndefined = ko.utils.wrap(undefined);
        expect(ko.isObservable(wrappedUndefined)).toBe(true);
        expect(wrappedUndefined()).toBe(undefined);
    });

    it('Should return the same supplied observable', function() {
        var someObject = { abc: 123 },
            observablePrimitiveValue = ko.observable(123),
            observableObjectValue = ko.observable(someObject),
            observableNullValue = ko.observable(null),
            observableUndefinedValue = ko.observable(undefined),
            computedValue = ko.computed(function() { return observablePrimitiveValue() + 1; });

        expect(ko.utils.wrap(observablePrimitiveValue)).toBe(observablePrimitiveValue);
        expect(ko.utils.wrap(observableObjectValue)).toBe(observableObjectValue);
        expect(ko.utils.wrap(observableNullValue)).toBe(observableNullValue);
        expect(ko.utils.wrap(observableUndefinedValue)).toBe(observableUndefinedValue);
        expect(ko.utils.wrap(computedValue)).toBe(computedValue);

    });
});

describe('arrayForEach', function () {
    it('Should go call the callback for each element of the array, in order', function () {
        var callback = jasmine.createSpy('callback');

        ko.utils.arrayForEach(["a", "b", "c"], callback);

        expect(callback.calls.length).toBe(3);
        expect(callback.calls[0].args).toEqual(["a", 0, ["a", "b", "c"]]);
        expect(callback.calls[1].args).toEqual(["b", 1, ["a", "b", "c"]]);
        expect(callback.calls[2].args).toEqual(["c", 2, ["a", "b", "c"]]);
    });

    it('Should do nothing with empty arrays', function () {
        var callback = jasmine.createSpy('callback');

        ko.utils.arrayForEach([], callback);

        expect(callback).not.toHaveBeenCalled();
    });

    it('Should alter "this" context when defined as an argument', function() {
        var expectedContext = {};
        var actualContext = null;
        ko.utils.arrayForEach(["a"], function() {
            actualContext = this;
        }, expectedContext);
        expect(actualContext).toBe(expectedContext);
    });

    it('Should throw an error for a null array', function () {
        expect(function () {
            ko.utils.arrayForEach(null, function () {});
        }).toThrow();
    });
});

describe('arrayIndexOf', function () {
    it('Should return the index if the element is found in the input array', function () {
        var result = ko.utils.arrayIndexOf(["a", "b", "c"], "b");
        expect(result).toBe(1);
    });

    it('Should return -1 for empty arrays', function () {
        var result = ko.utils.arrayIndexOf([], "a");
        expect(result).toBe(-1);
    });

    it('Should return -1 if the element is not found', function () {
        var result = ko.utils.arrayIndexOf(["a", "b", "c"], "d");
        expect(result).toBe(-1);
    });

    it('Should return the first index if the element is found twice', function () {
        var result = ko.utils.arrayIndexOf(["a", "b", "c", "c"], "c");
        expect(result).toBe(2);
    });

    it('Should throw an error for a null array', function () {
        expect(function () {
            ko.utils.arrayIndexOf(null, "a");
        }).toThrow();
    });
});

describe('arrayRemoveItem', function () {
    it('Should remove the matching element if found', function () {
        var input = ["a", "b", "c"];
        ko.utils.arrayRemoveItem(input, "a");
        expect(input).toEqual(["b", "c"]);
    });

    it('Should do nothing for empty arrays', function () {
        var input = [];
        ko.utils.arrayRemoveItem(input, "a");
        expect(input).toEqual([]);
    });

    it('Should do nothing if no matching element is found', function () {
        var input = ["a", "b", "c"];
        ko.utils.arrayRemoveItem(input, "d");
        expect(input).toEqual(["a", "b", "c"]);
    });

    it('Should remove only the first matching element', function () {
        var input = ["a", "b", "b", "c"];
        ko.utils.arrayRemoveItem(input, "b");
        expect(input).toEqual(["a", "b", "c"]);
    });

    it('Should throw an error for a null array', function () {
        expect(function () {
            ko.utils.arrayRemoteItem(null, "a");
        }).toThrow();
    });
});

describe('arrayFirst', function () {
    var matchB, matchD;

    beforeEach(function () {
        matchB = jasmine.createSpy('matchB').andCallFake(function (x) {
            return x.charAt(0) === "b";
        });

        matchD = jasmine.createSpy('matchD').andCallFake(function (x) {
            return x.charAt(0) === "d";
        });
    });

    it('Should return the first matching element from the input array', function () {
        var result = ko.utils.arrayFirst(["a", "b", "c", "b2"], matchB);

        expect(result).toBe("b");
    });

    it('Should return undefined with empty arrays, and not call the predicate', function () {
        var predicate = jasmine.createSpy('predicate');

        var result = ko.utils.arrayFirst([], predicate);

        expect(result).toBe(undefined);
        expect(predicate).not.toHaveBeenCalled();
    });

    it('Should test the predicate on every element before the first matching element', function () {
        ko.utils.arrayFirst(["a", "b", "c"], matchB);

        expect(matchB.calls.length).toBe(2);
        expect(matchB.calls[0].args).toEqual(["a", 0, ["a", "b", "c"]]);
        expect(matchB.calls[1].args).toEqual(["b", 1, ["a", "b", "c"]]);
    });

    it('Should return undefined if no element matches', function () {
        var result = ko.utils.arrayFirst(["a", "b", "c"], matchD);

        expect(result).toBe(undefined);
    });

    it('Should test every element if no element matches', function () {
        ko.utils.arrayFirst(["a", "b", "c"], matchD);

        expect(matchD.calls.length).toBe(3);
        expect(matchD.calls[0].args).toEqual(["a", 0, ["a", "b", "c"]]);
        expect(matchD.calls[1].args).toEqual(["b", 1, ["a", "b", "c"]]);
        expect(matchD.calls[2].args).toEqual(["c", 2, ["a", "b", "c"]]);
    });

    it('Should throw an error for a null array', function () {
        expect(function () {
            ko.utils.arrayFirst(null, function () {});
        }).toThrow();
    });
});

describe('arrayGetDistinctValues', function () {
    it('Should remove duplicates from an array of non-unique values', function () {
        var result = ko.utils.arrayGetDistinctValues(["a", "b", "b", "c", "c"]);
        expect(result).toEqual(["a", "b", "c"]);
    });

    it('Should do nothing with an empty array', function () {
        var result = ko.utils.arrayGetDistinctValues([]);
        expect(result).toEqual([]);
    });

    it('Should do nothing with an array of unique values', function () {
        var result = ko.utils.arrayGetDistinctValues(["a", "b", "c"]);
        expect(result).toEqual(["a", "b", "c"]);
    });

    it('Should copy the input array', function () {
        var input = ["a", "b", "c", "c"];
        var result = ko.utils.arrayGetDistinctValues(input);
        expect(result).not.toBe(input);
    });

    it("Should copy the input array, even if it's unchanged", function () {
        var input = ["a", "b", "c"];
        var result = ko.utils.arrayGetDistinctValues(input);
        expect(result).toEqual(input);
        expect(result).not.toBe(input);
    });

    it('Should return an empty array when called with a null array', function () {
        var result = ko.utils.arrayGetDistinctValues(null);
        expect(result).toEqual([]);
    });
});

describe('arrayMap', function () {
    it('Should return the array with every element transformed by the map function', function () {
        var appendIndex = function (x, i) {
            return x + i;
        };

        var result = ko.utils.arrayMap(["a", "b", "c"], appendIndex);

        expect(result).toEqual(["a0", "b1", "c2"]);
    });

    it('Should return empty arrays for empty arrays, and not call the map function', function () {
        var mapFunction = jasmine.createSpy('mapFunction');

        var result = ko.utils.arrayMap([], mapFunction);

        expect(result).toEqual([]);
        expect(mapFunction).not.toHaveBeenCalled();
    });

    it('Should copy the array before returning it', function () {
        var identityFunction = function(x) {
            return x;
        };

        var input = ["a", "b", "c"];
        var result = ko.utils.arrayMap(input, identityFunction);

        expect(result).toEqual(input);
        expect(result).not.toBe(input);
    });

    it('Should alter "this" context when defined as an argument', function() {
        var expectedContext = {};
        var actualContext = null;
        var identityFunction = function(x) {
            actualContext = this;
            return x;
        };

        ko.utils.arrayMap(["a"], identityFunction, expectedContext);

        expect(actualContext).toBe(expectedContext);
    });

    it('Should return an empty array when called with a null array', function () {
        var result = ko.utils.arrayMap(null, function () {});
        expect(result).toEqual([]);
    });
});

describe('arrayFilter', function () {
    it('Should filter the array to only show matching members', function () {
        var evenOnly = function (x, i) {
            return i % 2 == 0;
        };

        var result = ko.utils.arrayFilter(["a", "b", "c", "d"], evenOnly);

        expect(result).toEqual(["a", "c"]);
    });

    it('Should return empty arrays for empty arrays, and not call the filter function', function () {
        var filterFunction = jasmine.createSpy('filterFunction');

        var result = ko.utils.arrayFilter([], filterFunction);

        expect(result).toEqual([]);
        expect(filterFunction).not.toHaveBeenCalled();
    });

    it('Should copy the array before returning it', function () {
        var alwaysTrue = function(x) {
            return true;
        };

        var input = ["a", "b", "c"];
        var result = ko.utils.arrayFilter(input, alwaysTrue);

        expect(result).toEqual(input);
        expect(result).not.toBe(input);
    });

    it('Should alter "this" context when defined as an argument', function () {
        var expectedContext = {};
        var actualContext = null;
        var identityFunction = function(x) {
            actualContext = this;
            return x;
        };

        var result = ko.utils.arrayFilter(["a"], identityFunction, expectedContext);

        expect(expectedContext).toEqual(actualContext);
    });

    it('Should return an empty array when called with a null array', function () {
        var result = ko.utils.arrayFilter(null, function () {});
        expect(result).toEqual([]);
    });
});

describe('arrayPushAll', function () {
    it('appends the second array elements to the first array', function () {
        var targetArray = [1,2,3];
        var extraArray = ["a", "b", "c"];

        ko.utils.arrayPushAll(targetArray, extraArray);

        expect(targetArray).toEqual([1, 2, 3, "a", "b", "c"]);
    });

    it('does nothing if the second array is empty', function () {
        var targetArray = [1,2,3];
        ko.utils.arrayPushAll(targetArray, []);
        expect(targetArray).toEqual([1, 2, 3]);
    });

    it('Should throw an error for a null first array', function () {
        expect(function () {
            ko.utils.arrayPushAll(null, []);
        }).toThrow();
    });

    it('Should throw an error for a null second array', function () {
        expect(function () {
            ko.utils.arrayPushAll([], null);
        }).toThrow();
    });
});

describe('Function.bind', function() {
    // In most browsers, this will be testing the native implementation
    // Adapted from Lo-Dash (https://github.com/lodash/lodash)
    function fn() {
        var result = [this];
        result.push.apply(result, arguments);
        return result;
    }

    it('should bind a function to an object', function () {
        var object = {},
            bound = fn.bind(object);

        expect(bound('a')).toEqual([object, 'a']);
    });

    it('should accept a falsy `thisArg` argument', function () {
        ko.utils.arrayForEach(['', 0, false, NaN], function (value) {
            var bound = fn.bind(value);
            expect(bound()[0].constructor).toEqual(Object(value).constructor);
        });
    });

    it('should bind a function to `null` or `undefined`', function () {
        var bound = fn.bind(null),
            actual = bound('a'),
            global = jasmine.getGlobal();

        expect(actual[0]).toEqualOneOf([null, global]);
        expect(actual[1]).toEqual('a');

        bound = fn.bind(undefined);
        actual = bound('b');

        expect(actual[0]).toEqualOneOf([undefined, global]);
        expect(actual[1]).toEqual('b');

        bound = fn.bind();
        actual = bound('b');

        expect(actual[0]).toEqualOneOf([undefined, global]);
        expect(actual[1]).toEqual('b');
    });

    it('should partially apply arguments', function () {
        var object = {},
            bound = fn.bind(object, 'a');

        expect(bound()).toEqual([object, 'a']);

        bound = fn.bind(object, 'a');
        expect(bound('b')).toEqual([object, 'a', 'b']);

        bound = fn.bind(object, 'a', 'b');
        expect(bound()).toEqual([object, 'a', 'b']);
        expect(bound('c', 'd')).toEqual([object, 'a', 'b', 'c', 'd']);
    });

    it('should append array arguments to partially applied arguments', function () {
        var object = {},
            bound = fn.bind(object, 'a');

        expect(bound(['b'], 'c')).toEqual([object, 'a', ['b'], 'c']);
    });

    it('should rebind functions correctly', function () {
        var object1 = {},
            object2 = {},
            object3 = {};

        var bound1 = fn.bind(object1),
            bound2 = bound1.bind(object2, 'a'),
            bound3 = bound1.bind(object3, 'b');

        expect(bound1()).toEqual([object1]);
        expect(bound2()).toEqual([object1, 'a']);
        expect(bound3()).toEqual([object1, 'b']);
    });
});

describe('objectMap', function () {
    it('Should alter "this" context when defined as an argument', function() {
        var expectedContext = {};
        var actualContext = null;
        var identityFunction = function(obj) {
            actualContext = this;
            return {x : obj.x};
        };

        var result = ko.utils.objectMap({x:1}, identityFunction, expectedContext);

        expect(expectedContext).toEqual(actualContext);
    });
});
