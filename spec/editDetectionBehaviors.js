
function copyDomNodeChildren(domNode) {
    var copy = [];
    for (var i = 0; i < domNode.childNodes.length; i++)
        copy.push(domNode.childNodes[i]);
    return copy;
}

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
            { status: "deleted", value: "B" },
            { status: "added", value: "E" },
            { status: "retained", value: "C" },
            { status: "retained", value: "D" },
            { status: "deleted", value: "E" }
        ]);
    }
});

describe('Array to DOM node children mapping', {
    before_each: function () {
        var existingNode = document.getElementById("testNode");
        if (existingNode != null)
            existingNode.parentNode.removeChild(existingNode);
        testNode = document.createElement("div");
        testNode.id = "testNode";
        document.body.appendChild(testNode);
    },

    'Should populate the DOM node by mapping array elements': function () {
        var array = ["A", "B"];
        var mapping = function (arrayItem) {
            var output1 = document.createElement("DIV");
            var output2 = document.createElement("DIV");
            output1.innerHTML = arrayItem + "1";
            output2.innerHTML = arrayItem + "2";
            return [output1, output2];
        };
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, array, mapping);
        value_of(testNode.childNodes.length).should_be(4);
        value_of(testNode.childNodes[0].innerHTML).should_be("A1");
        value_of(testNode.childNodes[1].innerHTML).should_be("A2");
        value_of(testNode.childNodes[2].innerHTML).should_be("B1");
        value_of(testNode.childNodes[3].innerHTML).should_be("B2");
    },

    'Should only call the mapping function for new array elements': function () {
        var mappingInvocations = [];
        var mapping = function (arrayItem) {
            mappingInvocations.push(arrayItem);
            return null;
        };
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["A", "B"], mapping);
        value_of(mappingInvocations).should_be(["A", "B"]);

        mappingInvocations = [];
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["A", "A2", "B"], mapping);
        value_of(mappingInvocations).should_be(["A2"]);
    },

    'Should retain existing node instances if the array is unchanged': function () {
        var array = ["A", "B"];
        var mapping = function (arrayItem) {
            var output1 = document.createElement("DIV");
            var output2 = document.createElement("DIV");
            output1.innerHTML = arrayItem + "1";
            output2.innerHTML = arrayItem + "2";
            return [output1, output2];
        };

        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, array, mapping);
        var existingInstances = copyDomNodeChildren(testNode);

        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, array, mapping);
        var newInstances = copyDomNodeChildren(testNode);

        value_of(newInstances).should_be(existingInstances);
    },

    'Should insert added nodes at the corresponding place in the DOM': function () {
        var mappingInvocations = [];
        var mapping = function (arrayItem) {
            mappingInvocations.push(arrayItem);
            var output = document.createElement("DIV");
            output.innerHTML = arrayItem;
            return [output];
        };

        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["A", "B"], mapping);
        value_of(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).should_be(["A", "B"]);
        value_of(mappingInvocations).should_be(["A", "B"]);

        mappingInvocations = [];
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["first", "A", "middle1", "middle2", "B", "last"], mapping);
        value_of(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).should_be(["first", "A", "middle1", "middle2", "B", "last"]);
        value_of(mappingInvocations).should_be(["first", "middle1", "middle2", "last"]);
    },

    'Should remove deleted nodes from the DOM': function () {
        var mappingInvocations = [];
        var mapping = function (arrayItem) {
            mappingInvocations.push(arrayItem);
            var output = document.createElement("DIV");
            output.innerHTML = arrayItem;
            return [output];
        };

        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["first", "A", "middle1", "middle2", "B", "last"], mapping);
        value_of(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).should_be(["first", "A", "middle1", "middle2", "B", "last"]);
        value_of(mappingInvocations).should_be(["first", "A", "middle1", "middle2", "B", "last"]);

        mappingInvocations = [];
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["A", "B"], mapping);
        value_of(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).should_be(["A", "B"]);
        value_of(mappingInvocations).should_be([]);
    },

    'Should handle sequences of mixed insertions and deletions': function () {
        var mappingInvocations = [], countCallbackInvocations = 0;
        var mapping = function (arrayItem) {
            mappingInvocations.push(arrayItem);
            var output = document.createElement("DIV");
            output.innerHTML = ko.utils.unwrapObservable(arrayItem) || "null";
            return [output];
        };
        var callback = function(arrayItem, nodes) {
            ++countCallbackInvocations;
            value_of(mappingInvocations[mappingInvocations.length-1]).should_be(arrayItem);
        }

        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["A"], mapping, null, callback);
        value_of(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).should_be(["A"]);
        value_of(mappingInvocations).should_be(["A"]);
        value_of(countCallbackInvocations).should_be(mappingInvocations.length);

        mappingInvocations = [], countCallbackInvocations = 0;
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["B"], mapping, null, callback); // Delete and replace single item
        value_of(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).should_be(["B"]);
        value_of(mappingInvocations).should_be(["B"]);
        value_of(countCallbackInvocations).should_be(mappingInvocations.length);

        mappingInvocations = [], countCallbackInvocations = 0;
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["A", "B", "C"], mapping, null, callback); // Add at beginning and end
        value_of(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).should_be(["A", "B", "C"]);
        value_of(mappingInvocations).should_be(["A", "C"]);
        value_of(countCallbackInvocations).should_be(mappingInvocations.length);

        mappingInvocations = [], countCallbackInvocations = 0;
        var observable = ko.observable(1);
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, [observable, null, "B"], mapping, null, callback); // Add to beginning; delete from end
        value_of(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).should_be(["1", "null", "B"]);
        value_of(mappingInvocations).should_be([observable, null]);
        value_of(countCallbackInvocations).should_be(mappingInvocations.length);

        mappingInvocations = [], countCallbackInvocations = 0;
        observable(2);      // Change the value of the observable
        value_of(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).should_be(["2", "null", "B"]);
        value_of(mappingInvocations).should_be([observable]);
        value_of(countCallbackInvocations).should_be(mappingInvocations.length);
    }
});