(function () {
    var arrayChangeEventName = 'arrayChange',
        tracksChangesKey = '_ko_tracksChanges_' + Math.random(),
        cachedDiffKey = '_ko_cachedDiff_' + Math.random(),
        underlyingSubscribeFunction = ko.subscribable['fn'].subscribe;

    // Intercept "subscribe" calls, and for array change events, ensure change tracking is enabled
    ko.observableArray['fn'].subscribe = ko.observableArray['fn']['subscribe'] = function(callback, callbackTarget, event) {
        if (event === arrayChangeEventName) {
            trackChanges.call(this);
        }

        return underlyingSubscribeFunction.apply(this, arguments);
    };

    function trackChanges() {
        // Calling 'trackChanges' multiple times is the same as calling it once
        if (this[tracksChangesKey]) {
            return;
        }

        this[tracksChangesKey] = true;

        // Each time the array changes value, capture a clone so that on the next
        // change it's possible to produce a diff
        var previousContents = this.peek().slice(0),
            origValueHasMutated = this.valueHasMutated,
            isMutating = false;
        this[cachedDiffKey] = null;
        this['valueHasMutated'] = this.valueHasMutated = function() {
            var result = origValueHasMutated.apply(this, arguments);

            // Compute the diff and issue notifications, but only if someone is listening
            if (this.hasSubscriptionsForEvent(arrayChangeEventName)) {
                var changes = getChanges.call(this, previousContents);
                this['notifySubscribers'](changes, arrayChangeEventName);
            }

            // Eliminate references to the old, removed items, so they can be GCed
            previousContents = this.peek().slice(0);
            this[cachedDiffKey] = null;
            return result;
        };
    }

    function getChanges(previousContents) {
        // We try to re-use cached diffs.
        if (!this[cachedDiffKey]) {
            var currentContents = this.peek();
            this[cachedDiffKey] = ko.utils.compareArrays(previousContents, currentContents, { 'sparse': true });
        }

        return this[cachedDiffKey];
    }

    ko.observableArray.cacheDiffForKnownOperation = function(observableArray, rawArray, operationName, args) {
        var diff,
            arrayLength = rawArray.length;
        switch (operationName) {
            case 'push':
                diff = [];
                for (var index = 0; index < args.length; index++) {
                    diff.push({ status: 'added', value: args[index], index: arrayLength + index });
                }
                break;

            case 'pop':
                diff = arrayLength ? [{ status: 'deleted', value: rawArray[arrayLength - 1], index: arrayLength - 1 }] : [];
                break;

            case 'shift':
                diff = arrayLength ? [{ status: 'deleted', value: rawArray[0], index: 0 }] : [];
                break;

            case 'unshift':
                diff = [];
                for (var index = 0; index < args.length; index++) {
                    diff.push({ status: 'added', value: args[index], index: index });
                }
                break;

            case 'splice':
                diff = [];
                // Negative start index means 'from end of array'. After that we clamp to [0...arrayLength].
                // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
                var startIndex = Math.min(Math.max(0, args[0] < 0 ? arrayLength + args[0] : args[0]), arrayLength),
                    endIndex = args.length === 1 ? arrayLength : Math.min(startIndex + (args[1] || 0), arrayLength);
                for (var index = startIndex; index < endIndex; index++) {
                    diff.push({ status: 'deleted', value: rawArray[index], index: index });
                }
                for (var index = 0; index < args.length - 2; index++) {
                    diff.push({ status: 'added', value: args[index + 2], index: startIndex + index });
                }
                break;
        }

        if (diff) {
            observableArray[cachedDiffKey] = diff;
        }
    };
})();
