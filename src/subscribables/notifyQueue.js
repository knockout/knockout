var globalVersionNumber = 0;
var computedQueue = [];
var otherQueue = [];
var queueIsProcessing = false;

function addToQueue(queue, notify) {

    var existing = ko.utils.arrayFirst(queue, function(item) {
            return item.id === notify.id;
        }),
        existingIndex;

    if (existing) {
        existingIndex = ko.utils.arrayIndexOf(queue, existing);
        queue.splice(existingIndex, 1, notify);
    } else {
        queue.unshift(notify);
    }

}

function processComputedQueue() {

    var currentNotify;

    while (currentNotify = computedQueue.shift()) {
        currentNotify.callback();
    }

}

function processQueue() {

    var currentNotify;

    if (queueIsProcessing) {
        return;
    }

    queueIsProcessing = true;

    try {
        while (currentNotify = computedQueue.shift() || otherQueue.shift()) {
            currentNotify.callback();
        }
    } finally {
        queueIsProcessing = false;
    }

}

function sortQueue() {
    computedQueue.sort(function(a, b) { return a.id - b.id; });
    otherQueue.sort(function(a, b) { return a.id - b.id; });
}