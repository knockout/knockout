
ko.dependencyDetection = (function () {
    var _detectedDependencies = [];

    return {
        begin: function () {
            _detectedDependencies.push([]);
        },

        end: function () {
            return _detectedDependencies.pop();
        },

        registerDependency: function (subscribable) {
            if (!ko.isSubscribable(subscribable))
                throw "Only subscribable things can act as dependencies";
            if (_detectedDependencies.length > 0) {
                _detectedDependencies[_detectedDependencies.length - 1].push(subscribable);
            }
        }
    };
})();