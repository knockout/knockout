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

describe('arrayForEach', function () {
    it('Should go call the callback for each element of the array, in order', function () {
        var callback = jasmine.createSpy('callback');

        ko.utils.arrayForEach(["a", "b", "c"], callback);

        expect(callback.calls.length).toBe(3);
        expect(callback.calls[0].args).toEqual(["a", 0]);
        expect(callback.calls[1].args).toEqual(["b", 1]);
        expect(callback.calls[2].args).toEqual(["c", 2]);
    });

    it('Should do nothing with empty arrays', function () {
        var callback = jasmine.createSpy('callback');

        ko.utils.arrayForEach([], callback);

        expect(callback).not.toHaveBeenCalled();
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

    it('Should return null with empty arrays, and not call the predicate', function () {
        var predicate = jasmine.createSpy('predicate');

        var result = ko.utils.arrayFirst([], predicate);

        expect(result).toBe(null);
        expect(predicate).not.toHaveBeenCalled();
    });

    it('Should test the predicate on every element before the first matching element', function () {
        ko.utils.arrayFirst(["a", "b", "c"], matchB);

        expect(matchB.calls.length).toBe(2);
        expect(matchB.calls[0].args).toEqual(["a", 0]);
        expect(matchB.calls[1].args).toEqual(["b", 1]);
    });

    it('Should return null if no element matches', function () {
        var result = ko.utils.arrayFirst(["a", "b", "c"], matchD);

        expect(result).toBe(null);
    });

    it('Should test every element if no element matches', function () {
        ko.utils.arrayFirst(["a", "b", "c"], matchD);

        expect(matchD.calls.length).toBe(3);
        expect(matchD.calls[0].args).toEqual(["a", 0]);
        expect(matchD.calls[1].args).toEqual(["b", 1]);
        expect(matchD.calls[2].args).toEqual(["c", 2]);
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
        }

        var input = ["a", "b", "c"];
        var result = ko.utils.arrayMap(input, identityFunction);

        expect(result).toEqual(input);
        expect(result).not.toBe(input);
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
        }

        var input = ["a", "b", "c"];
        var result = ko.utils.arrayFilter(input, alwaysTrue);

        expect(result).toEqual(input);
        expect(result).not.toBe(input);
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
});