ko.when = function(predicate, callback, context) {
    function kowhen (resolve) {
        var observable = ko.pureComputed(predicate, context).extend({notify:'always'});
        var subscription = observable.subscribe(function(value) {
            if (value) {
                subscription.dispose();
                resolve(value);
            }
        });
        // In case the initial value is true, process it right away
        observable['notifySubscribers'](observable.peek());

        return subscription;
    }
    if (typeof Promise === "function" && !callback) {
        return new Promise(kowhen);
    } else {
        return kowhen(callback.bind(context));
    }
};

ko.exportSymbol('when', ko.when);
