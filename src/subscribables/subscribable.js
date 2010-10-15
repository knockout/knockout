/// <reference path="../utils.js" />

ko.subscription = function (callback, disposeCallback) {
    this.callback = callback;
    this.dispose = disposeCallback;
    
    goog.exportProperty(this, 'dispose', this.dispose);
};

ko.subscribable = function () {
    var _subscriptions = [];

    this.subscribe = function (callback, callbackTarget) {
        var boundCallback = callbackTarget ? function () { callback.call(callbackTarget) } : callback;

        var subscription = new ko.subscription(boundCallback, function () {
            ko.utils.arrayRemoveItem(_subscriptions, subscription);
        });
        _subscriptions.push(subscription);
        return subscription;
    };

    this.notifySubscribers = function (valueToNotify) {
        ko.utils.arrayForEach(_subscriptions.slice(0), function (subscription) {
            if (subscription)
                subscription.callback(valueToNotify);
        });
    };

    this.getSubscriptionsCount = function () {
        return _subscriptions.length;
    };
    
    goog.exportProperty(this, 'subscribe', this.subscribe);
    goog.exportProperty(this, 'notifySubscribers', this.notifySubscribers);
    goog.exportProperty(this, 'getSubscriptionsCount', this.getSubscriptionsCount);
}

ko.isSubscribable = function (instance) {
    return typeof instance.subscribe == "function" && typeof instance.notifySubscribers == "function";
};

goog.exportSymbol('ko.subscribable', ko.subscribable);
goog.exportSymbol('ko.isSubscribable', ko.isSubscribable);