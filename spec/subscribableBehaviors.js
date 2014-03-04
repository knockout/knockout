
describe('Subscribable', function() {
    it('Should declare that it is subscribable', function () {
        var instance = new ko.subscribable();
        expect(ko.isSubscribable(instance)).toEqual(true);
    });

    it('isSubscribable should return false for undefined', function () {
        expect(ko.isSubscribable(undefined)).toEqual(false);
    });

    it('isSubscribable should return false for null', function () {
        expect(ko.isSubscribable(null)).toEqual(false);
    });

    it('Should be able to notify subscribers', function () {
        var instance = new ko.subscribable();
        var notifiedValue;
        instance.subscribe(function (value) { notifiedValue = value; });
        instance.notifySubscribers(123);
        expect(notifiedValue).toEqual(123);
    });

    it('Should be able to unsubscribe', function () {
        var instance = new ko.subscribable();
        var notifiedValue;
        var subscription = instance.subscribe(function (value) { notifiedValue = value; });
        subscription.dispose();
        instance.notifySubscribers(123);
        expect(notifiedValue).toEqual(undefined);
    });

    it('Should be able to specify a \'this\' pointer for the callback', function () {
        var model = {
            someProperty: 123,
            myCallback: function (arg) { expect(arg).toEqual('notifiedValue'); expect(this.someProperty).toEqual(123); }
        };
        var instance = new ko.subscribable();
        instance.subscribe(model.myCallback, model);
        instance.notifySubscribers('notifiedValue');
    });

    it('Should not notify subscribers after unsubscription, even if the unsubscription occurs midway through a notification cycle', function() {
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
        expect(subscription2wasNotified).toEqual(false);
    });

    it('Should be able to notify subscribers for a specific \'event\'', function () {
        var instance = new ko.subscribable();
        var notifiedValue = undefined;
        instance.subscribe(function (value) { notifiedValue = value; }, null, "myEvent");

        instance.notifySubscribers(123, "unrelatedEvent");
        expect(notifiedValue).toEqual(undefined);

        instance.notifySubscribers(456, "myEvent");
        expect(notifiedValue).toEqual(456);
    });

    it('Should be able to unsubscribe for a specific \'event\'', function () {
        var instance = new ko.subscribable();
        var notifiedValue;
        var subscription = instance.subscribe(function (value) { notifiedValue = value; }, null, "myEvent");
        subscription.dispose();
        instance.notifySubscribers(123, "myEvent");
        expect(notifiedValue).toEqual(undefined);
    });

    it('Should be able to subscribe for a specific \'event\' without being notified for the default event', function () {
        var instance = new ko.subscribable();
        var notifiedValue;
        var subscription = instance.subscribe(function (value) { notifiedValue = value; }, null, "myEvent");
        instance.notifySubscribers(123);
        expect(notifiedValue).toEqual(undefined);
    });

    it('Should be able to retrieve the number of active subscribers', function() {
        var instance = new ko.subscribable();
        instance.subscribe(function() { });
        instance.subscribe(function() { }, null, "someSpecificEvent");
        expect(instance.getSubscriptionsCount()).toEqual(2);
    });

    it('Should be possible to replace notifySubscribers with a custom handler', function() {
        var instance = new ko.subscribable();
        var interceptedNotifications = [];
        instance.subscribe(function() { throw new Error("Should not notify subscribers by default once notifySubscribers is overridden") });
        instance.notifySubscribers = function(newValue, eventName) {
            interceptedNotifications.push({ eventName: eventName, value: newValue });
        };
        instance.notifySubscribers(123, "myEvent");

        expect(interceptedNotifications.length).toEqual(1);
        expect(interceptedNotifications[0].eventName).toEqual("myEvent");
        expect(interceptedNotifications[0].value).toEqual(123);
    });

    it('Should inherit any properties defined on ko.subscribable.fn', function() {
        this.after(function() {
            delete ko.subscribable.fn.customProp;
            delete ko.subscribable.fn.customFunc;
        });

        ko.subscribable.fn.customProp = 'some value';
        ko.subscribable.fn.customFunc = function() { return this; };

        var instance = new ko.subscribable();
        expect(instance.customProp).toEqual('some value');
        expect(instance.customFunc()).toEqual(instance);
    });

    it('Should have access to functions added to "fn" on existing instances on supported browsers', function () {
        // On unsupported browsers, there's nothing to test
        if (!jasmine.browserSupportsProtoAssignment) {
            return;
        }

        this.after(function() {
            delete ko.subscribable.fn.customFunction;
        });

        var subscribable = new ko.subscribable();

        var customFunction = function () {};

        ko.subscribable.fn.customFunction = customFunction;

        expect(subscribable.customFunction).toBe(customFunction);
    });
});
