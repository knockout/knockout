describe('Binding: Checked', {
    before_each: JSSpec.prepareTestNode,

    'Triggering a click should toggle a checkbox\'s checked state before the event handler fires': function() {
        // This isn't strictly to do with the checked binding, but if this doesn't work, the rest of the specs aren't meaningful
        testNode.innerHTML = "<input type='checkbox' />";
        var clickHandlerFireCount = 0, expectedCheckedStateInHandler;
        ko.utils.registerEventHandler(testNode.childNodes[0], "click", function() {
            clickHandlerFireCount++;
            value_of(testNode.childNodes[0].checked).should_be(expectedCheckedStateInHandler);
        })
        value_of(testNode.childNodes[0].checked).should_be(false);
        expectedCheckedStateInHandler = true;
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        value_of(testNode.childNodes[0].checked).should_be(true);
        value_of(clickHandlerFireCount).should_be(1);

        expectedCheckedStateInHandler = false;
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        value_of(testNode.childNodes[0].checked).should_be(false);
        value_of(clickHandlerFireCount).should_be(2);
    },

    'Should be able to control a checkbox\'s checked state': function () {
        var myobservable = new ko.observable(true);
        testNode.innerHTML = "<input type='checkbox' data-bind='checked:someProp' />";

        ko.applyBindings({ someProp: myobservable }, testNode);
        value_of(testNode.childNodes[0].checked).should_be(true);

        myobservable(false);
        value_of(testNode.childNodes[0].checked).should_be(false);
    },

    'Should update observable properties on the underlying model when the checkbox click event fires': function () {
        var myobservable = new ko.observable(false);
        testNode.innerHTML = "<input type='checkbox' data-bind='checked:someProp' />";
        ko.applyBindings({ someProp: myobservable }, testNode);

        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        value_of(myobservable()).should_be(true);
    },

    'Should only notify observable properties on the underlying model *once* even if the checkbox change events fire multiple times': function () {
        var myobservable = new ko.observable();
        var timesNotified = 0;
        myobservable.subscribe(function() { timesNotified++ });
        testNode.innerHTML = "<input type='checkbox' data-bind='checked:someProp' />";
        ko.applyBindings({ someProp: myobservable }, testNode);

        // Multiple events only cause one notification...
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        value_of(timesNotified).should_be(1);

        // ... until the checkbox value actually changes
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        value_of(timesNotified).should_be(2);
    },

    'Should update non-observable properties on the underlying model when the checkbox click event fires': function () {
        var model = { someProp: false };
        testNode.innerHTML = "<input type='checkbox' data-bind='checked:someProp' />";
        ko.applyBindings(model, testNode);

        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        value_of(model.someProp).should_be(true);
    },

    'Should update observable properties on the underlying model when the checkbox is clicked': function () {
        var myobservable = new ko.observable(false);
        testNode.innerHTML = "<input type='checkbox' data-bind='checked:someProp' />";
        ko.applyBindings({ someProp: myobservable }, testNode);

        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        value_of(myobservable()).should_be(true);
    },

    'Should update non-observable properties on the underlying model when the checkbox is clicked': function () {
        var model = { someProp: false };
        testNode.innerHTML = "<input type='checkbox' data-bind='checked:someProp' />";
        ko.applyBindings(model, testNode);

        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        value_of(model.someProp).should_be(true);
    },

    'Should make a radio button checked if and only if its value matches the bound model property': function () {
        var myobservable = new ko.observable("another value");
        testNode.innerHTML = "<input type='radio' value='This Radio Button Value' data-bind='checked:someProp' />";

        ko.applyBindings({ someProp: myobservable }, testNode);
        value_of(testNode.childNodes[0].checked).should_be(false);

        myobservable("This Radio Button Value");
        value_of(testNode.childNodes[0].checked).should_be(true);
    },

    'Should set an observable model property to this radio button\'s value when checked': function () {
        var myobservable = new ko.observable("another value");
        testNode.innerHTML = "<input type='radio' value='this radio button value' data-bind='checked:someProp' />";
        ko.applyBindings({ someProp: myobservable }, testNode);

        value_of(myobservable()).should_be("another value");
        testNode.childNodes[0].click();
        value_of(myobservable()).should_be("this radio button value");
    },

    'Should only notify observable properties on the underlying model *once* even if the radio button change/click events fire multiple times': function () {
        var myobservable = new ko.observable("original value");
        var timesNotified = 0;
        myobservable.subscribe(function() { timesNotified++ });
        testNode.innerHTML = "<input type='radio' value='this radio button value' data-bind='checked:someProp' /><input type='radio' value='different value' data-bind='checked:someProp' />";
        ko.applyBindings({ someProp: myobservable }, testNode);

        // Multiple events only cause one notification...
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        value_of(timesNotified).should_be(1);

        // ... until you click something with a different value
        ko.utils.triggerEvent(testNode.childNodes[1], "click");
        ko.utils.triggerEvent(testNode.childNodes[1], "change");
        value_of(timesNotified).should_be(2);
    },

    'Should set a non-observable model property to this radio button\'s value when checked': function () {
        var model = { someProp: "another value" };
        testNode.innerHTML = "<input type='radio' value='this radio button value' data-bind='checked:someProp' />";
        ko.applyBindings(model, testNode);

        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        value_of(model.someProp).should_be("this radio button value");
    },

    'When a checkbox is bound to an array, the checkbox should control whether its value is in that array': function() {
        var model = { myArray: ["Existing value", "Unrelated value"] };
        testNode.innerHTML = "<input type='checkbox' value='Existing value' data-bind='checked:myArray' />"
                           + "<input type='checkbox' value='New value'      data-bind='checked:myArray' />";
        ko.applyBindings(model, testNode);

        value_of(model.myArray).should_be(["Existing value", "Unrelated value"]);

        // Checkbox initial state is determined by whether the value is in the array
        value_of(testNode.childNodes[0].checked).should_be(true);
        value_of(testNode.childNodes[1].checked).should_be(false);
        // Checking the checkbox puts it in the array
        ko.utils.triggerEvent(testNode.childNodes[1], "click");
        value_of(testNode.childNodes[1].checked).should_be(true);
        value_of(model.myArray).should_be(["Existing value", "Unrelated value", "New value"]);
        // Unchecking the checkbox removes it from the array
        ko.utils.triggerEvent(testNode.childNodes[1], "click");
        value_of(testNode.childNodes[1].checked).should_be(false);
        value_of(model.myArray).should_be(["Existing value", "Unrelated value"]);
    },

    'When a checkbox is bound to an observable array, the checkbox checked state responds to changes in the array': function() {
        var model = { myObservableArray: ko.observableArray(["Unrelated value"]) };
        testNode.innerHTML = "<input type='checkbox' value='My value' data-bind='checked:myObservableArray' />";
        ko.applyBindings(model, testNode);

        value_of(testNode.childNodes[0].checked).should_be(false);

        // Put the value in the array; observe the checkbox reflect this
        model.myObservableArray.push("My value");
        value_of(testNode.childNodes[0].checked).should_be(true);

        // Remove the value from the array; observe the checkbox reflect this
        model.myObservableArray.remove("My value");
        value_of(testNode.childNodes[0].checked).should_be(false);
    }
});