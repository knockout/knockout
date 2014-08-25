
describe('Pure Computed', function() {
    it('Should advertise that instances are computed', function () {
        var computed = ko.pureComputed(function () { });
        expect(ko.isComputed(computed)).toEqual(true);
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

    it('Should evaluate on each access while sleeping if not disposed', function () {
        var timesEvaluated = 0,
            data = ko.observable(),
            computed = ko.pureComputed(function () { data(); return ++timesEvaluated; });

        expect(timesEvaluated).toEqual(0);

        expect(computed()).toEqual(1);
        expect(timesEvaluated).toEqual(1);

        expect(computed()).toEqual(2);
        expect(timesEvaluated).toEqual(2);
    });

    it('Should not subscribe to dependencies while sleeping', function() {
        var data = ko.observable(1),
            computed = ko.pureComputed(data);

        // Accessing the computed evaluates it
        expect(computed()).toEqual(1);

        // No subscription is registered on the depenedent observable
        expect(data.getSubscriptionsCount()).toEqual(0);

        // getDependenciesCount returns the correct number
        expect(computed.getDependenciesCount()).toEqual(1);
    });

    it('Should not evaluate after it has been disposed', function () {
        var evaluateCount = 0,
            observable = ko.observable(0),
            computed = ko.pureComputed(function () { return ++evaluateCount + observable(); });

        expect(computed()).toEqual(1);
        expect(evaluateCount).toEqual(1);

        computed.dispose();
        expect(computed.isActive()).toEqual(false);

        // These should not cause a new evaluation
        observable(1);
        expect(computed()).toEqual(1);
        expect(evaluateCount).toEqual(1);
    });

    it('Should awaken and perform dependency detection when subscribed to', function() {
        var data = ko.observable(1),
            computed = ko.pureComputed(data),
            notifiedValues = [];

        // Subscribe to computed; the dependency should now be tracked
        computed.subscribe(function (value) { notifiedValues.push(value); });
        expect(data.getSubscriptionsCount()).toEqual(1);
        expect(computed.getDependenciesCount()).toEqual(1);

        // The subscription should not have sent down the initial value
        expect(notifiedValues).toEqual([]);

        // Updating data should trigger the subscription
        data(42);
        expect(notifiedValues).toEqual([42]);
    });

    it('Should go back to sleep when all subcriptions are disposed', function() {
        var data = ko.observable(1),
            computed = ko.pureComputed(data),
            subscription = computed.subscribe(function () {});

        expect(data.getSubscriptionsCount()).toEqual(1);
        expect(computed.getDependenciesCount()).toEqual(1);

        // Dispose the subscription to the computed
        subscription.dispose();
        // It goes to sleep, disposing its subscription to the observable
        expect(data.getSubscriptionsCount()).toEqual(0);
        expect(computed.getDependenciesCount()).toEqual(1);
    });

    it('Should minimized evaluations when accessed from a computed', function() {
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
        expect(function() {
            ko.computed(computed);
        }).toThrow();
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

            expect(computed()).toEqual(2);     // second evaluation
            expect(computed.getDependenciesCount()).toEqual(2); // matches value from context
        });
    });
});
