
ko.dependencyDetection = (function () {
    var _frames = [];

    return {
        begin: function (callback) {
            _frames.push({ callback: callback, distinctDependencies:{} });
        },

        end: function () {
            _frames.pop();
        },

        registerDependency: function (subscribable) {
            if (!ko.isSubscribable(subscribable))
                throw new Error("Only subscribable things can act as dependencies");
            if (_frames.length > 0) {
                var topFrame = _frames[_frames.length - 1];
                if (topFrame.distinctDependencies[subscribable.id()])
                    return;
                topFrame.distinctDependencies[subscribable.id()] = subscribable;
                topFrame.callback(subscribable);
            }
        }
    };
})();
