
ko.subscription = function (target, callback, disposeCallback) {
    this.target = target;
    this.callback = callback;
    this.disposeCallback = disposeCallback;
    ko.exportProperty(this, 'dispose', this.dispose);
};
ko.subscription.prototype.dispose = function () {
    this.isDisposed = true;
    this.disposeCallback();
};

ko.subscribable = function () {
    this._subscriptions = {};

    ko.utils.extend(this, ko.subscribable['fn']);
    ko.exportProperty(this, 'subscribe', this.subscribe);
    ko.exportProperty(this, 'extend', this.extend);
    ko.exportProperty(this, 'getSubscriptionsCount', this.getSubscriptionsCount);
}

var defaultEvent = "change";

ko.subscribable['fn'] = {
    subscribe: function (callback, callbackTarget, event) {
        event = event || defaultEvent;
        var boundCallback = callbackTarget ? callback.bind(callbackTarget) : callback;

        var subscription = new ko.subscription(this, boundCallback, function () {
            ko.utils.arrayRemoveItem(this._subscriptions[event], subscription);
        }.bind(this));

        if (!this._subscriptions[event])
            this._subscriptions[event] = [];
        this._subscriptions[event].push(subscription);
        return subscription;
    },

    "notifySubscribers": function (valueToNotify, event) {
        var stack = [];
        function pushSubscriptions(subscribable, value, event) {
            event = event || defaultEvent;
            if (!subscribable._subscriptions[event]) return;
            var subscriptions = subscribable._subscriptions[event].slice(0);
            subscriptions.reverse();
            ko.utils.arrayForEach(subscriptions, function(subscription) {
                stack.push([subscription, value]);
            });
        }
        pushSubscriptions(this, valueToNotify, event);
        while (stack.length > 0) {
            var stackEntry = stack.pop();
            var subscription = stackEntry[0],
                value = stackEntry[1];
            // In case a subscription was disposed while delivering other callbacks,
            // check for isDisposed on each subscription before invoking its callback.
            if (subscription && (subscription.isDisposed !== true)) {
                var ret = subscription.callback(value);
                if (ret)
                    ko.utils.arrayForEach(ret, function(arr) { pushSubscriptions(arr[0], arr[1], arr[2]); });
            }
        }
    },

    getSubscriptionsCount: function () {
        var total = 0;
        for (var eventName in this._subscriptions) {
            if (this._subscriptions.hasOwnProperty(eventName))
                total += this._subscriptions[eventName].length;
        }
        return total;
    },

    extend: applyExtenders
};


ko.isSubscribable = function (instance) {
    return typeof instance.subscribe == "function" && typeof instance["notifySubscribers"] == "function";
};

ko.exportSymbol('subscribable', ko.subscribable);
ko.exportSymbol('isSubscribable', ko.isSubscribable);
