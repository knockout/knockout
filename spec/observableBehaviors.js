
describe('Observable', {
    'Should be subscribable': function () {
        var instance = new ko.observable();
        value_of(ko.isSubscribable(instance)).should_be(true);
    },

    'Should advertise that instances are observable': function () {
        var instance = new ko.observable();
        value_of(ko.isObservable(instance)).should_be(true);
    },

    'Should be able to write values to it': function () {
        var instance = new ko.observable();
        instance(123);
    },
    
    'Should be able to write to multiple observable properties on a model object using chaining syntax': function() {
        var model = {
            prop1: new ko.observable(),
            prop2: new ko.observable()
        };
        model.prop1('A').prop2('B');
        
        value_of(model.prop1()).should_be('A');
        value_of(model.prop2()).should_be('B');
    },

    'Should advertise that instances can have values written to them': function () {
        var instance = new ko.observable(function () { });
        value_of(ko.isWriteableObservable(instance)).should_be(true);
    },

    'Should be able to read back most recent value': function () {
        var instance = new ko.observable();
        instance(123);
        instance(234);
        value_of(instance()).should_be(234);
    },

    'Should initially have undefined value': function () {
        var instance = new ko.observable();
        value_of(instance()).should_be(undefined);
    },

    'Should be able to set initial value as constructor param': function () {
        var instance = new ko.observable('Hi!');
        value_of(instance()).should_be('Hi!');
    },

    'Should notify subscribers about each new value': function () {
        var instance = new ko.observable();
        var notifiedValues = [];
        instance.subscribe(function (value) {
            notifiedValues.push(value);
        });

        instance('A');
        instance('B');

        value_of(notifiedValues.length).should_be(2);
        value_of(notifiedValues[0]).should_be('A');
        value_of(notifiedValues[1]).should_be('B');
    },

    'Should be able to tell it that its value has mutated, at which point it notifies subscribers': function () {
        var instance = new ko.observable();
        var notifiedValues = [];
        instance.subscribe(function (value) {
            notifiedValues.push(value.childProperty);
        });

        var someUnderlyingObject = { childProperty : "A" };
        instance(someUnderlyingObject);
        value_of(notifiedValues.length).should_be(1);
        value_of(notifiedValues[0]).should_be("A");

        someUnderlyingObject.childProperty = "B";
        instance.valueHasMutated();
        value_of(notifiedValues.length).should_be(2);
        value_of(notifiedValues[1]).should_be("B");
    },
    
    'Should ignore writes when the new value is primitive and strictly equals the old value': function() {
        var instance = new ko.observable();
        var notifiedValues = [];
        instance.subscribe(notifiedValues.push, notifiedValues);
        
        for (var i = 0; i < 3; i++) {
            instance("A");
            value_of(instance()).should_be("A");
            value_of(notifiedValues).should_be(["A"]);
        }
        
        instance("B");
        value_of(instance()).should_be("B");
        value_of(notifiedValues).should_be(["A", "B"]);      	
    },
    
    'Should ignore writes when both the old and new values are strictly null': function() {
        var instance = new ko.observable(null);
        var notifiedValues = [];
        instance.subscribe(notifiedValues.push, notifiedValues);
        instance(null);
        value_of(notifiedValues).should_be([]);
    },    
    
    'Should ignore writes when both the old and new values are strictly undefined': function() {
        var instance = new ko.observable(undefined);
        var notifiedValues = [];
        instance.subscribe(notifiedValues.push, notifiedValues);
        instance(undefined);
        value_of(notifiedValues).should_be([]);    	
    },      
    
    'Should notify subscribers of a change when an object value is written, even if it is identical to the old value': function() {
        // Because we can't tell whether something further down the object graph has changed, we regard
        // all objects as new values. To override this, set an "equalityComparer" callback    	
        var constantObject = {};
        var instance = new ko.observable(constantObject);
        var notifiedValues = [];
        instance.subscribe(notifiedValues.push, notifiedValues);
        instance(constantObject);
        value_of(notifiedValues).should_be([constantObject]);    	
    },      
    
    'Should notify subscribers of a change even when an identical primitive is written if you\'ve set the equality comparer to null': function() {
        var instance = new ko.observable("A");
        var notifiedValues = [];
        instance.subscribe(notifiedValues.push, notifiedValues);
        
        // No notification by default
        instance("A");
        value_of(notifiedValues).should_be([]);
        
        // But there is a notification if we null out the equality comparer
        instance.equalityComparer = null;
        instance("A");
        value_of(notifiedValues).should_be(["A"]);
    },
    
    'Should ignore writes when the equalityComparer callback states that the values are equal': function() {
        var instance = new ko.observable();
        instance.equalityComparer = function(a, b) { 
            return !(a && b) ? a === b : a.id == b.id 
        };
        
        var notifiedValues = [];
        instance.subscribe(notifiedValues.push, notifiedValues);
        
        instance({ id: 1 });
        value_of(notifiedValues.length).should_be(1);
        
        // Same key - no change
        instance({ id: 1, ignoredProp: 'abc' });
        value_of(notifiedValues.length).should_be(1);
        
        // Different key - change
        instance({ id: 2, ignoredProp: 'abc' });
        value_of(notifiedValues.length).should_be(2);
        
        // Null vs not-null - change
        instance(null);
        value_of(notifiedValues.length).should_be(3);
        
        // Null vs null - no change
        instance(null);
        value_of(notifiedValues.length).should_be(3);
        
        // Null vs undefined - change
        instance(undefined);
        value_of(notifiedValues.length).should_be(4);
        
        // undefined vs object - change
        instance({ id: 1 });
        value_of(notifiedValues.length).should_be(5);
    }    
});