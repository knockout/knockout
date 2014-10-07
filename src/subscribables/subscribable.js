
ko.subscription = function (target, callback, disposeCallback, options) {
    this.target = target;
    this.callback = callback;
    this.disposeCallback = disposeCallback;
    this.isDisposed = false;
    this.options = options;
    ko.exportProperty(this, 'dispose', this.dispose);
    ko.exportProperty(this, 'options', this.options);
};
ko.subscription.prototype.dispose = function () {
    this.isDisposed = true;
    this.disposeCallback();
};

ko.subscribable = function () {
    ko.utils.setPrototypeOfOrExtend(this, ko.subscribable['fn']);
    this._subscriptions = {};
}

var defaultEvent = "change";

var ko_subscribable_fn = {
    subscribe: function (callback, callbackTarget, options) {
        var self = this;

        if (typeof options === "string") {
            options = { event: options };
        }
        else if (!options) {
            options = { event: defaultEvent }
        } else if (!options.event) {
            options.event = defaultEvent;
        }

        if (options.event !== "change" && options["suspectorMode"]) {
            throw new Error("Suspector mode is currently only supported for the 'change' event");
        }

        var event = options.event;
        var boundCallback = callbackTarget ? callback.bind(callbackTarget) : callback;

        var subscription = new ko.subscription(self, boundCallback, function () {
            ko.utils.arrayRemoveItem(self._subscriptions[event], subscription);
            if (self.afterSubscriptionRemove)
                self.afterSubscriptionRemove(event, subscription.options);
        }, options);

        if (self.beforeSubscriptionAdd)
            self.beforeSubscriptionAdd(event, subscription.options);

        if (!self._subscriptions[event])
            self._subscriptions[event] = [];
        self._subscriptions[event].push(subscription);

        return subscription;
    },

    "notifySubscribers": function (valueToNotify, event, spectatorsOnly) {
        event = event || defaultEvent;
        if (this.hasSubscriptionsForEvent(event, true)) {
            try {
                ko.dependencyDetection.begin(); // Begin suppressing dependency detection (by setting the top frame to undefined)
                for (var a = this._subscriptions[event].slice(0), i = 0, subscription; subscription = a[i]; ++i) {
                    // In case a subscription was disposed during the arrayForEach cycle, check
                    // for isDisposed on each subscription before invoking its callback
                    if (!subscription.isDisposed && (!spectatorsOnly || subscription.options['spectatorMode'])) {
                        subscription.callback(valueToNotify);
                    }
                }
            } finally {
                ko.dependencyDetection.end(); // End suppressing dependency detection
            }
        }
    },

    limit: function(limitFunction) {
        var self = this, selfIsObservable = ko.isObservable(self),
            isPending, previousValue, pendingValue, beforeChange = 'beforeChange';

        if (!self._origNotifySubscribers) {
            self._origNotifySubscribers = self["notifySubscribers"];
            self["notifySubscribers"] = function(value, event) {
                if (!event || event === defaultEvent) {
                    self._rateLimitedChange(value);
                } else if (event === beforeChange) {
                    self._rateLimitedBeforeChange(value);
                } else {
                    self._origNotifySubscribers(value, event);
                }
            };
        }

        var finish = limitFunction(function() {
            // If an observable provided a reference to itself, access it to get the latest value.
            // This allows computed observables to delay calculating their value until needed.
            if (selfIsObservable && pendingValue === self) {
                pendingValue = self();
            }
            isPending = false;
            if (self.isDifferent(previousValue, pendingValue)) {
                self._origNotifySubscribers(previousValue = pendingValue);
            }
        });

        self._rateLimitedChange = function(value) {
            isPending = true;
            pendingValue = value;
            finish();
        };
        self._rateLimitedBeforeChange = function(value) {
            if (!isPending) {
                previousValue = value;
                self._origNotifySubscribers(value, beforeChange);
            }
        };
    },

    hasSubscriptionsForEvent: function (event, includeSpectators) {
        var array = this._subscriptions[event];

        if (array) {
            if (includeSpectators) {
                return array.length ? true : false;
            }
            else {
                for (var i = 0, j = array.length; i < j; i++) {
                    if (!array[i].options['spectatorMode']) {
                        return true;
                    }
                }
            }
        }
        return false;
    },

    getSubscriptionsCount: function (includeSpectators) {
        var total = 0;
        ko.utils.objectForEach(this._subscriptions, function(eventName, subscriptions) {
            if (includeSpectators) {
                total += subscriptions.length;
            }
            else {
                for (var i = 0, j = subscriptions.length; i < j; i++) {
                    if (!subscriptions[i].options['spectatorMode']) {
                        total++;
                    }
                }
            }
        });
        return total;
    },

    isDifferent: function(oldValue, newValue) {
        return !this['equalityComparer'] || !this['equalityComparer'](oldValue, newValue);
    },

    extend: applyExtenders
};

ko.exportProperty(ko_subscribable_fn, 'subscribe', ko_subscribable_fn.subscribe);
ko.exportProperty(ko_subscribable_fn, 'extend', ko_subscribable_fn.extend);
ko.exportProperty(ko_subscribable_fn, 'getSubscriptionsCount', ko_subscribable_fn.getSubscriptionsCount);

// For browsers that support proto assignment, we overwrite the prototype of each
// observable instance. Since observables are functions, we need Function.prototype
// to still be in the prototype chain.
if (ko.utils.canSetPrototype) {
    ko.utils.setPrototypeOf(ko_subscribable_fn, Function.prototype);
}

ko.subscribable['fn'] = ko_subscribable_fn;


ko.isSubscribable = function (instance) {
    return instance != null && typeof instance.subscribe == "function" && typeof instance["notifySubscribers"] == "function";
};

ko.exportSymbol('subscribable', ko.subscribable);
ko.exportSymbol('isSubscribable', ko.isSubscribable);
