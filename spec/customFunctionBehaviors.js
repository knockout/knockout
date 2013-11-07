describe('Custom functions', function () {

    it('Should be available retroactively on browsers that support __proto__', function () {
        var __proto__isSupported = ko.utils.tryToSetPrototypeOf({});

        if (!__proto__isSupported) {
            return;
        }

        var subscribable = new ko.subscribable();
        var observable = ko.observable();
        var observableArray = ko.observableArray();
        var computed = ko.computed(function () {});

        var customFunction1 = function () {};
        var customFunction2 = function () {};

        ko.subscribable.fn.customFunction1 = customFunction1;
        ko.observable.fn.customFunction2 = customFunction2;

        // Test inheritance from ko.subscribable.
        expect(subscribable.customFunction1).toBe(customFunction1);
        expect(observable.customFunction1).toBe(customFunction1);
        expect(observableArray.customFunction1).toBe(customFunction1);
        expect(computed.customFunction1).toBe(customFunction1);

        // Test inheritance from ko.observable.
        expect(observable.customFunction2).toBe(customFunction2);
        expect(observableArray.customFunction2).toBe(customFunction2);
    });

    it('Should continue to work on browsers that do not support __proto__', function () {
        var tryToSetPrototypeOf = ko.utils.tryToSetPrototypeOf;

        // Patch tryToSetPrototypeOf to emulate missing __proto__ support.
        ko.utils.tryToSetPrototypeOf = function () {
            return false;
        };

        var customFunction1 = function () {};
        var customFunction2 = function () {};

        ko.subscribable.fn.customFunction1 = customFunction1;
        ko.observable.fn.customFunction2 = customFunction2;

        var subscribable = new ko.subscribable();
        var observable = ko.observable();
        var observableArray = ko.observableArray();
        var computed = ko.computed(function () {});

        // Test inheritance from ko.subscribable.
        expect(subscribable.customFunction1).toBe(customFunction1);
        expect(observable.customFunction1).toBe(customFunction1);
        expect(observableArray.customFunction1).toBe(customFunction1);
        expect(computed.customFunction1).toBe(customFunction1);

        // Test inheritance from ko.observable.
        expect(observable.customFunction2).toBe(customFunction2);
        expect(observableArray.customFunction2).toBe(customFunction2);

        // Restore function to its original value.
        ko.utils.tryToSetPrototypeOf = tryToSetPrototypeOf;
    });
});
