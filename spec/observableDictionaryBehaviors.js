
describe('Observable Dictionary', {
    before_each: function () {
        var testData = {
            Alpha: 1,
            Beta: 2,
            Gamma: 3
        }
        testObservableDictionary = new ko.observableDictionary(testData);
        notifiedValues = [];
        testObservableDictionary.subscribe(function (value) {
            notifiedValues.push(value ? value.slice(0) : value);
        });
        beforeNotifiedValues = [];
        testObservableDictionary.subscribe(function (value) {
            beforeNotifiedValues.push(value ? value.slice(0) : value);
        }, null, "beforeChange");
    },

    'Should be observable': function () {
        value_of(ko.isObservable(testObservableDictionary)).should_be(true);
    },
    
    'Should initialize to empty array if you pass no args to constructor' : function() {
        var instance = new ko.observableDictionary();
        value_of(instance().length).should_be(0);       
    },

    'Should require constructor arg, if given, to be array-like or object, null or undefined' : function() {
        // Try disallowed args
        var threw;
        try { threw = false; new ko.observableDictionary(1); } catch(ex) { threw = true }
        value_of(threw).should_be(true);

        // Try allowed args
        value_of((new ko.observableDictionary({a:1,b:2}))().length).should_be(2);
        value_of((new ko.observableDictionary([1,2,3]))().length).should_be(3);
        value_of((new ko.observableDictionary(null))()).should_be(null);
        value_of((new ko.observableDictionary(undefined))()).should_be(undefined);
    },

    'Should be able to write values to it': function () {
        testObservableDictionary({'X': 1, 'Y': 2});
        value_of(notifiedValues.length).should_be(1);
        value_of(notifiedValues[0][0].key()).should_be('X');
        value_of(notifiedValues[0][1].key()).should_be('Y');
    },

    'Should be able to mark single items as destroyed' : function() {
        testObservableDictionary.destroy('Alpha');
        value_of(testObservableDictionary().length).should_be(3);
        
        var abc = testObservableDictionary.get('Alpha', false);
        var def = testObservableDictionary.get('Beta', false);
        
        value_of(abc._destroy).should_be(true);
        value_of(def._destroy).should_be(undefined);
    },
    
    'Should be able to mark multiple items as destroyed' : function() {
        testObservableDictionary.destroyAll(['Alpha', 'Beta']);
        value_of(testObservableDictionary().length).should_be(3);

        var abc = testObservableDictionary.get('Alpha', false);
        var def = testObservableDictionary.get('Beta', false);
        var ghi = testObservableDictionary.get('Gamma', false);
        
        value_of(abc._destroy).should_be(true);
        value_of(def._destroy).should_be(true);
        value_of(ghi._destroy).should_be(undefined);
    },

    'Should be able to mark all items as destroyed by passing no args to destroyAll()' : function() {
        testObservableDictionary.destroyAll();
        value_of(testObservableDictionary().length).should_be(3);

        var abc = testObservableDictionary.get('Alpha', false);
        var def = testObservableDictionary.get('Beta', false);
        var ghi = testObservableDictionary.get('Gamma', false);

        value_of(abc._destroy).should_be(true);
        value_of(def._destroy).should_be(true);       
        value_of(ghi._destroy).should_be(true);
    },

    'Should notify subscribers on push': function () {
        testObservableDictionary.push('Delta', 'Some new value');
        value_of(notifiedValues.length).should_be(1);
        value_of(notifiedValues[0].length).should_be(4);
        value_of(notifiedValues[0][3].key()).should_be('Delta');
        value_of(notifiedValues[0][3].value()).should_be('Some new value');
    },

    'Should notify "beforeChange" subscribers before push': function () {
        testObservableDictionary.push('Delta', 'Some new value');
        value_of(beforeNotifiedValues.length).should_be(1);
        value_of(beforeNotifiedValues[0].length).should_be(3);
    },

    'Should notify subscribers on pop': function () {
        var popped = testObservableDictionary.pop();
        value_of(popped.key()).should_be('Gamma');
        value_of(notifiedValues.length).should_be(1);
        value_of(notifiedValues[0].length).should_be(2);
        value_of(notifiedValues[0][0].key()).should_be('Alpha');
        value_of(notifiedValues[0][1].key()).should_be('Beta');
    },

    'Should notify "beforeChange" subscribers before pop': function () {
        var popped = testObservableDictionary.pop();
        value_of(popped.key()).should_be('Gamma');
        value_of(beforeNotifiedValues.length).should_be(1);
        value_of(beforeNotifiedValues[0].length).should_be(3);
    },

    'Should notify subscribers on splice': function () {
        var spliced = testObservableDictionary.splice(1, 1);
        value_of(spliced.length).should_be(1);
        value_of(spliced[0].key()).should_be('Beta');
        value_of(notifiedValues.length).should_be(1);
        value_of(notifiedValues[0].length).should_be(2);
        value_of(notifiedValues[0][0].key()).should_be('Alpha');
        value_of(notifiedValues[0][1].key()).should_be('Gamma');
    },

    'Should notify "beforeChange" subscribers before splice': function () {
        var spliced = testObservableDictionary.splice(1, 1);
        value_of(spliced.length).should_be(1);
        value_of(spliced[0].key()).should_be('Beta');
        value_of(beforeNotifiedValues.length).should_be(1);
        value_of(beforeNotifiedValues[0].length).should_be(3);
    },

    'Should notify subscribers on remove by value': function () {
        var removed = testObservableDictionary.remove('Beta');
        value_of(removed.length).should_be(1);
        value_of(removed[0].key()).should_be('Beta');
        value_of(notifiedValues.length).should_be(1);
        value_of(notifiedValues[0].length).should_be(2);
        value_of(notifiedValues[0][0].key()).should_be('Alpha');
        value_of(notifiedValues[0][1].key()).should_be('Gamma');
    },

    'Should notify subscribers on remove by predicate': function () {
        var removed = testObservableDictionary.remove(function (item) { return item.key() == 'Beta'; });
        value_of(removed.length).should_be(1);
        value_of(removed[0].key()).should_be('Beta');
        value_of(notifiedValues.length).should_be(1);
        value_of(notifiedValues[0].length).should_be(2);
        value_of(notifiedValues[0][0].key()).should_be('Alpha');
        value_of(notifiedValues[0][1].key()).should_be('Gamma');
    },

    'Should notify subscribers on remove multiple by value': function () {
        var removed = testObservableDictionary.removeAll(['Gamma', 'Alpha']);
        value_of(removed.length).should_be(2);
        value_of(removed[0].key()).should_be('Alpha');
        value_of(removed[1].key()).should_be('Gamma');
        value_of(notifiedValues.length).should_be(1);
        value_of(notifiedValues[0].length).should_be(1);
        value_of(notifiedValues[0][0].key()).should_be('Beta');
    },

    'Should clear observable array entirely if you pass no args to removeAll()': function() {
        var removed = testObservableDictionary.removeAll();
        value_of(removed.length).should_be(3);
        value_of(notifiedValues).should_be([[]]);
    },
    
    'Should notify "beforeChange" subscribers before remove': function () {
        var removed = testObservableDictionary.remove('Beta');
        value_of(removed.length).should_be(1);
        value_of(removed[0].key()).should_be('Beta');
        value_of(beforeNotifiedValues.length).should_be(1);
        value_of(beforeNotifiedValues[0].length).should_be(3);
        value_of(beforeNotifiedValues[0][0].key()).should_be('Alpha');
        value_of(beforeNotifiedValues[0][1].key()).should_be('Beta');
        value_of(beforeNotifiedValues[0][2].key()).should_be('Gamma');
    },

    'Should not notify subscribers on remove by value with no match': function () {
        var removed = testObservableDictionary.remove('Delta');
        value_of(removed).should_be([]);
        value_of(notifiedValues).should_be([]);
    },

    'Should not notify "beforeChange" subscribers before remove by value with no match': function () {
        var removed = testObservableDictionary.remove("Delta");
        value_of(removed).should_be([]);
        value_of(beforeNotifiedValues).should_be([]);
    },

    'Should not modify original array on remove': function () {
        var originalData = {'Alpha': 1, 'Beta': 2, 'Gamma': 3};
        testObservableDictionary(originalData);
        testObservableDictionary.remove('Beta');
        value_of(originalData).should_be({'Alpha': 1, 'Beta': 2, 'Gamma': 3});
    },

    'Should not modify original array on removeAll': function () {
        var originalData = {'Alpha': 1, 'Beta': 2, 'Gamma': 3};
        testObservableDictionary(originalData);
        testObservableDictionary.removeAll();
        value_of(originalData).should_be({'Alpha': 1, 'Beta': 2, 'Gamma': 3});
    },

    'Should throw when calling replace': function () {
        var threw;
        try { threw = false; testObservableDictionary.replace('Beta', 'Delta'); } catch(ex) { threw = true }
        value_of(threw).should_be(true);
    },
    
    'Should notify subscribers after marking items as destroyed': function () {
        var abc = testObservableDictionary.get('Alpha', false);
        var def = testObservableDictionary.get('Beta', false);
    
        testObservableDictionary.subscribe(function(value) {
            value_of(abc._destroy).should_be(undefined);
            value_of(def._destroy).should_be(true);
            didNotify = true;
        });
        testObservableDictionary.destroy('Beta');
        value_of(didNotify).should_be(true);
    },

    'Should notify "beforeChange" subscribers before marking items as destroyed': function () {
        var abc = testObservableDictionary.get('Alpha', false);
        var def = testObservableDictionary.get('Beta', false);
    
        testObservableDictionary.subscribe(function(value) {
            value_of(abc._destroy).should_be(undefined);
            value_of(def._destroy).should_be(undefined);
            didNotify = true;
        }, null, "beforeChange");
        testObservableDictionary.destroy('Beta');
        value_of(didNotify).should_be(true);
    },

    'Should be able to return first index of item': function () {
        value_of(testObservableDictionary.indexOf("Beta")).should_be(1);
        value_of(testObservableDictionary.indexOf("Gamma")).should_be(2);
        value_of(testObservableDictionary.indexOf("Alpha")).should_be(0);
        value_of(testObservableDictionary.indexOf("fake")).should_be(-1);
    },
    
    'Should return 0 when you call myArray.length, and the true length when you call myArray().length': function() {
        value_of(testObservableDictionary.length).should_be(0);
        value_of(testObservableDictionary().length).should_be(3);
    }
})
