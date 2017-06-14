ko.delaySync = (function () {
    var isPaused = false;
    var queue = [];

    return {
        pause: function () {
            isPaused = true;
        },
        resume: function () {
            isPaused = false;
            for (var i = 0; i < queue.length; i++) {
                queue[i]();
            }
            queue = [];
        },
        run: function(action) {
            if (!isPaused) {
                action();
            } else {
                queue.push(action);
            }
        }
    };
})();
ko.exportSymbol('delaySync', ko.delaySync);
ko.exportSymbol('delaySync.pause', ko.delaySync.pause);
ko.exportSymbol('delaySync.resume', ko.delaySync.resume);
ko.exportSymbol('delaySync.run', ko.delaySync.run);
