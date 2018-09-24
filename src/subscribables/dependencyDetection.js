
ko.computedContext = ko.dependencyDetection = (function () {
    var outerFrames = [],
        currentFrame,
        lastId = 0;

    var sortedBindingsToUpdate = [];

    // Return a unique ID that can be assigned to an observable for dependency tracking.
    // Theoretically, you could eventually overflow the number storage size, resulting
    // in duplicate IDs. But in JavaScript, the largest exact integral value is 2^53
    // or 9,007,199,254,740,992. If you created 1,000,000 IDs per second, it would
    // take over 285 years to reach that number.
    // Reference http://blog.vjeux.com/2010/javascript/javascript-max_int-number-limits.html
    function getId() {
        return ++lastId;
    }

    function begin(options) {
        outerFrames.push(currentFrame);
        currentFrame = options;
    }

    function end() {
        currentFrame = outerFrames.pop();
    }

    return {
        begin: begin,

        end: end,

        registerDependency: function (subscribable) {
            if (currentFrame) {
                if (!ko.isSubscribable(subscribable))
                    throw new Error("Only subscribable things can act as dependencies");
                currentFrame.callback.call(currentFrame.callbackTarget, subscribable, subscribable._id || (subscribable._id = getId()));
            }
        },

        ignore: function (callback, callbackTarget, callbackArgs) {
            try {
                begin();
                return callback.apply(callbackTarget, callbackArgs || []);
            } finally {
                end();
            }
        },

        getDependenciesCount: function () {
            if (currentFrame)
                return currentFrame.computed.getDependenciesCount();
        },

        getDependencies: function () {
            if (currentFrame)
                return currentFrame.computed.getDependencies();
        },

        isInitial: function() {
            if (currentFrame)
                return currentFrame.isInitial;
        },


        // When using deferred updates, we want to make sure that all bindings are updated in a more-or-less
        // top-down order. The following functions are used to keep track of which bindings are scheduled to
        // update, and to re-order them if they are scheduled out of order.

        registerBindingComputedOrder: function (computed) {
            // ids are assigned sequentially, so we can use them to establish an update order
            computed._id = getId();
        },

        deferredBindingUpdateScheduled: function (computed) {
            var myId = computed._id,
                i = sortedBindingsToUpdate.length;

            if (!i) {
window.scheduled.initial++;
                // Schedule a cleanup task
                ko.tasks.finally(function () {
                    sortedBindingsToUpdate.length = 0;
                });
                sortedBindingsToUpdate[0] = computed;
            } else if (sortedBindingsToUpdate[i-1]._id < myId) {
window.scheduled.ordered++;
                // If bindings are scheduled in order, optimize the operation
                sortedBindingsToUpdate[i] = computed;
            } else {
window.scheduled.unordered++;
                // Search the list from the end to find the insertion point
                while (--i >= 0 && sortedBindingsToUpdate[i]._id > myId) { }

                // Add this computed to the list (unless it's already there)
                if (i < 0 || sortedBindingsToUpdate[i] !== computed) {
                    sortedBindingsToUpdate.splice(++i, 0, computed);
                }

window.scheduled.rescheduled += (sortedBindingsToUpdate.length - i - 1);
                // Reschedule all computeds after us in the list
                while (++i < sortedBindingsToUpdate.length) {
                    sortedBindingsToUpdate[i]._limitChange(sortedBindingsToUpdate[i]);
                }
            }
        },

        deferredBindingUpdated: function (computed) {
            var myId = computed._id;

            while (sortedBindingsToUpdate[0] && sortedBindingsToUpdate[0]._id <= myId) {
                sortedBindingsToUpdate.shift();
            }
        }
    };
})();

window.scheduled = { initial: 0, ordered: 0, unordered: 0, rescheduled: 0 };

ko.exportSymbol('computedContext', ko.computedContext);
ko.exportSymbol('computedContext.getDependenciesCount', ko.computedContext.getDependenciesCount);
ko.exportSymbol('computedContext.getDependencies', ko.computedContext.getDependencies);
ko.exportSymbol('computedContext.isInitial', ko.computedContext.isInitial);
ko.exportSymbol('computedContext.registerDependency', ko.computedContext.registerDependency);

ko.exportSymbol('ignoreDependencies', ko.ignoreDependencies = ko.dependencyDetection.ignore);
