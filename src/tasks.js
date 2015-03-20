ko.tasks = (function () {
    var scheduler,
        schedulerHandle,
        taskQueue = [],
        taskQueueLength = 0,
        handleOrigin = 0,
        processingTask;

    scheduler = function (callback) {
        return setTimeout(callback, 0);
    };

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
        schedulerHandle = undefined;
        if (taskQueueLength) {
            processTasks();
        }
    }

    function scheduleTaskProcessing() {
        if (!schedulerHandle) {
            schedulerHandle = ko.tasks['scheduler'](scheduledProcess);
        }
    }

    var tasks = {
        'scheduler': scheduler,     // Allow overriding the scheduler

        schedule: function (func) {
            scheduleTaskProcessing();

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
