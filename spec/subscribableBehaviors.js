
describe('Subscribable', {
    'Should declare that it is subscribable': function () {
        var instance = new ko.subscribable();
        value_of(ko.isSubscribable(instance)).should_be(true);
    },

    'Should be able to notify subscribers': function () {
        var instance = new ko.subscribable();
        var notifiedValue;
        instance.subscribe(function (value) { notifiedValue = value; });
        instance.notifySubscribers(123);
        value_of(notifiedValue).should_be(123);
    },

    'Should be able to unsubscribe': function () {
        var instance = new ko.subscribable();
        var notifiedValue;
        var subscription = instance.subscribe(function (value) { notifiedValue = value; });
        subscription.dispose();
        instance.notifySubscribers(123);
        value_of(notifiedValue).should_be(undefined);
    },

    'Should be able to specify a \'this\' pointer for the callback': function () {
        var model = {
            someProperty: 123,
            myCallback: function (arg) { value_of(arg).should_be('notifiedValue'); value_of(this.someProperty).should_be(123); }
        };
        var instance = new ko.subscribable();
        instance.subscribe(model.myCallback, model);
        instance.notifySubscribers('notifiedValue');
    },
    
    'Should not notify subscribers after unsubscription, even if the unsubscription occurs midway through a notification cycle': function() {
        // This spec represents the unusual case where during notification, subscription1's callback causes subscription2 to be disposed.
        // Since subscription2 was still active at the start of the cycle, it is scheduled to be notified. This spec verifies that
        // even though it is scheduled to be notified, it does not get notified, because the unsubscription just happened.
        var instance = new ko.subscribable();
        var subscription1 = instance.subscribe(function() {
            subscription2.dispose();
        });
        var subscription2wasNotified = false;
        var subscription2 = instance.subscribe(function() {
            subscription2wasNotified = true;
        });
        
        instance.notifySubscribers('ignored');
        value_of(subscription2wasNotified).should_be(false);
    }
});