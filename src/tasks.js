ko.tasks = (function () {
    var scheduler,
        taskQueue = [],
        taskQueueLength = 0,
        handleOrigin = 0,
        processingTask;

    if (typeof MutationObserver !== "undefined") {
        scheduler = (function (callback) {
            var div = document.createElement("div");
            new MutationObserver(callback).observe(div, {attributes: true});
            return function () { div.classList.toggle("foo"); };
        })(scheduledProcess);
    } else {
        scheduler = function (callback) {
            setTimeout(callback, 0);
        };
    }

    function processTasks() {
        var countProcessed = 0;

        // Each mark represents the end of a logical group of tasks and the number of these groups is
        // limited to prevent unchecked recursion.
        var mark = taskQueueLength, countMarks = 0;

        try {
            for (var index = 0; index < taskQueueLength; ++index) {
                if (taskQueue[index]) {
                    if (index >= mark) {
                        if (++countMarks >= 5000)
                            throw Error("'Too much recursion' after processing " + countProcessed + " tasks.");
                        mark = taskQueueLength;
                    }
                    processingTask = taskQueue[index];
                    processingTask();
                    ++countProcessed;
                }
            }
        } finally {
            processingTask = undefined;

            // Remove the tasks we've just processed from the queue and reset the timer
            if (++index < taskQueueLength) {
                // There are still tasks to process because a task threw an exception
                handleOrigin += index;
                taskQueueLength -= index;
                taskQueue = taskQueue.slice(index);
                scheduleTaskProcessing();
            } else {
                // All tasks have been processed
                handleOrigin += taskQueueLength;
                taskQueueLength = taskQueue.length = 0;
            }
        }

        return countProcessed;
    }

    function scheduledProcess() {
        if (taskQueueLength) {
            processTasks();
        }
    }

    function scheduleTaskProcessing() {
        ko.tasks['scheduler'](scheduledProcess);
    }

    var tasks = {
        'scheduler': scheduler,     // Allow overriding the scheduler

        schedule: function (func) {
            if (!taskQueueLength) {
                scheduleTaskProcessing();
            }

            taskQueue[taskQueueLength++] = func;
            return taskQueueLength + handleOrigin;
        },

        cancel: function (handle) {
            var index = handle - handleOrigin - 1;
            if (index >= 0 && index < taskQueueLength) {
                taskQueue[index] = null;
            }
        },

        runTasks: function processAllTasks () {
            // If we're already in the middle of processing tasks, then do nothing
            if (!processingTask) {
                return processTasks();
            }
        }
    };

    return tasks;
})();

ko.exportSymbol('tasks', ko.tasks);
ko.exportSymbol('tasks.schedule', ko.tasks.schedule);
ko.exportSymbol('tasks.cancel', ko.tasks.cancel);
ko.exportSymbol('tasks.runTasks', ko.tasks.runTasks);
