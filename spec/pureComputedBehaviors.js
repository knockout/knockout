
describe('Pure Computed', function() {
    it('Should advertise that instances are computed', function () {
        var computed = ko.pureComputed(function () { });
        expect(ko.isComputed(computed)).toEqual(true);
    });

    it('Should advertise that instances are pure computed', function () {
        var instance = ko.pureComputed(function () { });
        expect(ko.isPureComputed(instance)).toEqual(true);
    });

    it('Should require an evaluator function as constructor param', function () {
        expect(function () { ko.pureComputed(); }).toThrow();
    });

    it('Should be able to pass evaluator function using "options" parameter called "read"', function() {
        var computed = ko.pureComputed({
            read: function () { return 123; }
        });
        expect(computed()).toEqual(123);
    });

    it('Should not be able to write a value to it if there is no "write" callback', function () {
        var computed = ko.pureComputed(function () { return 123; });
        expect(ko.isWriteableObservable(computed)).toEqual(false);
        expect(function () { computed(456); }).toThrow();
    });

    it('Should invoke the "write" callback, where present, if you attempt to write a value to it', function() {
        var invokedWriteWithValue;
        var computed = ko.pureComputed({
            read: function() {},
            write: function(value) { invokedWriteWithValue = value; }
        });
        expect(ko.isWriteableObservable(computed)).toEqual(true);
        computed("some value");
        expect(invokedWriteWithValue).toEqual("some value");
    });

    it('Should describe itself as active initially', function() {
        var computed = ko.pureComputed(function () { });
        expect(computed.isActive()).toEqual(true);
    });

    it('Should describe itself as inactive if the evaluator has no dependencies on its first run', function() {
        var computed = ko.pureComputed(function () { });
        computed(); // access the computed to evaluate it
        expect(computed.isActive()).toEqual(false);
    });

    it('Should describe itself as active if the evaluator has dependencies on its first run', function() {
        var observable = ko.observable('initial'),
            computed = ko.computed(observable);
        computed(); // access the computed to evaluate it
        expect(computed.isActive()).toEqual(true);
    });

    it('Should evaluate on each access while sleeping when dependencies have changed', function () {
        var timesEvaluated = 0,
            data = ko.observable('A'),
            computed = ko.pureComputed(function () { ++timesEvaluated; return data(); });

        expect(timesEvaluated).toEqual(0);

        expect(computed()).toEqual('A');
        expect(timesEvaluated).toEqual(1);

        // Access after changing dependency causes re-evaluation
        data('B');
        expect(computed()).toEqual('B');
        expect(timesEvaluated).toEqual(2);

        // Test a second time using peek
        data('C');
        expect(computed.peek()).toEqual('C');
        expect(timesEvaluated).toEqual(3);

        // Access without changing dependency does not cause evaluation
        expect(computed()).toEqual('C');
        expect(timesEvaluated).toEqual(3);
    });

    it('Should not subscribe to dependencies while sleeping', function() {
        var data = ko.observable('A'),
            computed = ko.pureComputed(data);

        // Accessing the computed evaluates it
        expect(computed()).toEqual('A');

        // No subscription is registered on the depenedent observable
        expect(data.getSubscriptionsCount()).toEqual(0);

        // getDependenciesCount returns the correct number
        expect(computed.getDependenciesCount()).toEqual(1);
    });

    it('Should not evaluate after it has been disposed', function () {
        var timesEvaluated = 0,
            data = ko.observable('A'),
            computed = ko.pureComputed(function () { ++timesEvaluated; return data(); });

        expect(computed()).toEqual('A');
        expect(timesEvaluated).toEqual(1);

        computed.dispose();
        expect(computed.isActive()).toEqual(false);

        // These should not cause a new evaluation
        data('B');
        expect(computed()).toEqual('A');
        expect(timesEvaluated).toEqual(1);
    });

    it('Should awaken and perform dependency detection when subscribed to', function() {
        var data = ko.observable('A'),
            computed = ko.pureComputed(data),
            notifiedValues = [];

        // Subscribe to computed; the dependency should now be tracked
        computed.subscribe(function (value) { notifiedValues.push(value); });
        expect(data.getSubscriptionsCount()).toEqual(1);
        expect(computed.getDependenciesCount()).toEqual(1);

        // The subscription should not have sent down the initial value
        expect(notifiedValues).toEqual([]);

        // Updating data should trigger the subscription
        data('B');
        expect(notifiedValues).toEqual(['B']);
    });

    it('Should go back to sleep when all subcriptions are disposed', function() {
        var data = ko.observable('A'),
            computed = ko.pureComputed(data),
            subscription = computed.subscribe(function () {});

        expect(data.getSubscriptionsCount()).toEqual(1);
        expect(computed.getDependenciesCount()).toEqual(1);

        // Dispose the subscription to the computed
        subscription.dispose();
        // It goes to sleep, disposing its subscription to the observable
        expect(data.getSubscriptionsCount()).toEqual(0);
        expect(computed.getDependenciesCount()).toEqual(1);     // dependency count of computed doesn't change
    });

    it('Should fire "awake" and "asleep" events when changing state', function() {
        var data = ko.observable('A'),
            computed = ko.pureComputed(data);

        var notifySpy = jasmine.createSpy('notifySpy');
        computed.subscribe(notifySpy.bind(null, 'awake'), null, 'awake');
        computed.subscribe(notifySpy.bind(null, 'asleep'), null, 'asleep');

        // Subscribing to non-change events doesn't awaken computed
        expect(data.getSubscriptionsCount()).toEqual(0);

        // Subscribe to computed; notifies with value
        var subscription = computed.subscribe(function () {});
        expect(notifySpy.argsForCall).toEqual([ ['awake', 'A'] ]);
        expect(data.getSubscriptionsCount()).toEqual(1);

        notifySpy.reset();
        data('B');
        expect(notifySpy).not.toHaveBeenCalled();

        subscription.dispose();
        expect(notifySpy.argsForCall).toEqual([ ['asleep', undefined] ]);
        expect(data.getSubscriptionsCount()).toEqual(0);
    });

    it('Should subscribe to dependencies when awakened while minimizing evaluations', function() {
        var timesEvaluated = 0,
            data = ko.observable('A'),
            computed = ko.pureComputed(function () { ++timesEvaluated; return data(); }),
            notifiedValues = [],
            subscribeFunc = function (value) { notifiedValues.push(value); },
            subscription;

        expect(timesEvaluated).toEqual(0);

        expect(computed()).toEqual('A');
        expect(timesEvaluated).toEqual(1);
        expect(computed.getDependenciesCount()).toEqual(1);

        // Subscribing to the computed adds a subscription to the dependency without re-evaluating
        subscription = computed.subscribe(subscribeFunc);
        expect(data.getSubscriptionsCount()).toEqual(1);
        expect(timesEvaluated).toEqual(1);

        // Dispose the subscription; reading the sleeping computed doesn't cause re-evaluation
        subscription.dispose();
        expect(computed()).toEqual('A');
        expect(timesEvaluated).toEqual(1);

        // Updating data doesn't trigger re-evaluation (computed is sleeping)
        data('B');
        expect(timesEvaluated).toEqual(1);

        // Subscribing to the computed now does cause a re-evaluation because the dependency was changed
        subscription = computed.subscribe(subscribeFunc);
        expect(timesEvaluated).toEqual(2);
        expect(notifiedValues).toEqual([]); // But nothing notified

        // Updating data should re-evaluate and trigger the subscription
        data('C');
        expect(timesEvaluated).toEqual(3);
        expect(notifiedValues).toEqual(['C']);
    });

    it('Should minimize evaluations when accessed from a computed', function() {
        var timesEvaluated = 0,
            data = ko.observable('A'),
            pureComputed = ko.pureComputed(function () { ++timesEvaluated; return data(); }),
            computed = ko.computed(pureComputed);

        // Should only have evaluated the pure computed once
        expect(computed()).toEqual('A');
        expect(timesEvaluated).toEqual(1);

        // Updating the dependency evaluates it again
        data('B');
        expect(computed()).toEqual('B');
        expect(timesEvaluated).toEqual(2);

        // Double check that disposing subscriptions puts the pure computed to sleep
        computed.dispose();
        expect(data.getSubscriptionsCount()).toEqual(0);
    });

    it('Should evaluate latest value when chaining pure computeds', function() {
        var data = ko.observable('A'),
            computed1 = ko.pureComputed(data),
            computed2 = ko.pureComputed(computed1);

        expect(computed2()).toEqual('A');

        data('B');
        expect(computed2()).toEqual('B');
    });

    it('Should minimize evaluations when chaining pure computeds', function() {
        var timesEvaluated = 0,
            data = ko.observable('A'),
            computed1 = ko.pureComputed(function () { return data() <= 'M'; } ),  // This computed will return the same value for many values of data
            computed2 = ko.pureComputed(function () { ++timesEvaluated; return computed1(); });     // This computed should only be re-evaluated when computed1 actually changes

        expect(computed2()).toEqual(true);
        expect(timesEvaluated).toEqual(1);

        data('B');
        expect(computed2()).toEqual(true);
        expect(timesEvaluated).toEqual(1);

        data('Z');
        expect(computed2()).toEqual(false);
        expect(timesEvaluated).toEqual(2);
    });

    it('Should be able to re-evaluate a sleeping computed that previously threw an exception', function() {
        var shouldThrow = ko.observable(false), observableValue = ko.observable(1),
            computed = ko.pureComputed(function() {
                if (shouldThrow()) {
                    throw Error("Error during computed evaluation");
                } else {
                    return observableValue();
                }
            });

        expect(computed()).toEqual(1);

        observableValue(2);
        shouldThrow(true);
        expect(computed).toThrow("Error during computed evaluation");

        shouldThrow(false);
        expect(computed()).toEqual(2);
    });

    it('Should prevent recursive calling of read function', function() {
        // It doesn't really make sense to use the value of a pure computed within itself since there's no way to
        // prevent infinite recursion (a pure computed should never alter external state). So expect an error
        // if a pure computed is referenced recursively.
        var observable = ko.observable('A'),
            computed = ko.pureComputed(function() {
                return '' + observable() + computed();
            });

        // While sleeping
        expect(computed).toThrow();

        // While awake
        observable('B');    // to ensure re-evaluation
        expect(function() {
            ko.computed(computed);
        }).toThrow();
    });

    it('Should not add dependencies if disposed during evaluation while sleeping', function () {
        // This is a bit of a contrived example and likely won't occur in any actual applications.
        // See https://github.com/knockout/knockout/issues/1041
        var timesEvaluated = 0,
            observableToTriggerDisposal = ko.observable(false),
            observableGivingValue = ko.observable('A'),
            computed = ko.pureComputed(function() {
                if (observableToTriggerDisposal())
                    computed.dispose();
                ++timesEvaluated;
                return observableGivingValue();
            });

        // Check initial state
        expect(computed()).toEqual('A');
        expect(timesEvaluated).toEqual(1);
        expect(computed.getDependenciesCount()).toEqual(2);

        // Now cause a disposal during evaluation
        observableToTriggerDisposal(true);
        expect(computed()).toEqual('A');
        expect(timesEvaluated).toEqual(2);
        expect(computed.getDependenciesCount()).toEqual(0);
    });

    describe('Should maintain order of subscriptions', function () {
        var data, dataPureComputed;

        function subscribeAndUpdate(computed, newDataValue, expectedNotifiedValues) {
            var notifiedValues = [];
            computed.subscribe(function (value) { notifiedValues.push(value); });

            data(newDataValue);
            expect(notifiedValues).toEqual(expectedNotifiedValues);
        }

        beforeEach(function() {
            data = ko.observable('A');
            ko.computed(data); // This computed ensures that the 'data' observable gets an id number right away

            // Because this is a pure computed, it will subscribe to 'data' in response to awakening, such
            // as being accessed from another computed. It will also then get a higher id number than 'data'.
            dataPureComputed = ko.pureComputed(data);
        });

        // The following two tests demonstrate that the difference in the order of subscriptions can be tested.

        it('base behavior: order is pure computed, observable', function() {
            // This one accesses the base observable second, so that the first update happens after both values have been updated
            var computed = ko.pureComputed(function () { return dataPureComputed() + data(); });
            subscribeAndUpdate(computed, 'B', ['BB']);
        });

        it('base behavior: order is observable, pure computed', function() {
            // This one accesses the base observable first, which results in an update before 'dataPureComputed' has updated
            var computed = ko.pureComputed(function () { return data() + dataPureComputed(); });
            subscribeAndUpdate(computed, 'B', ['BA', 'BB']);
        });

        // This test sets up a pure computed using the first order and checks that the order stays correct
        // when awakened after being accessed, such that it's not re-evaluated.

        it('when awakening, without re-evaluation', function() {
            var timesEvaluated = 0,
                computed = ko.pureComputed(function () { ++timesEvaluated; return dataPureComputed() + data(); });

            // Access the pure computed while it is sleeping to evaluate it and record the dependencies
            expect(computed()).toEqual('AA');
            expect(timesEvaluated).toEqual(1);

            // If the subscriptions happen in the wrong order, we'll get two notifications: 'AB', 'BB'
            subscribeAndUpdate(computed, 'B', ['BB']);
            expect(timesEvaluated).toEqual(3);
        });
    });

    describe('Context', function() {
        it('Should not define initial evaluation', function() {
            var observable = ko.observable(1),
                evaluationCount = 0,
                computed = ko.pureComputed(function() {
                    ++evaluationCount;
                    observable();   // for dependency
                    return ko.computedContext.isInitial();
                });

            expect(evaluationCount).toEqual(0);     // no evaluation yet
            expect(computed()).toEqual(undefined);  // isInitial is always undefined for a pure computed
            expect(evaluationCount).toEqual(1);     // single evaluation

            observable(2);
            ko.computed(computed);                  // wake up computed by subscribing to it
            expect(evaluationCount).toEqual(2);     // which causes a second evaluation
            expect(computed()).toEqual(undefined);  // isInitial is still undefined
        });

        it('Should accurately report the number of dependencies', function() {
            var observable1 = ko.observable(1),
                observable2 = ko.observable(1),
                evaluationCount = 0,
                computed = ko.pureComputed(function() {
                    // no dependencies at first
                    expect(ko.computedContext.getDependenciesCount()).toEqual(0);
                    // add a single dependency
                    observable1();
                    expect(ko.computedContext.getDependenciesCount()).toEqual(1);
                    // add a second one
                    observable2();
                    expect(ko.computedContext.getDependenciesCount()).toEqual(2);
                    // accessing observable again doesn't affect count
                    observable1();
                    expect(ko.computedContext.getDependenciesCount()).toEqual(2);

                    return ++evaluationCount;
                });

            expect(computed()).toEqual(1);     // single evaluation
            expect(computed.getDependenciesCount()).toEqual(2); // matches value from context

            observable1(2);
            expect(computed()).toEqual(2);     // second evaluation
            expect(computed.getDependenciesCount()).toEqual(2); // matches value from context
        });
    });
});
