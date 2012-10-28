
describe('Dependent Observable', {
    'Should be subscribable': function () {
        var instance = new ko.dependentObservable(function () { });
        value_of(ko.isSubscribable(instance)).should_be(true);
    },

    'Should advertise that instances are observable': function () {
        var instance = new ko.dependentObservable(function () { });
        value_of(ko.isObservable(instance)).should_be(true);
    },

    'Should advertise that instances are computed': function () {
        var instance = new ko.dependentObservable(function () { });
        value_of(ko.isComputed(instance)).should_be(true);
    },

    'Should advertise that instances cannot have values written to them': function () {
        var instance = new ko.dependentObservable(function () { });
        value_of(ko.isWriteableObservable(instance)).should_be(false);
    },

    'Should require an evaluator function as constructor param': function () {
        var threw = false;
        try { var instance = new ko.dependentObservable(); }
        catch (ex) { threw = true; }
        value_of(threw).should_be(true);
    },

    'Should be able to read the current value of the evaluator function': function () {
        var instance = new ko.dependentObservable(function () { return 123; });
        value_of(instance()).should_be(123);
    },

    'Should not be able to write a value to it if there is no "write" callback': function () {
        var instance = new ko.dependentObservable(function () { return 123; });

        var threw = false;
        try { instance(456); }
        catch (ex) { threw = true; }

        value_of(instance()).should_be(123);
        value_of(threw).should_be(true);
    },

    'Should invoke the "write" callback, where present, if you attempt to write a value to it': function() {
        var invokedWriteWithValue, invokedWriteWithThis;
        var instance = new ko.dependentObservable({
            read: function() {},
            write: function(value) { invokedWriteWithValue = value; invokedWriteWithThis = this; }
        });

        var someContainer = { depObs: instance };
        someContainer.depObs("some value");
        value_of(invokedWriteWithValue).should_be("some value");
        value_of(invokedWriteWithThis).should_be(window); // Since no owner was specified
    },

    'Should be able to write to multiple computed properties on a model object using chaining syntax': function() {
        var model = {
            prop1: ko.computed({
                read: function(){},
                write: function(value) {
                    value_of(value).should_be("prop1");
                } }),
            prop2: ko.computed({
                read: function(){},
                write: function(value) {
                    value_of(value).should_be("prop2");
                } })
        };
        model.prop1('prop1').prop2('prop2');
    },

    'Should use options.owner as "this" when invoking the "write" callback, and can pass multiple parameters': function() {
        var invokedWriteWithArgs, invokedWriteWithThis;
        var someOwner = {};
        var instance = new ko.dependentObservable({
            read: function() {},
            write: function() { invokedWriteWithArgs = Array.prototype.slice.call(arguments, 0); invokedWriteWithThis = this; },
            owner: someOwner
        });

        instance("first", 2, ["third1", "third2"]);
        value_of(invokedWriteWithArgs.length).should_be(3);
        value_of(invokedWriteWithArgs[0]).should_be("first");
        value_of(invokedWriteWithArgs[1]).should_be(2);
        value_of(invokedWriteWithArgs[2]).should_be(["third1", "third2"]);
        value_of(invokedWriteWithThis).should_be(someOwner);
    },

    'Should use the second arg (evaluatorFunctionTarget) for "this" when calling read/write if no options.owner was given': function() {
        var expectedThis = {}, actualReadThis, actualWriteThis;
        var instance = new ko.dependentObservable({
            read: function() { actualReadThis = this },
            write: function() { actualWriteThis = this }
        }, expectedThis);

        instance("force invocation of write");

        value_of(actualReadThis).should_be(expectedThis);
        value_of(actualWriteThis).should_be(expectedThis);
    },

    'Should be able to pass evaluator function using "options" parameter called "read"': function() {
        var instance = new ko.dependentObservable({
            read: function () { return 123; }
        });
        value_of(instance()).should_be(123);
    },

    'Should cache result of evaluator function and not call it again until dependencies change': function () {
        var timesEvaluated = 0;
        var instance = new ko.dependentObservable(function () { timesEvaluated++; return 123; });
        value_of(instance()).should_be(123);
        value_of(instance()).should_be(123);
        value_of(timesEvaluated).should_be(1);
    },

    'Should automatically update value when a dependency changes': function () {
        var observable = new ko.observable(1);
        var depedentObservable = new ko.dependentObservable(function () { return observable() + 1; });
        value_of(depedentObservable()).should_be(2);

        observable(50);
        value_of(depedentObservable()).should_be(51);
    },

    'Should be able to use \'peek\' on an observable to avoid a dependency': function() {
        var observable = ko.observable(1),
            computed = ko.dependentObservable(function () { return observable.peek() + 1; });
        value_of(computed()).should_be(2);

        observable(50);
        value_of(computed()).should_be(2);    // value wasn't changed
    },

    'Should unsubscribe from previous dependencies each time a dependency changes': function () {
        var observableA = new ko.observable("A");
        var observableB = new ko.observable("B");
        var observableToUse = "A";
        var timesEvaluated = 0;
        var depedentObservable = new ko.dependentObservable(function () {
            timesEvaluated++;
            return observableToUse == "A" ? observableA() : observableB();
        });

        value_of(depedentObservable()).should_be("A");
        value_of(timesEvaluated).should_be(1);

        // Changing an unrelated observable doesn't trigger evaluation
        observableB("B2");
        value_of(timesEvaluated).should_be(1);

        // Switch to other observable
        observableToUse = "B";
        observableA("A2");
        value_of(depedentObservable()).should_be("B2");
        value_of(timesEvaluated).should_be(2);

        // Now changing the first observable doesn't trigger evaluation
        observableA("A3");
        value_of(timesEvaluated).should_be(2);
    },

    'Should notify subscribers of changes': function () {
        var notifiedValue;
        var observable = new ko.observable(1);
        var depedentObservable = new ko.dependentObservable(function () { return observable() + 1; });
        depedentObservable.subscribe(function (value) { notifiedValue = value; });

        value_of(notifiedValue).should_be(undefined);
        observable(2);
        value_of(notifiedValue).should_be(3);
    },

    'Should notify "beforeChange" subscribers before changes': function () {
        var notifiedValue;
        var observable = new ko.observable(1);
        var depedentObservable = new ko.dependentObservable(function () { return observable() + 1; });
        depedentObservable.subscribe(function (value) { notifiedValue = value; }, null, "beforeChange");

        value_of(notifiedValue).should_be(undefined);
        observable(2);
        value_of(notifiedValue).should_be(2);
        value_of(depedentObservable()).should_be(3);
    },

    'Should only update once when each dependency changes, even if evaluation calls the dependency multiple times': function () {
        var notifiedValues = [];
        var observable = new ko.observable();
        var depedentObservable = new ko.dependentObservable(function () { return observable() * observable(); });
        depedentObservable.subscribe(function (value) { notifiedValues.push(value); });
        observable(2);
        value_of(notifiedValues.length).should_be(1);
        value_of(notifiedValues[0]).should_be(4);
    },

    'Should be able to chain dependentObservables': function () {
        var underlyingObservable = new ko.observable(1);
        var dependent1 = new ko.dependentObservable(function () { return underlyingObservable() + 1; });
        var dependent2 = new ko.dependentObservable(function () { return dependent1() + 1; });
        value_of(dependent2()).should_be(3);

        underlyingObservable(11);
        value_of(dependent2()).should_be(13);
    },

    'Should be able to use \'peek\' on a computed observable to avoid a dependency': function () {
        var underlyingObservable = new ko.observable(1);
        var computed1 = new ko.dependentObservable(function () { return underlyingObservable() + 1; });
        var computed2 = new ko.dependentObservable(function () { return computed1.peek() + 1; });
        value_of(computed2()).should_be(3);
        value_of(computed2.isActive()).should_be(false);

        underlyingObservable(11);
        value_of(computed2()).should_be(3);    // value wasn't changed
    },

    'Should accept "owner" parameter to define the object on which the evaluator function should be called': function () {
        var model = new (function () {
            this.greeting = "hello";
            this.fullMessageWithoutOwner = new ko.dependentObservable(function () { return this.greeting + " world" });
            this.fullMessageWithOwner = new ko.dependentObservable(function () { return this.greeting + " world" }, this);
        })();
        value_of(model.fullMessageWithoutOwner()).should_be("undefined world");
        value_of(model.fullMessageWithOwner()).should_be("hello world");
    },

    'Should dispose and not call its evaluator function when the disposeWhen function returns true': function () {
        var underlyingObservable = new ko.observable(100);
        var timeToDispose = false;
        var timesEvaluated = 0;
        var dependent = new ko.dependentObservable(
            function () { timesEvaluated++; return underlyingObservable() + 1; },
            null,
            { disposeWhen: function () { return timeToDispose; } }
        );
        value_of(timesEvaluated).should_be(1);
        value_of(dependent.getDependenciesCount()).should_be(1);
        value_of(dependent.isActive()).should_be(true);

        timeToDispose = true;
        underlyingObservable(101);
        value_of(timesEvaluated).should_be(1);
        value_of(dependent.getDependenciesCount()).should_be(0);
        value_of(dependent.isActive()).should_be(false);
    },

    'Should describe itself as active if the evaluator has dependencies on its first run': function() {
        var someObservable = ko.observable('initial'),
            dependentObservable = new ko.dependentObservable(function () { return someObservable(); });
        value_of(dependentObservable.isActive()).should_be(true);
    },

    'Should describe itself as inactive if the evaluator has no dependencies on its first run': function() {
        var dependentObservable = new ko.dependentObservable(function () { return 123; });
        value_of(dependentObservable.isActive()).should_be(false);
    },

    'Should describe itself as inactive if subsequent runs of the evaluator result in there being no dependencies': function() {
        var someObservable = ko.observable('initial'),
            shouldHaveDependency = true,
            dependentObservable = new ko.dependentObservable(function () { return shouldHaveDependency && someObservable(); });
        value_of(dependentObservable.isActive()).should_be(true);

        // Trigger a refresh
        shouldHaveDependency = false;
        someObservable('modified');
        value_of(dependentObservable.isActive()).should_be(false);
    },

    'Should register DOM node disposal callback only if active after the initial evaluation': function() {
        // Set up an active one
        var nodeForActive = document.createElement('DIV'),
            observable = ko.observable('initial'),
            activeDependentObservable = ko.dependentObservable({ read: function() { return observable(); }, disposeWhenNodeIsRemoved: nodeForActive });
        var nodeForInactive = document.createElement('DIV')
            inactiveDependentObservable = ko.dependentObservable({ read: function() { return 123; }, disposeWhenNodeIsRemoved: nodeForInactive });

        value_of(activeDependentObservable.isActive()).should_be(true);
        value_of(inactiveDependentObservable.isActive()).should_be(false);

        // Infer existence of disposal callbacks from presence/absence of DOM data. This is really just an implementation detail,
        // and so it's unusual to rely on it in a spec. However, the presence/absence of the callback isn't exposed in any other way,
        // and if the implementation ever changes, this spec should automatically fail because we're checking for both the positive
        // and negative cases.
        value_of(ko.utils.domData.clear(nodeForActive)).should_be(true);    // There was a callback
        value_of(ko.utils.domData.clear(nodeForInactive)).should_be(false); // There was no callback
    },

    'Should advertise that instances *can* have values written to them if you supply a "write" callback': function() {
        var instance = new ko.dependentObservable({
            read: function() {},
            write: function() {}
        });
        value_of(ko.isWriteableObservable(instance)).should_be(true);
    },

    'Should allow deferring of evaluation (and hence dependency detection)': function () {
        var timesEvaluated = 0;
        var instance = new ko.dependentObservable({
            read: function () { timesEvaluated++; return 123 },
            deferEvaluation: true
        });
        value_of(timesEvaluated).should_be(0);
        value_of(instance()).should_be(123);
        value_of(timesEvaluated).should_be(1);
    },

    'Should prevent recursive calling of read function': function() {
        var observable = ko.observable(0),
            computed = ko.dependentObservable(function() {
                // this both reads and writes to the observable
                // will result in errors like "Maximum call stack size exceeded" (chrome)
                // or "Out of stack space" (IE) or "too much recursion" (Firefox) if recursion
                // isn't prevented
                observable(observable() + 1);
            });
    },

    'Should not subscribe to observables accessed through change notifications of a computed': function() {
        // See https://github.com/SteveSanderson/knockout/issues/341
        var observableDependent = ko.observable(),
            observableIndependent = ko.observable(),
            computed = ko.computed(function() { return observableDependent() });

        // initially there is only one dependency
        value_of(computed.getDependenciesCount()).should_be(1);

        // create a change subscription that also accesses an observable
        computed.subscribe(function() { observableIndependent() });
        // now trigger evaluation of the computed by updating its dependency
        observableDependent(1);
        // there should still only be one dependency
        value_of(computed.getDependenciesCount()).should_be(1);

        // also test with a beforeChange subscription
        computed.subscribe(function() { observableIndependent() }, null, 'beforeChange');
        observableDependent(2);
        value_of(computed.getDependenciesCount()).should_be(1);
    },

    'Should not subscribe to observables accessed through change notifications of a modified observable': function() {
        // See https://github.com/SteveSanderson/knockout/issues/341
        var observableDependent = ko.observable(),
            observableIndependent = ko.observable(),
            observableModified = ko.observable(),
            computed = ko.computed(function() { observableModified(observableDependent()) });

        // initially there is only one dependency
        value_of(computed.getDependenciesCount()).should_be(1);

        // create a change subscription that also accesses an observable
        observableModified.subscribe(function() { observableIndependent() });
        // now trigger evaluation of the computed by updating its dependency
        observableDependent(1);
        // there should still only be one dependency
        value_of(computed.getDependenciesCount()).should_be(1);

        // also test with a beforeChange subscription
        observableModified.subscribe(function() { observableIndependent() }, null, 'beforeChange');
        observableDependent(2);
        value_of(computed.getDependenciesCount()).should_be(1);
    },

    'Should not subscribe to observables accessed through change notifications of an accessed computed': function() {
        // See https://github.com/SteveSanderson/knockout/issues/341
        var observableDependent = ko.observable(),
            observableIndependent = ko.observable(),
            computedInner = ko.computed({read: function() { return observableDependent() }, deferEvaluation: true}),
            computedOuter = ko.computed({read: function() { return computedInner() }, deferEvaluation: true});

        // initially there are no dependencies (because they haven't been evaluated)
        value_of(computedInner.getDependenciesCount()).should_be(0);
        value_of(computedOuter.getDependenciesCount()).should_be(0);

        // create a change subscription on the inner computed that also accesses an observable
        computedInner.subscribe(function() { observableIndependent() });
        // now trigger evaluation of both computeds by accessing the outer one
        computedOuter();
        // there should be only one dependency for each
        value_of(computedInner.getDependenciesCount()).should_be(1);
        value_of(computedOuter.getDependenciesCount()).should_be(1);
    }
})
