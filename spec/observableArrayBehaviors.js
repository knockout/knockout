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
    
    'Should be able to mark single items as destroyed' : function() {
    	var x = {}, y = {};
    	testObservableArray([x, y]);
    	testObservableArray.destroy(y);
    	value_of(testObservableArray().length).should_be(2);
    	value_of(x._destroy).should_be(undefined);
    	value_of(y._destroy).should_be(true);
    },
    
    'Should be able to mark multiple items as destroyed' : function() {
    	var x = {}, y = {}, z = {};
    	testObservableArray([x, y, z]);
    	testObservableArray.destroyAll([x, z]);
    	value_of(testObservableArray().length).should_be(3);
    	value_of(x._destroy).should_be(true);
    	value_of(y._destroy).should_be(undefined);    	
    	value_of(z._destroy).should_be(true);
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
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        notifiedValues = [];
        var removed = testObservableArray.remove("Beta");
        value_of(removed).should_be(["Beta"]);
        value_of(notifiedValues).should_be([["Alpha", "Gamma"]]);
    },

    'Should notify subscribers on remove by predicate': function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        notifiedValues = [];
        var removed = testObservableArray.remove(function (value) { return value == "Beta"; });
        value_of(removed).should_be(["Beta"]);
        value_of(notifiedValues).should_be([["Alpha", "Gamma"]]);
    },

    'Should notify subscribers on remove multiple by value': function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        notifiedValues = [];
        var removed = testObservableArray.removeAll(["Gamma", "Alpha"]);
        value_of(removed).should_be(["Alpha", "Gamma"]);
        value_of(notifiedValues).should_be([["Beta"]]);
    },
    
    'Should notify subscribers after marking items as destroyed': function () {
    	var x = {}, y = {}, didNotify = false;
        testObservableArray([x, y]);
        testObservableArray.subscribe(function(value) {
        	value_of(x._destroy).should_be(undefined);
        	value_of(y._destroy).should_be(true);
        	didNotify = true;
        });
        testObservableArray.destroy(y);
        value_of(didNotify).should_be(true);
    },

    'Should be able to return first index of item': function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        value_of(testObservableArray.indexOf("Beta")).should_be(1);
        value_of(testObservableArray.indexOf("Gamma")).should_be(2);
        value_of(testObservableArray.indexOf("Alpha")).should_be(0);
        value_of(testObservableArray.indexOf("fake")).should_be(-1);
    }    
})