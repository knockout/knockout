/// <reference path="../src/binding/editDetection/compareArrays.js" />

describe('Compare Arrays', {
    'Should recognize when two arrays have the same contents': function () {
        var subject = ["A", {}, function () { } ];
        var compareResult = ko.utils.compareArrays(subject, subject.slice(0));

        value_of(compareResult.length).should_be(subject.length);
        for (var i = 0; i < subject.length; i++) {
            value_of(compareResult[i].status).should_be("retained");
            value_of(compareResult[i].value).should_be(subject[i]);
        }
    },

    'Should recognize added items': function () {
        var oldArray = ["A", "B"];
        var newArray = ["A", "A2", "A3", "B", "B2"];
        var compareResult = ko.utils.compareArrays(oldArray, newArray);
        value_of(compareResult).should_be([
            { status: "retained", value: "A" },
            { status: "added", value: "A2" },
            { status: "added", value: "A3" },
            { status: "retained", value: "B" },
            { status: "added", value: "B2" }
        ]);
    },

    'Should recognize deleted items': function () {
        var oldArray = ["A", "B", "C", "D", "E"];
        var newArray = ["B", "C", "E"];
        var compareResult = ko.utils.compareArrays(oldArray, newArray);
        value_of(compareResult).should_be([
            { status: "deleted", value: "A" },
            { status: "retained", value: "B" },
            { status: "retained", value: "C" },
            { status: "deleted", value: "D" },
            { status: "retained", value: "E" }
        ]);
    },

    'Should recognize mixed edits': function () {
        var oldArray = ["A", "B", "C", "D", "E"];
        var newArray = [123, "A", "E", "C", "D"];
        var compareResult = ko.utils.compareArrays(oldArray, newArray);
        value_of(compareResult).should_be([
            { status: "added", value: 123 },
            { status: "retained", value: "A" },
            { status: "added", value: "E" },
            { status: "deleted", value: "B" },
            { status: "retained", value: "C" },
            { status: "retained", value: "D" },
            { status: "deleted", value: "E" }
        ]);
    }
});