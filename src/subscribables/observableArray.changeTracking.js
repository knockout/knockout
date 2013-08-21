(function () {
    var tracksChangesKey = '_ko_tracksChanges_' + Math.random(),
        cachedDiffKey = '_ko_cachedDiff_' + Math.random();

    ko.observableArray['fn']['getChanges'] = function() {
        throw new Error('Use myArray.trackChanges() to enable change tracking before calling myArray.getChanges()');
    };

    ko.observableArray['fn']['trackChanges'] = function() {
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
            isMutating = true;
            var result = origValueHasMutated.apply(this, arguments);
            previousContents = this.peek().slice(0);

            // Eliminate references to the old, removed items, so they can be GCed
            this[cachedDiffKey] = null;
            isMutating = false;
            return result;
        };

        // You can invoke this from any code responding to a value change for this array
        // (e.g., a .subscribe() callback, or inside a property computed from the array value)
        // to get a sparse diff (TODO: implement sparse)
        this['getChanges'] = function() {
            // Ensure we have a dependency on the observable array
            var currentContents = this();

            // We try to re-use cached diffs. Also it's not meaningful to ask about a diff
            // if the array isn't currently mutating.
            if (isMutating && !this[cachedDiffKey]) {
                this[cachedDiffKey] = ko.utils.compareArrays(previousContents, currentContents, { 'sparse': true });
            }

            return this[cachedDiffKey];
        };

        // Allow chaining
        return this;
    };

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
