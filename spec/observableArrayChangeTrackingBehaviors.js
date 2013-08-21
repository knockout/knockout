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
            { status: 'retained', value: 'Alpha' },
            { status: 'retained', value: 'Beta' },
            { status: 'retained', value: 'Gamma' },
            { status: 'added', value: 'Delta', index: 3 }
        ]);
    });

    it('Returns a changelist if you ask during a computed evaluator function', function() {
        var myArray = ko.observableArray(['Alpha', 'Beta', 'Gamma']).trackChanges(),
            changelist;
        ko.computed(function() { changelist = myArray.getChanges(); });

        myArray.splice(1, 1);
        expect(changelist).toEqual([
            { status: 'retained', value: 'Alpha' },
            { status: 'deleted', value: 'Beta', index: 1 },
            { status: 'retained', value: 'Gamma' }
        ]);
    });

    it('Reuses cached diff results', function() {
        // We can't directly test that it only calls ko.utils.compareArrays once, since
        // there's no publicly exposed way to override that function (at least not in the
        // minified version). As an approximation, verify that getChanges returns the
        // same array instance to callers during the same mutation.

        var myArray = ko.observableArray(['Alpha', 'Beta', 'Gamma']).trackChanges(),
            changelist1,
            changelist2;

        myArray.subscribe(function() { changelist1 = myArray.getChanges(); });
        myArray.subscribe(function() { changelist2 = myArray.getChanges(); });

        myArray(['Gamma']);
        expect(changelist1).toEqual([
            { status: 'deleted', value: 'Alpha', index: 0 },
            { status: 'deleted', value: 'Beta', index: 1 },
            { status: 'retained', value: 'Gamma' }
        ]);
        expect(changelist2).toBe(changelist1);
    });
});
