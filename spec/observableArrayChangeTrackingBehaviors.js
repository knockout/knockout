describe('Observable Array change tracking', function() {

    it('Throws an informative error if you ask for changes before enabling change tracking', function() {
        var myArray = ko.observableArray([1, 2, 3]),
            thrownError;

        myArray.subscribe(function(values) {
            try { myArray.getChanges(); }
            catch(ex) { thrownError = ex; }
        });

        myArray.push(4);
        expect(thrownError.message).toBe('Use myArray.trackChanges() to enable change tracking before calling myArray.getChanges()');
    });

    it('Returns null if you call getChanges outside the context of a mutation', function() {
        var myArray = ko.observableArray([1, 2, 3]);
        myArray.trackChanges();
        expect(myArray.getChanges()).toBe(null);
    });

    it('Returns a changelist if you ask during subscribe callback', function() {
        var myArray = ko.observableArray(['Alpha', 'Beta', 'Gamma']).trackChanges(),
            changelist;

        myArray.subscribe(function(newValues) {
            changelist = myArray.getChanges();
        });

        // Not going to test all possible types of mutation, because we know the diffing
        // logic is all in ko.utils.compareArrays, which is tested separately. Just
        // checking that a simple 'push' comes through OK.
        myArray.push('Delta');
        expect(changelist).toEqual([
            { status: 'added', value: 'Delta', index: 3 }
        ]);
    });

    it('Returns a changelist if you ask during a computed evaluator function', function() {
        var myArray = ko.observableArray(['Alpha', 'Beta', 'Gamma']).trackChanges(),
            changelist;
        ko.computed(function() { changelist = myArray.getChanges(); });

        myArray.splice(1, 1);
        expect(changelist).toEqual([
            { status: 'deleted', value: 'Beta', index: 1 }
        ]);
    });

    it('Reuses cached diff results', function() {
        captureCompareArraysCalls(function(callLog) {
            var myArray = ko.observableArray(['Alpha', 'Beta', 'Gamma']).trackChanges(),
                changelist1,
                changelist2;

            myArray.subscribe(function() { changelist1 = myArray.getChanges(); });
            myArray.subscribe(function() { changelist2 = myArray.getChanges(); });
            myArray(['Gamma']);

            // See that, not only did it invoke compareArrays only once, but the
            // return values from getChanges are the same array instances
            expect(callLog.length).toBe(1);
            expect(changelist1).toEqual([
                { status: 'deleted', value: 'Alpha', index: 0 },
                { status: 'deleted', value: 'Beta', index: 1 }
            ]);
            expect(changelist2).toBe(changelist1);

            // Then when there's a further change, there's a further diff
            myArray(['Delta']);
            expect(callLog.length).toBe(2);
            expect(changelist1).toEqual([
                { status: 'deleted', value: 'Gamma', index: 0 },
                { status: 'added', value: 'Delta', index: 0 }
            ]);
            expect(changelist2).toBe(changelist1);
        });
    });

    it('Skips the diff algorithm when the array mutation is a known operation', function() {
        captureCompareArraysCalls(function(callLog) {
            var myArray = ko.observableArray(['Alpha', 'Beta', 'Gamma']).trackChanges();

            // Push
            testKnownOperation(myArray, 'push', {
                args: ['Delta', 'Epsilon'],
                result: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'],
                changes: [
                    { status: 'added', value: 'Delta', index: 3 },
                    { status: 'added', value: 'Epsilon', index: 4 }
                ]
            });

            // Pop
            testKnownOperation(myArray, 'pop', {
                args: [],
                result: ['Alpha', 'Beta', 'Gamma', 'Delta'],
                changes: [
                    { status: 'deleted', value: 'Epsilon', index: 4 }
                ]
            });

            // Pop empty array
            testKnownOperation(ko.observableArray([]).trackChanges(), 'pop', {
                args: [], result: [], changes: []
            });

            // Shift
            testKnownOperation(myArray, 'shift', {
                args: [],
                result: ['Beta', 'Gamma', 'Delta'],
                changes: [
                    { status: 'deleted', value: 'Alpha', index: 0 }
                ]
            });

            // Shift empty array
            testKnownOperation(ko.observableArray([]).trackChanges(), 'shift', {
                args: [], result: [], changes: []
            });

            // Unshift
            testKnownOperation(myArray, 'unshift', {
                args: ['First', 'Second'],
                result: ['First', 'Second', 'Beta', 'Gamma', 'Delta'],
                changes: [
                    { status: 'added', value: 'First', index: 0 },
                    { status: 'added', value: 'Second', index: 1 }
                ]
            });

            // Splice
            testKnownOperation(myArray, 'splice', {
                args: [2, 3, 'Another', 'YetAnother'],
                result: ['First', 'Second', 'Another', 'YetAnother'],
                changes: [
                    { status: 'added', value: 'Another', index: 2 },
                    { status: 'deleted', value: 'Beta', index: 2 },
                    { status: 'added', value: 'YetAnother', index: 3 },
                    { status: 'deleted', value: 'Gamma', index: 3 },
                    { status: 'deleted', value: 'Delta', index: 4 }
                ]
            });

            // Splice - no 'deletion count' supplied (deletes everything after start index)
            testKnownOperation(myArray, 'splice', {
                args: [2],
                result: ['First', 'Second'],
                changes: [
                    { status: 'deleted', value: 'Another', index: 2 },
                    { status: 'deleted', value: 'YetAnother', index: 3 }
                ]
            });

            // Splice - deletion end index out of bounds
            testKnownOperation(myArray, 'splice', {
                args: [1, 50, 'X', 'Y'],
                result: ['First', 'X', 'Y'],
                changes: [
                    { status: 'added', value: 'X', index: 1 },
                    { status: 'deleted', value: 'Second', index: 1 },
                    { status: 'added', value: 'Y', index: 2 }
                ]
            });

            // Splice - deletion start index out of bounds
            testKnownOperation(myArray, 'splice', {
                args: [25, 3, 'New1', 'New2'],
                result: ['First', 'X', 'Y', 'New1', 'New2'],
                changes: [
                    { status: 'added', value: 'New1', index: 3 },
                    { status: 'added', value: 'New2', index: 4 }
                ]
            });

            // Splice - deletion start index negative (means 'from end of array')
            testKnownOperation(myArray, 'splice', {
                args: [-3, 2, 'Blah', 'Another'],
                result: ['First', 'X', 'Blah', 'Another', 'New2'],
                changes: [
                    { status: 'added', value: 'Blah', index: 2 },
                    { status: 'deleted', value: 'Y', index: 2 },
                    { status: 'added', value: 'Another', index: 3 },
                    { status: 'deleted', value: 'New1', index: 3 }
                ]
            });

            expect(callLog.length).toBe(0); // Never needed to run the diff algorithm
        });
    });

    function testKnownOperation(array, operationName, options) {
        var changeList,
            subscription = array.subscribe(function(newValues) {
                expect(newValues).toEqual(options.result);
                changeList = array.getChanges();
            });
        array[operationName].apply(array, options.args);
        subscription.dispose();

        // The actual ordering isn't fully defined if there's a mixture of
        // additions and deletions at once, so we'll sort by index and then status
        // just so the tests can get consistent results
        changeList.sort(compareChangeListItems);
        expect(changeList).toEqual(options.changes);
    }

    function compareChangeListItems(a, b) {
        if (a.index < b.index) { return -1; }
        if (a.index > b.index) { return 1; }
        return a.status.localeCompare(b.status);
    }

    // There's no public API for intercepting ko.utils.compareArrays, so we'll have to
    // inspect the runtime to work out the private name(s) for it, and intercept them all.
    // Then undo it all afterwards.
    function captureCompareArraysCalls(callback) {
        var origCompareArrays = ko.utils.compareArrays,
            interceptedCompareArrays = function() {
                callLog.push(Array.prototype.slice.call(arguments, 0));
                return origCompareArrays.apply(this, arguments);
            },
            aliases = [],
            callLog = [];

        // Find and intercept all the aliases
        for (var key in ko.utils) {
            if (ko.utils[key] === origCompareArrays) {
                aliases.push(key);
                ko.utils[key] = interceptedCompareArrays;
            }
        }

        try {
            callback(callLog);
        } finally {
            // Undo the interceptors
            for (var i = 0; i < aliases.length; i++) {
                ko.utils[aliases[i]] = origCompareArrays;
            }
        }
    }
});
