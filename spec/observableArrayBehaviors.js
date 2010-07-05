/// <reference path="../src/subscribables/observableArray.js" />

describe('Observable Array', {
    before_each: function () {
        testObservableArray = new ko.observableArray([1, 2, 3]);
        notifiedValues = [];
        testObservableArray.subscribe(function (value) {
            notifiedValues.push(value ? value.slice(0) : value);
        });
    },

    'Should be observable': function () {
        value_of(ko.isObservable(testObservableArray)).should_be(true);
    },

    'Should be able to write values to it': function () {
        testObservableArray(['X', 'Y']);
        value_of(notifiedValues.length).should_be(1);
        value_of(notifiedValues[0][0]).should_be('X');
        value_of(notifiedValues[0][1]).should_be('Y');
    },

    'Should notify subscribers on push': function () {
        testObservableArray.push("Some new value");
        value_of(notifiedValues).should_be([[1, 2, 3, "Some new value"]]);
    },

    'Should notify subscribers on pop': function () {
        var popped = testObservableArray.pop();
        value_of(popped).should_be(3);
        value_of(notifiedValues).should_be([[1, 2]]);
    },

    'Should notify subscribers on splice': function () {
        var spliced = testObservableArray.splice(1, 1);
        value_of(spliced).should_be([2]);
        value_of(notifiedValues).should_be([[1, 3]]);
    },

    'Should notify subscribers on remove by value': function () {
        // Replace with some more useful data
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        notifiedValues = [];
        var removed = testObservableArray.remove("Beta");
        value_of(removed).should_be(["Beta"]);
        value_of(notifiedValues).should_be([["Alpha", "Gamma"]]);
    },

    'Should notify subscribers on remove by predicate': function () {
        // Replace with some more useful data
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        notifiedValues = [];
        var removed = testObservableArray.remove(function (value) { return value == "Beta"; });
        value_of(removed).should_be(["Beta"]);
        value_of(notifiedValues).should_be([["Alpha", "Gamma"]]);
    },

    'Should notify subscribers on remove multiple by value': function () {
        // Replace with some more useful data
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        notifiedValues = [];
        var removed = testObservableArray.removeAll(["Gamma", "Alpha"]);
        value_of(removed).should_be(["Alpha", "Gamma"]);
        value_of(notifiedValues).should_be([["Beta"]]);
    },

    'Should be able to return first index of item': function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        value_of(testObservableArray.indexOf("Beta")).should_be(1);
        value_of(testObservableArray.indexOf("Gamma")).should_be(2);
        value_of(testObservableArray.indexOf("Alpha")).should_be(0);
        value_of(testObservableArray.indexOf("fake")).should_be(-1);
    }    
})