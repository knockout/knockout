
ko.subscription = function (callback, disposeCallback) {
    this.callback = callback;
    this.disposeCallback = disposeCallback;    
    ko.exportProperty(this, 'dispose', this.dispose);
};
ko.subscription.prototype.dispose = function () {
    this.isDisposed = true;
    this.disposeCallback();
};

ko.subscribable = function () {
    this._subscriptions = [];

    ko.utils.extend(this, ko.subscribable['fn']);
    ko.exportProperty(this, 'subscribe', this.subscribe);
    ko.exportProperty(this, 'extend', this.extend);
    ko.exportProperty(this, 'notifySubscribers', this.notifySubscribers);
    ko.exportProperty(this, 'getSubscriptionsCount', this.getSubscriptionsCount);
}

ko.subscribable['fn'] = {
    subscribe: function (callback, callbackTarget) {
        var boundCallback = callbackTarget ? callback.bind(callbackTarget) : callback;

        var subscription = new ko.subscription(boundCallback, function () {
            ko.utils.arrayRemoveItem(this._subscriptions, subscription);
        }.bind(this));
        this._subscriptions.push(subscription);
        return subscription;
    },

    notifySubscribers: function (valueToNotify) {
        ko.utils.arrayForEach(this._subscriptions.slice(0), function (subscription) {
            // In case a subscription was disposed during the arrayForEach cycle, check
            // for isDisposed on each subscription before invoking its callback
            if (subscription && (subscription.isDisposed !== true))
                subscription.callback(valueToNotify);
        });
    },

    getSubscriptionsCount: function () {
        return this._subscriptions.length;
    },
    
    extend: applyExtenders
};


ko.isSubscribable = function (instance) {
    return typeof instance.subscribe == "function" && typeof instance.notifySubscribers == "function";
};

ko.exportSymbol('ko.subscribable', ko.subscribable);
ko.exportSymbol('ko.isSubscribable', ko.isSubscribable);
