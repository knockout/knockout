var globalVersionNumber = 0;
var notifyQueue = [];

function processQueue() {

    var currentNotify;

    while (currentNotify = notifyQueue.shift()) {
        currentNotify();
    }

}

function sortQueue() {
    notifyQueue.sort(function(a, b) { return a.priority - b.priority; });
}