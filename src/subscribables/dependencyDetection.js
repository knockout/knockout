ko.dependencyDetection = (function () {
    var _frames = [];

    return {
        begin: function (callback) {
            _frames.push({ callback: callback, distinctDependencies: {} });
        },

        end: function () {
            _frames.pop();
        },

        registerDependency: function (subscribable) {
            if (!ko.isSubscribable(subscribable))
                throw new Error("Only subscribable things can act as dependencies");
            if (_frames.length > 0) {
                var topFrame = _frames[_frames.length - 1];
                subscribable.key = subscribable.key || ko.utils.generateRandomId();

                if (!topFrame || topFrame.distinctDependencies[subscribable.key])
                    return;
                topFrame.distinctDependencies[subscribable.key] = true;
                topFrame.callback(subscribable);
            }
        },

        ignore: function(callback, callbackTarget, callbackArgs) {
            try {
                _frames.push(null);
                return callback.apply(callbackTarget, callbackArgs || []);
            } finally {
                _frames.pop();
            }
        }
    };
})();