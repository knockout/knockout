
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
    
    'Should be able to suppress notifications when writing a value': function () {
      var instance, dependent, numNotifications = 0;
      instance = ko.observable(0);
      dependent = ko.dependentObservable(function () {
        numNotifications++;
        return instance();
      });
      
      // numNotifications must be reset to 0 after the initial calculation
      numNotifications = 0;
      instance(1);
      instance(2);
      instance(3);
      value_of(numNotifications).should_be(3);
      
      numNotifications = 0;
      instance(1, ko.SUPPRESS_NOTIFICATION);
      instance(2, ko.SUPPRESS_NOTIFICATION);
      instance(3, ko.SUPPRESS_NOTIFICATION);
      instance.valueHasMutated();
      value_of(numNotifications).should_be(1);
    }
});