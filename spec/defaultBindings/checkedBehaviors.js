describe('Binding: Checked', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Triggering a click should toggle a checkbox\'s checked state before the event handler fires', function() {
        // This isn't strictly to do with the checked binding, but if this doesn't work, the rest of the specs aren't meaningful
        testNode.innerHTML = "<input type='checkbox' />";
        var clickHandlerFireCount = 0, expectedCheckedStateInHandler;
        ko.utils.registerEventHandler(testNode.childNodes[0], "click", function() {
            clickHandlerFireCount++;
            expect(testNode.childNodes[0].checked).toEqual(expectedCheckedStateInHandler);
        })
        expect(testNode.childNodes[0].checked).toEqual(false);
        expectedCheckedStateInHandler = true;
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        expect(testNode.childNodes[0].checked).toEqual(true);
        expect(clickHandlerFireCount).toEqual(1);

        expectedCheckedStateInHandler = false;
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        expect(testNode.childNodes[0].checked).toEqual(false);
        expect(clickHandlerFireCount).toEqual(2);
    });

    it('Should be able to control a checkbox\'s checked state', function () {
        var myobservable = new ko.observable(true);
        testNode.innerHTML = "<input type='checkbox' data-bind='checked:someProp' />";

        ko.applyBindings({ someProp: myobservable }, testNode);
        expect(testNode.childNodes[0].checked).toEqual(true);

        myobservable(false);
        expect(testNode.childNodes[0].checked).toEqual(false);
    });

    it('Should update observable properties on the underlying model when the checkbox click event fires', function () {
        var myobservable = new ko.observable(false);
        testNode.innerHTML = "<input type='checkbox' data-bind='checked:someProp' />";
        ko.applyBindings({ someProp: myobservable }, testNode);

        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        expect(myobservable()).toEqual(true);
    });

    it('Should only notify observable properties on the underlying model *once* even if the checkbox change events fire multiple times', function () {
        var myobservable = new ko.observable();
        var timesNotified = 0;
        myobservable.subscribe(function() { timesNotified++ });
        testNode.innerHTML = "<input type='checkbox' data-bind='checked:someProp' />";
        ko.applyBindings({ someProp: myobservable }, testNode);

        // Multiple events only cause one notification...
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        expect(timesNotified).toEqual(1);

        // ... until the checkbox value actually changes
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        expect(timesNotified).toEqual(2);
    });

    it('Should update non-observable properties on the underlying model when the checkbox click event fires', function () {
        var model = { someProp: false };
        testNode.innerHTML = "<input type='checkbox' data-bind='checked:someProp' />";
        ko.applyBindings(model, testNode);

        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        expect(model.someProp).toEqual(true);
    });

    it('Should make a radio button checked if and only if its value matches the bound model property', function () {
        var myobservable = new ko.observable("another value");
        testNode.innerHTML = "<input type='radio' value='This Radio Button Value' data-bind='checked:someProp' />";

        ko.applyBindings({ someProp: myobservable }, testNode);
        expect(testNode.childNodes[0].checked).toEqual(false);

        myobservable("This Radio Button Value");
        expect(testNode.childNodes[0].checked).toEqual(true);
    });

    it('Should set an observable model property to this radio button\'s value when checked', function () {
        var myobservable = new ko.observable("another value");
        testNode.innerHTML = "<input type='radio' value='this radio button value' data-bind='checked:someProp' />";
        ko.applyBindings({ someProp: myobservable }, testNode);

        expect(myobservable()).toEqual("another value");
        testNode.childNodes[0].click();
        expect(myobservable()).toEqual("this radio button value");
    });

    it('Should only notify observable properties on the underlying model *once* even if the radio button change/click events fire multiple times', function () {
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
        expect(timesNotified).toEqual(1);

        // ... until you click something with a different value
        ko.utils.triggerEvent(testNode.childNodes[1], "click");
        ko.utils.triggerEvent(testNode.childNodes[1], "change");
        expect(timesNotified).toEqual(2);
    });

    it('Should set a non-observable model property to this radio button\'s value when checked', function () {
        var model = { someProp: "another value" };
        testNode.innerHTML = "<input type='radio' value='this radio button value' data-bind='checked:someProp' />";
        ko.applyBindings(model, testNode);

        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        expect(model.someProp).toEqual("this radio button value");
    });

    it('When a checkbox is bound to an array, the checkbox should control whether its value is in that array', function() {
        var model = { myArray: ["Existing value", "Unrelated value"] };
        testNode.innerHTML = "<input type='checkbox' value='Existing value' data-bind='checked:myArray' />"
                           + "<input type='checkbox' value='New value'      data-bind='checked:myArray' />";
        ko.applyBindings(model, testNode);

        expect(model.myArray).toEqual(["Existing value", "Unrelated value"]);

        // Checkbox initial state is determined by whether the value is in the array
        expect(testNode).toHaveCheckedStates([true, false]);
        // Checking the checkbox puts it in the array
        ko.utils.triggerEvent(testNode.childNodes[1], "click");
        expect(testNode).toHaveCheckedStates([true, true]);
        expect(model.myArray).toEqual(["Existing value", "Unrelated value", "New value"]);
        // Unchecking the checkbox removes it from the array
        ko.utils.triggerEvent(testNode.childNodes[1], "click");
        expect(testNode).toHaveCheckedStates([true, false]);
        expect(model.myArray).toEqual(["Existing value", "Unrelated value"]);
    });

    it('When a checkbox is bound to an observable array, the checkbox checked state responds to changes in the array', function() {
        var model = { myObservableArray: ko.observableArray(["Unrelated value"]) };
        testNode.innerHTML = "<input type='checkbox' value='My value' data-bind='checked:myObservableArray' />";
        ko.applyBindings(model, testNode);

        expect(testNode.childNodes[0].checked).toEqual(false);

        // Put the value in the array; observe the checkbox reflect this
        model.myObservableArray.push("My value");
        expect(testNode.childNodes[0].checked).toEqual(true);

        // Remove the value from the array; observe the checkbox reflect this
        model.myObservableArray.remove("My value");
        expect(testNode.childNodes[0].checked).toEqual(false);
    });

    it('When a checkbox is bound to a computed array, the checkbox and the computed observable should update each other', function() {
        var observable = ko.observable([]),
            computed = ko.computed({
                read: function() {
                    return observable().slice(0);   // return a copy of the array so that we know that writes to the computed are really working
                },
                write: observable   // just pass writes on to the observable
            });

        testNode.innerHTML = "<input type='checkbox' value='A' data-bind='checked: computed' /><input type='checkbox' value='B' data-bind='checked: computed' />";
        ko.applyBindings({ computed: computed }, testNode);
        expect(testNode).toHaveCheckedStates([false, false]);

        // Binding adds an item to the observable
        ko.utils.triggerEvent(testNode.childNodes[1], "click");
        expect(testNode).toHaveCheckedStates([false, true]);
        expect(observable()).toEqual(["B"]);

        // Updating the observable updates the view
        observable(["A"]);
        expect(testNode).toHaveCheckedStates([true, false]);

        // Binding removes an item from the observable
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        expect(testNode).toHaveCheckedStates([false, false]);
        expect(observable()).toEqual([]);
    });

    it('When the radio button \'value\' attribute is set via attr binding, should set initial checked state correctly (attr before checked)', function() {
        var myobservable = new ko.observable("this radio button value");
        testNode.innerHTML = "<input type='radio' data-bind='attr:{value:\"this radio button value\"}, checked:someProp' />";
        ko.applyBindings({ someProp: myobservable }, testNode);

        expect(testNode.childNodes[0].checked).toEqual(true);
        myobservable("another value");
        expect(testNode.childNodes[0].checked).toEqual(false);
    });

    it('When the radio button \'value\' attribute is set via attr binding, should set initial checked state correctly (checked before attr)', function() {
        var myobservable = new ko.observable("this radio button value");
        testNode.innerHTML = "<input type='radio' data-bind='checked:someProp, attr:{value:\"this radio button value\"}' />";
        ko.applyBindings({ someProp: myobservable }, testNode);

        expect(testNode.childNodes[0].checked).toEqual(true);
        myobservable("another value");
        expect(testNode.childNodes[0].checked).toEqual(false);
    });

    it('When the bound observable is updated in a subscription in response to a radio click, view and model should stay in sync', function() {
        // This test failed when jQuery was included before the changes made in #1191
        testNode.innerHTML = '<input type="radio" value="1" name="x" data-bind="checked: choice" />' +
            '<input type="radio" value="2" name="x" data-bind="checked: choice" />' +
            '<input type="radio" value="3" name="x" data-bind="checked: choice" />';
        var choice = ko.observable('1');
        choice.subscribe(function(newValue) {
            if (newValue == '3')        // don't allow item 3 to be selected; revert to item 1
                choice('1');
        });
        ko.applyBindings({choice: choice}, testNode);
        expect(testNode).toHaveCheckedStates([true, false, false]);

        // Click on item 2; verify it's selected
        ko.utils.triggerEvent(testNode.childNodes[1], "click");
        expect(testNode).toHaveCheckedStates([false, true, false]);

        // Click on item 3; verify item 1 is selected
        ko.utils.triggerEvent(testNode.childNodes[2], "click");
        expect(testNode).toHaveCheckedStates([true, false, false]);
    });

    ko.utils.arrayForEach([
        { binding: "checkedValue", label: "With \'checkedValue\'" },
        { binding: "value", label: 'With \'value\' treated like \'checkedValue\' when used with \'checked\'' }
    ], function (data) {
        var binding = data.binding;

        describe(data.label, function() {
            it('Should use that value as the checkbox value in the array', function() {
                var model = { myArray: ko.observableArray([1,3]) };
                testNode.innerHTML = "<input type='checkbox' data-bind='checked:myArray, " + binding + ":1' />"
                    + "<input value='off' type='checkbox' data-bind='checked:myArray, " + binding + ":2' />";
                ko.applyBindings(model, testNode);

                expect(model.myArray()).toEqual([1,3]);   // initial value is unchanged

                // Checkbox initial state is determined by whether the value is in the array
                expect(testNode).toHaveCheckedStates([true, false]);

                // Verify that binding sets element value
                expect(testNode).toHaveValues(['1', '2']);

                // Checking the checkbox puts it in the array
                ko.utils.triggerEvent(testNode.childNodes[1], "click");
                expect(testNode).toHaveCheckedStates([true, true]);
                expect(model.myArray()).toEqual([1,3,2]);

                // Unchecking the checkbox removes it from the array
                ko.utils.triggerEvent(testNode.childNodes[1], "click");
                expect(testNode).toHaveCheckedStates([true, false]);
                expect(model.myArray()).toEqual([1,3]);

                // Put the value in the array; observe the checkbox reflect this
                model.myArray.push(2);
                expect(testNode).toHaveCheckedStates([true, true]);

                // Remove the value from the array; observe the checkbox reflect this
                model.myArray.remove(1);
                expect(testNode).toHaveCheckedStates([false, true]);
            });

            it('Should be able to use objects as value of checkboxes', function() {
                var object1 = {x:1},
                    object2 = {y:1},
                    model = { values: [object1], choices: [object1, object2] };
                testNode.innerHTML = "<div data-bind='foreach: choices'><input type='checkbox' data-bind='checked:$parent.values, " + binding + ":$data' /></div>";
                ko.applyBindings(model, testNode);

                // Checkbox initial state is determined by whether the value is in the array
                expect(testNode.childNodes[0]).toHaveCheckedStates([true, false]);

                // Checking the checkbox puts it in the array
                ko.utils.triggerEvent(testNode.childNodes[0].childNodes[1], "click");
                expect(testNode.childNodes[0]).toHaveCheckedStates([true, true]);
                expect(model.values).toEqual([object1, object2]);

                // Unchecking the checkbox removes it from the array
                ko.utils.triggerEvent(testNode.childNodes[0].childNodes[1], "click");
                expect(testNode.childNodes[0]).toHaveCheckedStates([true, false]);
                expect(model.values).toEqual([object1]);
            });

            it('Should be able to use observables as value of checkboxes', function() {
                var object1 = {id:ko.observable(1)},
                    object2 = {id:ko.observable(2)},
                    model = { values: ko.observableArray([1]), choices: [object1, object2] };
                testNode.innerHTML = "<div data-bind='foreach: choices'><input type='checkbox' data-bind='" + binding + ":id, checked:$parent.values' /></div>";
                ko.applyBindings(model, testNode);

                expect(model.values()).toEqual([1]);
                expect(testNode.childNodes[0]).toHaveCheckedStates([true, false]);

                // Update the value observable of the checked item; should update the selected values and leave checked values unchanged
                object1.id(3);
                expect(model.values()).toEqual([3]);
                expect(testNode.childNodes[0]).toHaveCheckedStates([true, false]);

                // Update the value observable of the unchecked item; should do nothing
                object2.id(4);
                expect(model.values()).toEqual([3]);
                expect(testNode.childNodes[0]).toHaveCheckedStates([true, false]);

                // Update the value observable of the unchecked item to the current model value; should set to checked
                object2.id(3);
                expect(model.values()).toEqual([3]);
                expect(testNode.childNodes[0]).toHaveCheckedStates([true, true]);

                // Update the value again; should leave checked and replace item in the selected values (other checkbox should be unchecked)
                object2.id(4);
                expect(model.values()).toEqual([4]);
                expect(testNode.childNodes[0]).toHaveCheckedStates([false, true]);

                // Revert to original value; should update value in selected values
                object2.id(2);
                expect(model.values()).toEqual([2]);
                expect(testNode.childNodes[0]).toHaveCheckedStates([false, true]);
            });

            it('When node is removed, subscription to observable bound to \'' + binding + '\' is disposed', function () {
                var model = { values: [1], checkedValue: ko.observable(1) };
                testNode.innerHTML = "<input type='checkbox' data-bind='" + binding + ":checkedValue, checked:values' />";
                ko.applyBindings(model, testNode);

                expect(model.values).toEqual([1]);
                expect(testNode.childNodes[0].checked).toEqual(true);
                expect(model.checkedValue.getSubscriptionsCount()).toBeGreaterThan(0);

                ko.removeNode(testNode.childNodes[0]);
                expect(model.checkedValue.getSubscriptionsCount()).toEqual(0);
            });

            it('Should use that value as the radio button\'s value', function () {
                var myobservable = ko.observable(false);
                testNode.innerHTML = "<input type='radio' data-bind='checked:someProp, " + binding + ":true' />" +
                    "<input type='radio' data-bind='checked:someProp, " + binding + ":false' />";
                ko.applyBindings({ someProp: myobservable }, testNode);

                expect(myobservable()).toEqual(false);

                // Check initial state
                expect(testNode).toHaveCheckedStates([false, true]);

                // Update observable; verify elements
                myobservable(true);
                expect(testNode).toHaveCheckedStates([true, false]);

                // "Click" a button; verify observable and elements
                testNode.childNodes[1].click();
                expect(myobservable()).toEqual(false);
                expect(testNode).toHaveCheckedStates([false, true]);
            });

            it('Should be able to use observables as value of radio buttons', function () {
                var object1 = {id:ko.observable(1)},
                    object2 = {id:ko.observable(2)},
                    model = { value: ko.observable(1), choices: [object1, object2] };
                testNode.innerHTML = "<div data-bind='foreach: choices'><input type='radio' data-bind='" + binding + ":id, checked:$parent.value' /></div>";
                ko.applyBindings(model, testNode);

                expect(model.value()).toEqual(1);
                expect(testNode.childNodes[0]).toHaveCheckedStates([true, false]);

                // Update the value observable of the checked item; should update the selected value and leave checked values unchanged
                object1.id(3);
                expect(model.value()).toEqual(3);
                expect(testNode.childNodes[0]).toHaveCheckedStates([true, false]);

                // Update the value observable of the unchecked item; should do nothing
                object2.id(4);
                expect(model.value()).toEqual(3);
                expect(testNode.childNodes[0]).toHaveCheckedStates([true, false]);

                // Update the value observable of the unchecked item to the current model value; should set to checked
                object2.id(3);
                expect(model.value()).toEqual(3);
                expect(testNode.childNodes[0]).toHaveCheckedStates([true, true]);

                // Update the value again; should leave checked and replace selected value (other button should be unchecked)
                object2.id(4);
                expect(model.value()).toEqual(4);
                expect(testNode.childNodes[0]).toHaveCheckedStates([false, true]);

                // Revert to original value; should update selected value
                object2.id(2);
                expect(model.value()).toEqual(2);
                expect(testNode.childNodes[0]).toHaveCheckedStates([false, true]);
            });

            if (binding == "checkedValue") {
                // When bound to a checkbox, the "checkedValue" binding will affect a non-array
                // "checked" binding, but "value" won't.

                it('Should use that value as the checkbox\'s value when not bound to an array', function () {
                    var myobservable = ko.observable('random value');
                    testNode.innerHTML = "<input type='checkbox' data-bind='checked:someProp, " + binding + ":true' />" +
                        "<input type='checkbox' data-bind='checked:someProp, " + binding + ":false' />";
                    ko.applyBindings({ someProp: myobservable }, testNode);

                    expect(myobservable()).toEqual('random value');

                    // Check initial state: both are unchecked because neither has a matching value
                    expect(testNode).toHaveCheckedStates([false, false]);

                    // Update observable; verify element states
                    myobservable(false);
                    expect(testNode).toHaveCheckedStates([false, true]);
                    myobservable(true);
                    expect(testNode).toHaveCheckedStates([true, false]);

                    // "check" a box; verify observable and elements
                    testNode.childNodes[1].click();
                    expect(myobservable()).toEqual(false);
                    expect(testNode).toHaveCheckedStates([false, true]);

                    // "uncheck" a box; verify observable and elements
                    testNode.childNodes[1].click();
                    expect(myobservable()).toEqual(undefined);
                    expect(testNode).toHaveCheckedStates([false, false]);
                });

                it('Should be able to use observables as value of checkboxes when not bound to an array', function() {
                    var object1 = {id:ko.observable(1)},
                        object2 = {id:ko.observable(2)},
                        model = { value: ko.observable(1), choices: [object1, object2] };
                    testNode.innerHTML = "<div data-bind='foreach: choices'><input type='checkbox' data-bind='" + binding + ":id, checked:$parent.value' /></div>";
                    ko.applyBindings(model, testNode);

                    expect(model.value()).toEqual(1);
                    expect(testNode.childNodes[0]).toHaveCheckedStates([true, false]);

                    // Update the value observable of the checked item; should update the selected values and leave checked values unchanged
                    object1.id(3);
                    expect(model.value()).toEqual(3);
                    expect(testNode.childNodes[0]).toHaveCheckedStates([true, false]);

                    // Update the value observable of the unchecked item; should do nothing
                    object2.id(4);
                    expect(model.value()).toEqual(3);
                    expect(testNode.childNodes[0]).toHaveCheckedStates([true, false]);

                    // Update the value observable of the unchecked item to the current model value; should set to checked
                    object2.id(3);
                    expect(model.value()).toEqual(3);
                    expect(testNode.childNodes[0]).toHaveCheckedStates([true, true]);

                    // Update the value again; should leave checked and replace selected value (other button should be unchecked)
                    object2.id(4);
                    expect(model.value()).toEqual(4);
                    expect(testNode.childNodes[0]).toHaveCheckedStates([false, true]);

                    // Revert to original value; should update selected value
                    object2.id(2);
                    expect(model.value()).toEqual(2);
                    expect(testNode.childNodes[0]).toHaveCheckedStates([false, true]);
                });
            }

            it('Should ignore \'undefined\' value for checkbox', function () {
                var myobservable = new ko.observable(true);
                testNode.innerHTML = "<input type='checkbox' data-bind='checked: someProp, " + binding + ":undefined' />";
                ko.applyBindings({ someProp: myobservable }, testNode);

                // ignores 'undefined' value and treats checkbox value as true/false
                expect(testNode.childNodes[0].checked).toEqual(true);
                myobservable(false);
                expect(testNode.childNodes[0].checked).toEqual(false);

                ko.utils.triggerEvent(testNode.childNodes[0], "click");
                expect(myobservable()).toEqual(true);
                ko.utils.triggerEvent(testNode.childNodes[0], "click");
                expect(myobservable()).toEqual(false);
            });
        });
    });
});
