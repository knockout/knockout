var globalVersionNumber = 0;
var notifyQueue = [];

function processQueue() {

    var currentNotify;

    while (currentNotify = notifyQueue.shift()) {
        currentNotify();
    }

}