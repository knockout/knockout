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
        expect(changeList).toEqual(options.changes);
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
