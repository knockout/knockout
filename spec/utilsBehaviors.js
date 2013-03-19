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