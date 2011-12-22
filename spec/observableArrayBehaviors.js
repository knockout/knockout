
describe('Observable Array', {
    before_each: function () {
        testObservableArray = new ko.observableArray([1, 2, 3]);
        notifiedValues = [];
        testObservableArray.subscribe(function (value) {
            notifiedValues.push(value ? value.slice(0) : value);
        });
        beforeNotifiedValues = [];
        testObservableArray.subscribe(function (value) {
            beforeNotifiedValues.push(value ? value.slice(0) : value);
        }, null, "beforeChange");
    },

    'Should be observable': function () {
        value_of(ko.isObservable(testObservableArray)).should_be(true);
    },
    
    'Should initialize to empty array if you pass no args to constructor' : function() {
        var instance = new ko.observableArray();
        value_of(instance().length).should_be(0);       
    },

    'Should require constructor arg, if given, to be array-like or null or undefined' : function() {
        // Try non-array-like args
        var threw;
        try { threw = false; new ko.observableArray(1); } catch(ex) { threw = true }
        value_of(threw).should_be(true);
        try { threw = false; new ko.observableArray({}); } catch(ex) { threw = true }
        value_of(threw).should_be(true);
        
        // Try allowed args
        value_of((new ko.observableArray([1,2,3]))().length).should_be(3);
        value_of((new ko.observableArray(null))()).should_be(null);
        value_of((new ko.observableArray(undefined))()).should_be(undefined);
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

    'Should be able to mark all items as destroyed by passing no args to destroyAll()' : function() {
        var x = {}, y = {}, z = {};
        testObservableArray([x, y, z]);
        testObservableArray.destroyAll();
        value_of(testObservableArray().length).should_be(3);
        value_of(x._destroy).should_be(true);
        value_of(y._destroy).should_be(true);       
        value_of(z._destroy).should_be(true);
    },

    'Should notify subscribers on push': function () {
        testObservableArray.push("Some new value");
        value_of(notifiedValues).should_be([[1, 2, 3, "Some new value"]]);
    },

    'Should notify "beforeChange" subscribers before push': function () {
        testObservableArray.push("Some new value");
        value_of(beforeNotifiedValues).should_be([[1, 2, 3]]);
    },

    'Should notify subscribers on pop': function () {
        var popped = testObservableArray.pop();
        value_of(popped).should_be(3);
        value_of(notifiedValues).should_be([[1, 2]]);
    },

    'Should notify "beforeChange" subscribers before pop': function () {
        var popped = testObservableArray.pop();
        value_of(popped).should_be(3);
        value_of(beforeNotifiedValues).should_be([[1, 2, 3]]);
    },

    'Should notify subscribers on splice': function () {
        var spliced = testObservableArray.splice(1, 1);
        value_of(spliced).should_be([2]);
        value_of(notifiedValues).should_be([[1, 3]]);
    },

    'Should notify "beforeChange" subscribers before splice': function () {
        var spliced = testObservableArray.splice(1, 1);
        value_of(spliced).should_be([2]);
        value_of(beforeNotifiedValues).should_be([[1, 2, 3]]);
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

    'Should clear observable array entirely if you pass no args to removeAll()': function() {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        notifiedValues = [];
        var removed = testObservableArray.removeAll();
        value_of(removed).should_be(["Alpha", "Beta", "Gamma"]);
        value_of(notifiedValues).should_be([[]]);
    },
    
    'Should notify "beforeChange" subscribers before remove': function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        beforeNotifiedValues = [];
        var removed = testObservableArray.remove("Beta");
        value_of(removed).should_be(["Beta"]);
        value_of(beforeNotifiedValues).should_be([["Alpha", "Beta", "Gamma"]]);
    },

    'Should not notify subscribers on remove by value with no match': function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        notifiedValues = [];
        var removed = testObservableArray.remove("Delta");
        value_of(removed).should_be([]);
        value_of(notifiedValues).should_be([]);
    },

    'Should not notify "beforeChange" subscribers before remove by value with no match': function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        beforeNotifiedValues = [];
        var removed = testObservableArray.remove("Delta");
        value_of(removed).should_be([]);
        value_of(beforeNotifiedValues).should_be([]);
    },

    'Should modify original array on remove': function () {
        var originalArray = ["Alpha", "Beta", "Gamma"];
        testObservableArray(originalArray);
        notifiedValues = [];
        var removed = testObservableArray.remove("Beta");
        value_of(originalArray).should_be(["Alpha", "Gamma"]);
    },

    'Should modify original array on removeAll': function () {
        var originalArray = ["Alpha", "Beta", "Gamma"];
        testObservableArray(originalArray);
        notifiedValues = [];
        var removed = testObservableArray.removeAll();
        value_of(originalArray).should_be([]);
    },

    'Should notify subscribers on replace': function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        notifiedValues = [];
        testObservableArray.replace("Beta", "Delta");
        value_of(notifiedValues).should_be([["Alpha", "Delta", "Gamma"]]);
    },    
    
    'Should notify "beforeChange" subscribers before replace': function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        beforeNotifiedValues = [];
        testObservableArray.replace("Beta", "Delta");
        value_of(beforeNotifiedValues).should_be([["Alpha", "Beta", "Gamma"]]);
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

    'Should notify "beforeChange" subscribers before marking items as destroyed': function () {
        var x = {}, y = {}, didNotify = false;
        testObservableArray([x, y]);
        testObservableArray.subscribe(function(value) {
            value_of(x._destroy).should_be(undefined);
            value_of(y._destroy).should_be(undefined);
            didNotify = true;
        }, null, "beforeChange");
        testObservableArray.destroy(y);
        value_of(didNotify).should_be(true);
    },

    'Should be able to return first index of item': function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        value_of(testObservableArray.indexOf("Beta")).should_be(1);
        value_of(testObservableArray.indexOf("Gamma")).should_be(2);
        value_of(testObservableArray.indexOf("Alpha")).should_be(0);
        value_of(testObservableArray.indexOf("fake")).should_be(-1);
    },
    
    'Should return 0 when you call myArray.length, and the true length when you call myArray().length': function() {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        value_of(testObservableArray.length).should_be(0); // Because JavaScript won't let us override "length" directly
        value_of(testObservableArray().length).should_be(3);
    }
})
