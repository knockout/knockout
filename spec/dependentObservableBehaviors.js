
describe('Dependent Observable', function() {
    it('Should be subscribable', function () {
        var instance = ko.computed(function () { });
        expect(ko.isSubscribable(instance)).toEqual(true);
    });

    it('Should advertise that instances are observable', function () {
        var instance = ko.computed(function () { });
        expect(ko.isObservable(instance)).toEqual(true);
    });

    it('Should advertise that instances are computed', function () {
        var instance = ko.computed(function () { });
        expect(ko.isComputed(instance)).toEqual(true);
    });

    it('Should advertise that instances are not pure computed', function () {
        var instance = ko.computed(function () { });
        expect(ko.isPureComputed(instance)).toEqual(false);
    });

    it('Should advertise that instances cannot have values written to them', function () {
        var instance = ko.computed(function () { });
        expect(ko.isWriteableObservable(instance)).toEqual(false);
        expect(ko.isWritableObservable(instance)).toEqual(false);
    });

    it('Should require an evaluator function as constructor param', function () {
        expect(function () { ko.computed(); }).toThrow();
    });

    it('Should be able to read the current value of the evaluator function', function () {
        var instance = ko.computed(function () { return 123; });
        expect(instance()).toEqual(123);
    });

    it('Should not be able to write a value to it if there is no "write" callback', function () {
        var instance = ko.computed(function () { return 123; });

        expect(function () { instance(456); }).toThrow();
        expect(instance()).toEqual(123);
    });

    it('Should invoke the "write" callback, where present, if you attempt to write a value to it', function() {
        var invokedWriteWithValue, invokedWriteWithThis;
        var instance = ko.computed({
            read: function() {},
            write: function(value) { invokedWriteWithValue = value; invokedWriteWithThis = this; }
        });

        var someContainer = { depObs: instance };
        someContainer.depObs("some value");
        expect(invokedWriteWithValue).toEqual("some value");
        expect(invokedWriteWithThis).toEqual(function(){return this;}.call()); // Since no owner was specified
    });

    it('Should be able to write to multiple computed properties on a model object using chaining syntax', function() {
        var model = {
            prop1: ko.computed({
                read: function(){},
                write: function(value) {
                    expect(value).toEqual("prop1");
                } }),
            prop2: ko.computed({
                read: function(){},
                write: function(value) {
                    expect(value).toEqual("prop2");
                } })
        };
        model.prop1('prop1').prop2('prop2');
    });

    it('Should be able to use Function.prototype methods to access/update', function() {
        var instance = ko.computed({read: function() {return 'A'}, write: function(value) {}});
        var obj = {};

        expect(instance.call(null)).toEqual('A');
        expect(instance.apply(null, [])).toBe('A');
        expect(instance.call(obj, 'B')).toBe(obj);
    });

    it('Should use options.owner as "this" when invoking the "write" callback, and can pass multiple parameters', function() {
        var invokedWriteWithArgs, invokedWriteWithThis;
        var someOwner = {};
        var instance = ko.computed({
            read: function() {},
            write: function() { invokedWriteWithArgs = Array.prototype.slice.call(arguments, 0); invokedWriteWithThis = this; },
            owner: someOwner
        });

        instance("first", 2, ["third1", "third2"]);
        expect(invokedWriteWithArgs.length).toEqual(3);
        expect(invokedWriteWithArgs[0]).toEqual("first");
        expect(invokedWriteWithArgs[1]).toEqual(2);
        expect(invokedWriteWithArgs[2]).toEqual(["third1", "third2"]);
        expect(invokedWriteWithThis).toEqual(someOwner);
    });

    it('Should use the second arg (evaluatorFunctionTarget) for "this" when calling read/write if no options.owner was given', function() {
        var expectedThis = {}, actualReadThis, actualWriteThis;
        var instance = ko.computed({
            read: function() { actualReadThis = this },
            write: function() { actualWriteThis = this }
        }, expectedThis);

        instance("force invocation of write");

        expect(actualReadThis).toEqual(expectedThis);
        expect(actualWriteThis).toEqual(expectedThis);
    });

    it('Should be able to pass evaluator function using "options" parameter called "read"', function() {
        var instance = ko.computed({
            read: function () { return 123; }
        });
        expect(instance()).toEqual(123);
    });

    it('Should cache result of evaluator function and not call it again until dependencies change', function () {
        var timesEvaluated = 0;
        var instance = ko.computed(function () { timesEvaluated++; return 123; });
        expect(instance()).toEqual(123);
        expect(instance()).toEqual(123);
        expect(timesEvaluated).toEqual(1);
    });

    it('Should automatically update value when a dependency changes', function () {
        var observable = new ko.observable(1);
        var depedentObservable = ko.computed(function () { return observable() + 1; });
        expect(depedentObservable()).toEqual(2);

        observable(50);
        expect(depedentObservable()).toEqual(51);
    });

    it('Should be able to use \'peek\' on an observable to avoid a dependency', function() {
        var observable = ko.observable(1),
            computed = ko.computed(function () { return observable.peek() + 1; });
        expect(computed()).toEqual(2);

        observable(50);
        expect(computed()).toEqual(2);    // value wasn't changed
    });

    it('Should be able to use \'ko.ignoreDependencies\' within a computed to avoid dependencies', function() {
        var observable = ko.observable(1),
            computed = ko.dependentObservable(function () {
                return ko.ignoreDependencies(function() { return observable() + 1 } );
            });
        expect(computed()).toEqual(2);

        observable(50);
        expect(computed()).toEqual(2);    // value wasn't changed
    });

    it('Should unsubscribe from previous dependencies each time a dependency changes', function () {
        var observableA = new ko.observable("A");
        var observableB = new ko.observable("B");
        var observableToUse = "A";
        var timesEvaluated = 0;
        var depedentObservable = ko.computed(function () {
            timesEvaluated++;
            return observableToUse == "A" ? observableA() : observableB();
        });

        expect(depedentObservable()).toEqual("A");
        expect(timesEvaluated).toEqual(1);

        // Changing an unrelated observable doesn't trigger evaluation
        observableB("B2");
        expect(timesEvaluated).toEqual(1);

        // Switch to other observable
        observableToUse = "B";
        observableA("A2");
        expect(depedentObservable()).toEqual("B2");
        expect(timesEvaluated).toEqual(2);

        // Now changing the first observable doesn't trigger evaluation
        observableA("A3");
        expect(timesEvaluated).toEqual(2);
    });

    it('Should notify subscribers of changes', function () {
        var notifiedValue;
        var observable = new ko.observable(1);
        var depedentObservable = ko.computed(function () { return observable() + 1; });
        depedentObservable.subscribe(function (value) { notifiedValue = value; });

        expect(notifiedValue).toEqual(undefined);
        observable(2);
        expect(notifiedValue).toEqual(3);
    });

    it('Should notify "beforeChange" subscribers before changes', function () {
        var notifiedValue;
        var observable = new ko.observable(1);
        var depedentObservable = ko.computed(function () { return observable() + 1; });
        depedentObservable.subscribe(function (value) { notifiedValue = value; }, null, "beforeChange");

        expect(notifiedValue).toEqual(undefined);
        observable(2);
        expect(notifiedValue).toEqual(2);
        expect(depedentObservable()).toEqual(3);
    });

    it('Should only update once when each dependency changes, even if evaluation calls the dependency multiple times', function () {
        var notifiedValues = [];
        var observable = new ko.observable();
        var depedentObservable = ko.computed(function () { return observable() * observable(); });
        depedentObservable.subscribe(function (value) { notifiedValues.push(value); });
        observable(2);
        expect(notifiedValues.length).toEqual(1);
        expect(notifiedValues[0]).toEqual(4);
    });

    it('Should be able to chain computed observables', function () {
        var underlyingObservable = new ko.observable(1);
        var computed1 = ko.computed(function () { return underlyingObservable() + 1; });
        var computed2 = ko.computed(function () { return computed1() + 1; });
        expect(computed2()).toEqual(3);

        underlyingObservable(11);
        expect(computed2()).toEqual(13);
    });

    it('Should be able to use \'peek\' on a computed observable to avoid a dependency', function () {
        var underlyingObservable = new ko.observable(1);
        var computed1 = ko.computed(function () { return underlyingObservable() + 1; });
        var computed2 = ko.computed(function () { return computed1.peek() + 1; });
        expect(computed2()).toEqual(3);
        expect(computed2.isActive()).toEqual(false);

        underlyingObservable(11);
        expect(computed2()).toEqual(3);    // value wasn't changed
    });

    it('Should accept "owner" parameter to define the object on which the evaluator function should be called', function () {
        var model = new (function () {
            this.greeting = "hello";
            this.fullMessageWithoutOwner = ko.computed(function () { return this.greeting + " world" });
            this.fullMessageWithOwner = ko.computed(function () { return this.greeting + " world" }, this);
        })();
        expect(model.fullMessageWithoutOwner()).toEqual("undefined world");
        expect(model.fullMessageWithOwner()).toEqual("hello world");
    });

    it('Should dispose and not call its evaluator function when the disposeWhen function returns true', function () {
        var underlyingObservable = new ko.observable(100);
        var timeToDispose = false;
        var timesEvaluated = 0;
        var computed = ko.computed(
            function () { timesEvaluated++; return underlyingObservable() + 1; },
            null,
            { disposeWhen: function () { return timeToDispose; } }
        );
        expect(timesEvaluated).toEqual(1);
        expect(computed.getDependenciesCount()).toEqual(1);
        expect(computed.isActive()).toEqual(true);

        timeToDispose = true;
        underlyingObservable(101);
        expect(timesEvaluated).toEqual(1);
        expect(computed.getDependenciesCount()).toEqual(0);
        expect(computed.isActive()).toEqual(false);
    });

    it('Should dispose itself as soon as disposeWhen returns true, as long as it isn\'t waiting for a DOM node to be removed', function() {
        var underlyingObservable = ko.observable(100),
            computed = ko.computed(
                underlyingObservable,
                null,
                { disposeWhen: function() { return true; } }
            );

        expect(underlyingObservable.getSubscriptionsCount()).toEqual(0);
        expect(computed.isActive()).toEqual(false);
    });

    it('Should delay disposal until after disposeWhen returns false if it is waiting for a DOM node to be removed', function() {
        var underlyingObservable = ko.observable(100),
            shouldDispose = true,
            computed = ko.computed(
                underlyingObservable,
                null,
                { disposeWhen: function() { return shouldDispose; }, disposeWhenNodeIsRemoved: true }
            );

        // Even though disposeWhen returns true, it doesn't dispose yet, because it's
        // expecting an initial 'false' result to indicate the DOM node is still in the document
        expect(underlyingObservable.getSubscriptionsCount()).toEqual(1);
        expect(computed.isActive()).toEqual(true);

        // Trigger the false result. Of course it still doesn't dispose yet, because
        // disposeWhen says false.
        shouldDispose = false;
        underlyingObservable(101);
        expect(underlyingObservable.getSubscriptionsCount()).toEqual(1);
        expect(computed.isActive()).toEqual(true);

        // Now trigger a true result. This time it will dispose.
        shouldDispose = true;
        underlyingObservable(102);
        expect(underlyingObservable.getSubscriptionsCount()).toEqual(0);
        expect(computed.isActive()).toEqual(false);
    });

    it('Should describe itself as active if the evaluator has dependencies on its first run', function() {
        var someObservable = ko.observable('initial'),
            computed = ko.computed(function () { return someObservable(); });
        expect(computed.isActive()).toEqual(true);
    });

    it('Should describe itself as inactive if the evaluator has no dependencies on its first run', function() {
        var computed = ko.computed(function () { return 123; });
        expect(computed.isActive()).toEqual(false);
    });

    it('Should describe itself as inactive if subsequent runs of the evaluator result in there being no dependencies', function() {
        var someObservable = ko.observable('initial'),
            shouldHaveDependency = true,
            computed = ko.computed(function () { return shouldHaveDependency && someObservable(); });
        expect(computed.isActive()).toEqual(true);

        // Trigger a refresh
        shouldHaveDependency = false;
        someObservable('modified');
        expect(computed.isActive()).toEqual(false);
    });

    it('Should advertise that instances *can* have values written to them if you supply a "write" callback', function() {
        var instance = ko.computed({
            read: function() {},
            write: function() {}
        });
        expect(ko.isWriteableObservable(instance)).toEqual(true);
        expect(ko.isWritableObservable(instance)).toEqual(true);
    });

    it('Should allow deferring of evaluation (and hence dependency detection)', function () {
        var timesEvaluated = 0;
        var instance = ko.computed({
            read: function () { timesEvaluated++; return 123 },
            deferEvaluation: true
        });
        expect(timesEvaluated).toEqual(0);
        expect(instance()).toEqual(123);
        expect(timesEvaluated).toEqual(1);
    });

    it('Should perform dependency detection when subscribed to when constructed with "deferEvaluation"', function() {
        var data = ko.observable(1),
            computed = ko.computed({ read: data, deferEvaluation: true }),
            result = ko.observable();

        // initially computed has no dependencies since it has not been evaluated
        expect(computed.getDependenciesCount()).toEqual(0);

        // Now subscribe to computed
        computed.subscribe(result);

        // The dependency should now be tracked
        expect(computed.getDependenciesCount()).toEqual(1);

        // But the subscription should not have sent down the initial value
        expect(result()).toEqual(undefined);

        // Updating data should trigger the subscription
        data(42);
        expect(result()).toEqual(42);
    });

    it('Should fire "awake" event when deferred computed is first evaluated', function() {
        var data = ko.observable('A'),
            computed = ko.computed({ read: data, deferEvaluation: true });

        var notifySpy = jasmine.createSpy('notifySpy');
        computed.subscribe(notifySpy, null, 'awake');

        expect(notifySpy).not.toHaveBeenCalled();

        expect(computed()).toEqual('A');
        expect(notifySpy).toHaveBeenCalledWith('A');
        expect(notifySpy.calls.length).toBe(1);

        // Subscribing or updating data shouldn't trigger any more notifications
        notifySpy.reset();
        computed.subscribe(function() {});
        data('B');
        computed();
        expect(notifySpy).not.toHaveBeenCalled();
    });

    it('Should prevent recursive calling of read function', function() {
        var observable = ko.observable(0),
            computed = ko.computed(function() {
                // this both reads and writes to the observable
                // will result in errors like "Maximum call stack size exceeded" (chrome)
                // or "Out of stack space" (IE) or "too much recursion" (Firefox) if recursion
                // isn't prevented
                observable(observable() + 1);
            });
    });

    it('Should not subscribe to observables accessed through change notifications of a computed', function() {
        // See https://github.com/SteveSanderson/knockout/issues/341
        var observableDependent = ko.observable(),
            observableIndependent = ko.observable(),
            computed = ko.computed(function() { return observableDependent() });

        // initially there is only one dependency
        expect(computed.getDependenciesCount()).toEqual(1);

        // create a change subscription that also accesses an observable
        computed.subscribe(function() { observableIndependent() });
        // now trigger evaluation of the computed by updating its dependency
        observableDependent(1);
        // there should still only be one dependency
        expect(computed.getDependenciesCount()).toEqual(1);

        // also test with a beforeChange subscription
        computed.subscribe(function() { observableIndependent() }, null, 'beforeChange');
        observableDependent(2);
        expect(computed.getDependenciesCount()).toEqual(1);
    });

    it('Should not subscribe to observables accessed through change notifications of a modified observable', function() {
        // See https://github.com/SteveSanderson/knockout/issues/341
        var observableDependent = ko.observable(),
            observableIndependent = ko.observable(),
            observableModified = ko.observable(),
            computed = ko.computed(function() { observableModified(observableDependent()) });

        // initially there is only one dependency
        expect(computed.getDependenciesCount()).toEqual(1);

        // create a change subscription that also accesses an observable
        observableModified.subscribe(function() { observableIndependent() });
        // now trigger evaluation of the computed by updating its dependency
        observableDependent(1);
        // there should still only be one dependency
        expect(computed.getDependenciesCount()).toEqual(1);

        // also test with a beforeChange subscription
        observableModified.subscribe(function() { observableIndependent() }, null, 'beforeChange');
        observableDependent(2);
        expect(computed.getDependenciesCount()).toEqual(1);
    });

    it('Should be able to re-evaluate a computed that previously threw an exception', function() {
        var observableSwitch = ko.observable(true), observableValue = ko.observable(1),
            computed = ko.computed(function() {
                if (!observableSwitch()) {
                    throw Error("Error during computed evaluation");
                } else {
                    return observableValue();
                }
            });

        // Initially the computed evaluated sucessfully
        expect(computed()).toEqual(1);

        expect(function () {
            // Update observable to cause computed to throw an exception
            observableSwitch(false);
        }).toThrow("Error during computed evaluation");

        // The value of the computed is now undefined, although currently it keeps the previous value
        expect(computed()).toEqual(1);
        // The computed should not be dependent on the second observable
        expect(computed.getDependenciesCount()).toEqual(1);

        // Updating the second observable shouldn't re-evaluate computed
        observableValue(2);
        expect(computed()).toEqual(1);

        // Update the first observable to cause computed to re-evaluate
        observableSwitch(1);
        expect(computed()).toEqual(2);
    });

    it('Should expose a "notify" extender that can configure a computed to notify on all changes', function() {
        var notifiedValues = [];
        var observable = new ko.observable(1);
        var computed = new ko.computed(function () { return observable(); });
        computed.subscribe(function (value) { notifiedValues.push(value); });

        expect(notifiedValues).toEqual([]);

        // Trigger update without changing value; the computed will not notify the change (default behavior)
        observable.valueHasMutated();
        expect(notifiedValues).toEqual([]);

        // Set the computed to notify always
        computed.extend({ notify: 'always' });
        observable.valueHasMutated();
        expect(notifiedValues).toEqual([1]);
    });

    // Borrowed from haberman/knockout (see knockout/knockout#359)
    it('Should allow long chains without overflowing the stack', function() {
        // maximum with previous code (when running this test only): Chrome 28: 1310, IE 10: 2200; FF 23: 103
        // maximum with changed code: Chrome 28: 2620, +100%, IE 10: 4900, +122%; FF 23: 267, +160%
        // (per #1622 and #1905, max depth reduced to pass tests in older FF)
        var depth = 100;
        var first = ko.observable(0);
        var last = first;
        for (var i = 0; i < depth; i++) {
            (function() {
                var l = last;
                last = ko.computed(function() { return l() + 1; });
            })();
        }
        var all = ko.computed(function() { return last() + first(); });
        first(1);
        expect(all()).toEqual(depth+2);
    });

    it('Should inherit any properties defined on ko.subscribable.fn or ko.computed.fn', function() {
        this.after(function() {
            delete ko.subscribable.fn.customProp;       // Will be able to reach this
            delete ko.subscribable.fn.customFunc;       // Overridden on ko.computed.fn
            delete ko.computed.fn.customFunc;         // Will be able to reach this
        });

        ko.subscribable.fn.customProp = 'subscribable value';
        ko.subscribable.fn.customFunc = function() { throw new Error('Shouldn\'t be reachable') };
        ko.computed.fn.customFunc = function() { return this(); };

        var instance = ko.computed(function() { return 123; });
        expect(instance.customProp).toEqual('subscribable value');
        expect(instance.customFunc()).toEqual(123);
    });

    it('Should have access to functions added to "fn" on existing instances on supported browsers', function () {
        // On unsupported browsers, there's nothing to test
        if (!jasmine.browserSupportsProtoAssignment) {
            return;
        }

        this.after(function() {
            delete ko.subscribable.fn.customFunction1;
            delete ko.computed.fn.customFunction2;
        });

        var computed = ko.computed(function () {});

        var customFunction1 = function () {};
        var customFunction2 = function () {};

        ko.subscribable.fn.customFunction1 = customFunction1;
        ko.computed.fn.customFunction2 = customFunction2;

        expect(computed.customFunction1).toBe(customFunction1);
        expect(computed.customFunction2).toBe(customFunction2);
    });

    it('Should not evaluate (or add dependencies) after it has been disposed', function () {
        var evaluateCount = 0,
            observable = ko.observable(0),
            computed = ko.computed(function () {
                return ++evaluateCount + observable();
            });

        expect(evaluateCount).toEqual(1);
        computed.dispose();

        // This should not cause a new evaluation
        observable(1);
        expect(evaluateCount).toEqual(1);
        expect(computed()).toEqual(1);
        expect(computed.getDependenciesCount()).toEqual(0);
    });

    it('Should not evaluate (or add dependencies) after it has been disposed if created with "deferEvaluation"', function () {
        var evaluateCount = 0,
            observable = ko.observable(0),
            computed = ko.computed({
                read: function () {
                    return ++evaluateCount + observable();
                },
                deferEvaluation: true
            });

        expect(evaluateCount).toEqual(0);
        computed.dispose();

        // This should not cause a new evaluation
        observable(1);
        expect(evaluateCount).toEqual(0);
        expect(computed()).toEqual(undefined);
        expect(computed.getDependenciesCount()).toEqual(0);
    });

    it('Should not add dependencies if disposed during evaluation', function () {
        // This is a bit of a contrived example and likely won't occur in any actual applications.
        // A more likely scenario might involve a binding that removes a node connected to the binding,
        // causing the binding's computed observable to dispose.
        // See https://github.com/knockout/knockout/issues/1041
        var evaluateCount = 0,
            observableToTriggerDisposal = ko.observable(false),
            observableGivingValue = ko.observable(0),
            computed = ko.computed(function() {
                if (observableToTriggerDisposal())
                    computed.dispose();
                return ++evaluateCount + observableGivingValue();
            });

        // Check initial state
        expect(evaluateCount).toEqual(1);
        expect(computed()).toEqual(1);
        expect(computed.getDependenciesCount()).toEqual(2);
        expect(observableGivingValue.getSubscriptionsCount()).toEqual(1);

        // Now cause a disposal during evaluation
        observableToTriggerDisposal(true);
        expect(evaluateCount).toEqual(2);
        expect(computed()).toEqual(2);
        expect(computed.getDependenciesCount()).toEqual(0);
        expect(observableGivingValue.getSubscriptionsCount()).toEqual(0);
    });

    describe('Context', function() {
        it('Should accurately report initial evaluation', function() {
            var observable = ko.observable(1),
                evaluationCount = 0,
                computed = ko.computed(function() {
                    ++evaluationCount;
                    observable();   // for dependency
                    return ko.computedContext.isInitial();
                });

            expect(evaluationCount).toEqual(1);     // single evaluation
            expect(computed()).toEqual(true);       // value of isInitial was true

            observable(2);
            expect(evaluationCount).toEqual(2);     // second evaluation
            expect(computed()).toEqual(false);      // value of isInitial was false

            // value outside of computed is undefined
            expect(ko.computedContext.isInitial()).toBeUndefined();
        });

        it('Should accurately report initial evaluation when deferEvaluation is true', function() {
            var observable = ko.observable(1),
                evaluationCount = 0,
                computed = ko.computed(function() {
                    ++evaluationCount;
                    observable();   // for dependency
                    return ko.computedContext.isInitial();
                }, null, {deferEvaluation:true});

            expect(evaluationCount).toEqual(0);     // no evaluation yet
            expect(computed()).toEqual(true);       // first access causes evaluation; value of isInitial was true
            expect(evaluationCount).toEqual(1);     // single evaluation

            observable(2);
            expect(evaluationCount).toEqual(2);     // second evaluation
            expect(computed()).toEqual(false);      // value of isInitial was false
        });

        it('Should accurately report the number of dependencies', function() {
            var observable1 = ko.observable(1),
                observable2 = ko.observable(1),
                evaluationCount = 0,
                computed = ko.computed(function() {
                    ++evaluationCount;
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
                });

            expect(evaluationCount).toEqual(1);     // single evaluation
            expect(computed.getDependenciesCount()).toEqual(2); // matches value from context

            observable1(2);
            expect(evaluationCount).toEqual(2);     // second evaluation
            expect(computed.getDependenciesCount()).toEqual(2); // matches value from context

            // value outside of computed is undefined
            expect(ko.computedContext.getDependenciesCount()).toBeUndefined();
        });
    });
});
