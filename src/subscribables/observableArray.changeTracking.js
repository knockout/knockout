(function () {
    var tracksChangesKey = '_ko_tracksChanges_' + Math.random();

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
        this._cachedDiff = null;
        this['valueHasMutated'] = this.valueHasMutated = function() {
            isMutating = true;
            var result = origValueHasMutated.apply(this, arguments);
            previousContents = this.peek().slice(0);

            // Eliminate references to the old, removed items, so they can be GCed
            this._cachedDiff = null;
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
            if (isMutating && !this._cachedDiff) {
                this._cachedDiff = ko.utils.compareArrays(previousContents, currentContents);
            }

            return this._cachedDiff;
        };

        // Allow chaining
        return this;
    };
})();
