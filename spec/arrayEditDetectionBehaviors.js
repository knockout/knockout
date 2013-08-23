
describe('Compare Arrays', function() {
    it('Should recognize when two arrays have the same contents', function () {
        var subject = ["A", {}, function () { } ];
        var compareResult = ko.utils.compareArrays(subject, subject.slice(0));

        expect(compareResult.length).toEqual(subject.length);
        for (var i = 0; i < subject.length; i++) {
            expect(compareResult[i].status).toEqual("retained");
            expect(compareResult[i].value).toEqual(subject[i]);
        }
    });

    it('Should recognize added items', function () {
        var oldArray = ["A", "B"];
        var newArray = ["A", "A2", "A3", "B", "B2"];
        var compareResult = ko.utils.compareArrays(oldArray, newArray);
        expect(compareResult).toEqual([
            { status: "retained", value: "A" },
            { status: "added", value: "A2", index: 1 },
            { status: "added", value: "A3", index: 2 },
            { status: "retained", value: "B" },
            { status: "added", value: "B2", index: 4 }
        ]);
    });

    it('Should recognize deleted items', function () {
        var oldArray = ["A", "B", "C", "D", "E"];
        var newArray = ["B", "C", "E"];
        var compareResult = ko.utils.compareArrays(oldArray, newArray);
        expect(compareResult).toEqual([
            { status: "deleted", value: "A", index: 0 },
            { status: "retained", value: "B" },
            { status: "retained", value: "C" },
            { status: "deleted", value: "D", index: 3 },
            { status: "retained", value: "E" }
        ]);
    });

    it('Should recognize mixed edits', function () {
        var oldArray = ["A", "B", "C", "D", "E"];
        var newArray = [123, "A", "E", "C", "D"];
        var compareResult = ko.utils.compareArrays(oldArray, newArray);
        expect(compareResult).toEqual([
            { status: "added", value: 123, index: 0 },
            { status: "retained", value: "A" },
            { status: "deleted", value: "B", index: 1 },
            { status: "added", value: "E", index: 2, moved: 4 },
            { status: "retained", value: "C" },
            { status: "retained", value: "D" },
            { status: "deleted", value: "E", index: 4, moved: 2 }
        ]);
    });

    it('Should recognize replaced array', function () {
        var oldArray = ["A", "B", "C", "D", "E"];
        var newArray = ["F", "G", "H", "I", "J"];
        var compareResult = ko.utils.compareArrays(oldArray, newArray);
        // The ordering of added/deleted items for replaced entries isn't defined, so
        // we'll sort the results first to ensure the results are in a known order for verification.
        compareResult.sort(function(a, b) { return (a.index - b.index) || a.status.localeCompare(b.status); });
        expect(compareResult).toEqual([
            { status : 'added', value : 'F', index : 0 },
            { status : 'deleted', value : 'A', index : 0 },
            { status : 'added', value : 'G', index : 1 },
            { status : 'deleted', value : 'B', index : 1 },
            { status : 'added', value : 'H', index : 2 },
            { status : 'deleted', value : 'C', index : 2 },
            { status : 'added', value : 'I', index : 3 },
            { status : 'deleted', value : 'D', index : 3 },
            { status : 'added', value : 'J', index : 4 },
            { status : 'deleted', value : 'E', index : 4 }
        ]);
    });

    it('Should support sparse diffs', function() {
        // A sparse diff is exactly like a regular diff, except it doesn't contain any
        // 'retained' items. This still preserves enough information for most things
        // you'd want to do with the changeset.

        var oldArray = ["A", "B", "C", "D", "E"];
        var newArray = [123, "A", "E", "C", "D"];
        var compareResult = ko.utils.compareArrays(oldArray, newArray, { sparse: true });
        expect(compareResult).toEqual([
            { status: "added", value: 123, index: 0 },
            { status: "deleted", value: "B", index: 1 },
            { status: "added", value: "E", index: 2, moved: 4 },
            { status: "deleted", value: "E", index: 4, moved: 2 }
        ]);
    });
});
