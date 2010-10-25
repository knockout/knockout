
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
            myCallback: function () { value_of(this.someProperty).should_be(123); }
        };
        var instance = new ko.subscribable();
        instance.subscribe(model.myCallback, model);
        instance.notifySubscribers('ignored');
    }
});