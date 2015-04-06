ko.tasks = (function () {
    var scheduler,
        taskQueue = [],
        taskQueueLength = 0,
        nextHandle = 1;

    if (window['MutationObserver']) {
        // Chrome 27+, Firefox 14+, IE 11+, Opera 15+, Safari 6.1+; borrowed from https://github.com/petkaantonov/bluebird
        scheduler = (function (callback) {
            var div = document.createElement("div");
            new MutationObserver(callback).observe(div, {attributes: true});
            return function () { div.classList.toggle("foo"); };
        })(scheduledProcess);
    } else if (document && "onreadystatechange" in document.createElement("script")) {
        // IE 6-10; borrowed from https://github.com/YuzuJS/setImmediate
        scheduler = function (callback) {
            var script = document.createElement("script");
            script.onreadystatechange = function () {
                script.onreadystatechange = null;
                document.documentElement.removeChild(script);
                script = null;
                callback();
            };
            document.documentElement.appendChild(script);
        };
    } else {
        scheduler = function (callback) {
            setTimeout(callback, 0);
        };
    }

    function processTasks() {
        try {
            // Each mark represents the end of a logical group of tasks and the number of these groups is
            // limited to prevent unchecked recursion.
            var mark = taskQueueLength, countMarks = 0;

            for (var index = 0, task; index < taskQueueLength; ++index) {
                if (taskQueue[index]) {
                    if (index >= mark) {
                        if (++countMarks >= 5000)
                            throw Error("'Too much recursion' after processing " + countMarks + " task groups.");
                        mark = taskQueueLength;
                    }
                    task = taskQueue[index];
                    task();
                }
            }
        } finally {
            // Remove the tasks we've just processed from the queue and reset the timer
            if (++index < taskQueueLength) {
                // There are still tasks to process because a task threw an exception
                taskQueueLength -= index;
                taskQueue = taskQueue.slice(index);
                scheduleTaskProcessing();
            } else {
                // All tasks have been processed
                taskQueueLength = taskQueue.length = 0;
            }
        }
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

            taskQueue[taskQueueLength++] = ko.utils.catchFunctionErrors(func);
            return nextHandle++;
        },

        cancel: function (handle) {
            var index = handle - (nextHandle - taskQueueLength);
            if (index >= 0 && index < taskQueueLength) {
                taskQueue[index] = null;
            }
        },

        // For testing only: return the queue length
        length: function () {
            return taskQueueLength;
        }
    };

    return tasks;
})();

ko.exportSymbol('tasks', ko.tasks);
ko.exportSymbol('tasks.schedule', ko.tasks.schedule);
//ko.exportSymbol('tasks.cancel', ko.tasks.cancel);  "cancel" isn't minified
