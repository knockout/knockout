
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

        timeToDispose = true;
        underlyingObservable(101);
        value_of(timesEvaluated).should_be(1);
        value_of(dependent.getDependenciesCount()).should_be(0);
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
     }    
})