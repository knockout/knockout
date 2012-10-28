describe('Binding: Value', {
    before_each: JSSpec.prepareTestNode,

    'Should assign the value to the node': function () {
        testNode.innerHTML = "<input data-bind='value:123' />";
        ko.applyBindings(null, testNode);
        value_of(testNode.childNodes[0].value).should_be("123");
    },

    'Should treat null values as empty strings': function () {
        testNode.innerHTML = "<input data-bind='value:myProp' />";
        ko.applyBindings({ myProp: ko.observable(0) }, testNode);
        value_of(testNode.childNodes[0].value).should_be("0");
    },

    'Should assign an empty string as value if the model value is null': function () {
        testNode.innerHTML = "<input data-bind='value:(null)' />";
        ko.applyBindings(null, testNode);
        value_of(testNode.childNodes[0].value).should_be("");
    },

    'Should assign an empty string as value if the model value is undefined': function () {
        testNode.innerHTML = "<input data-bind='value:undefined' />";
        ko.applyBindings(null, testNode);
        value_of(testNode.childNodes[0].value).should_be("");
    },

    'For observable values, should unwrap the value and update on change': function () {
        var myobservable = new ko.observable(123);
        testNode.innerHTML = "<input data-bind='value:someProp' />";
        ko.applyBindings({ someProp: myobservable }, testNode);
        value_of(testNode.childNodes[0].value).should_be("123");
        myobservable(456);
        value_of(testNode.childNodes[0].value).should_be("456");
    },

    'For writeable observable values, should catch the node\'s onchange and write values back to the observable': function () {
        var myobservable = new ko.observable(123);
        testNode.innerHTML = "<input data-bind='value:someProp' />";
        ko.applyBindings({ someProp: myobservable }, testNode);
        testNode.childNodes[0].value = "some user-entered value";
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        value_of(myobservable()).should_be("some user-entered value");
    },

    'For writeable observable values, should always write when triggered, even when value is the same': function () {
        var validValue = ko.observable(123);
        var isValid = ko.observable(true);
        var valueForEditing = ko.computed({
            read: validValue,
            write: function(newValue) {
                if (!isNaN(newValue)) {
                    isValid(true);
                    validValue(newValue);
                } else {
                    isValid(false);
                }
            }
        });

        testNode.innerHTML = "<input data-bind='value: valueForEditing' />";
        ko.applyBindings({ valueForEditing: valueForEditing}, testNode);

        //set initial valid value
        testNode.childNodes[0].value = "1234";
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        value_of(validValue()).should_be("1234");
        value_of(isValid()).should_be(true);

        //set to an invalid value
        testNode.childNodes[0].value = "1234a";
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        value_of(validValue()).should_be("1234");
        value_of(isValid()).should_be(false);

        //set to a valid value where the current value of the writeable computed is the same as the written value
        testNode.childNodes[0].value = "1234";
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        value_of(validValue()).should_be("1234");
        value_of(isValid()).should_be(true);
    },

    'For non-observable property values, should catch the node\'s onchange and write values back to the property': function () {
        var model = { modelProperty123: 456 };
        testNode.innerHTML = "<input data-bind='value: modelProperty123' />";
        ko.applyBindings(model, testNode);
        value_of(testNode.childNodes[0].value).should_be("456");

        testNode.childNodes[0].value = 789;
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        value_of(model.modelProperty123).should_be("789");
    },

    'Should be able to read and write to a property of an object returned by a function': function () {
        var mySetter = { set: 666 };
        var model = {
            getSetter: function () {
                return mySetter;
            }
        };
        testNode.innerHTML =
            "<input data-bind='value: getSetter().set' />" +
            "<input data-bind='value: getSetter()[\"set\"]' />" +
            "<input data-bind=\"value: getSetter()['set']\" />";
        ko.applyBindings(model, testNode);
        value_of(testNode.childNodes[0].value).should_be(666);
        value_of(testNode.childNodes[1].value).should_be(666);
        value_of(testNode.childNodes[2].value).should_be(666);

        // .property
        testNode.childNodes[0].value = 667;
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        value_of(mySetter.set).should_be(667);

        // ["property"]
        testNode.childNodes[1].value = 668;
        ko.utils.triggerEvent(testNode.childNodes[1], "change");
        value_of(mySetter.set).should_be(668);

        // ['property']
        testNode.childNodes[0].value = 669;
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        value_of(mySetter.set).should_be(669);
    },

    'Should be able to write to observable subproperties of an observable, even after the parent observable has changed': function () {
        // This spec represents https://github.com/SteveSanderson/knockout/issues#issue/13
        var originalSubproperty = ko.observable("original value");
        var newSubproperty = ko.observable();
        var model = { myprop: ko.observable({ subproperty : originalSubproperty }) };

        // Set up a text box whose value is linked to the subproperty of the observable's current value
        testNode.innerHTML = "<input data-bind='value: myprop().subproperty' />";
        ko.applyBindings(model, testNode);
        value_of(testNode.childNodes[0].value).should_be("original value");

        model.myprop({ subproperty : newSubproperty }); // Note that myprop (and hence its subproperty) is changed *after* the bindings are applied
        testNode.childNodes[0].value = "Some new value";
        ko.utils.triggerEvent(testNode.childNodes[0], "change");

        // Verify that the change was written to the *new* subproperty, not the one referenced when the bindings were first established
        value_of(newSubproperty()).should_be("Some new value");
        value_of(originalSubproperty()).should_be("original value");
    },

    'Should only register one single onchange handler': function () {
        var notifiedValues = [];
        var myobservable = new ko.observable(123);
        myobservable.subscribe(function (value) { notifiedValues.push(value); });
        value_of(notifiedValues.length).should_be(0);

        testNode.innerHTML = "<input data-bind='value:someProp' />";
        ko.applyBindings({ someProp: myobservable }, testNode);

        // Implicitly observe the number of handlers by seeing how many times "myobservable"
        // receives a new value for each onchange on the text box. If there's just one handler,
        // we'll see one new value per onchange event. More handlers cause more notifications.
        testNode.childNodes[0].value = "ABC";
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        value_of(notifiedValues.length).should_be(1);

        testNode.childNodes[0].value = "DEF";
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        value_of(notifiedValues.length).should_be(2);
    },

    'Should be able to catch updates after specific events (e.g., keyup) instead of onchange': function () {
        var myobservable = new ko.observable(123);
        testNode.innerHTML = "<input data-bind='value:someProp, valueUpdate: \"keyup\"' />";
        ko.applyBindings({ someProp: myobservable }, testNode);
        testNode.childNodes[0].value = "some user-entered value";
        ko.utils.triggerEvent(testNode.childNodes[0], "keyup");
        value_of(myobservable()).should_be("some user-entered value");
    },

    'Should catch updates on change as well as the nominated valueUpdate event': function () {
        // Represents issue #102 (https://github.com/SteveSanderson/knockout/issues/102)
        var myobservable = new ko.observable(123);
        testNode.innerHTML = "<input data-bind='value:someProp, valueUpdate: \"keyup\"' />";
        ko.applyBindings({ someProp: myobservable }, testNode);
        testNode.childNodes[0].value = "some user-entered value";
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        value_of(myobservable()).should_be("some user-entered value");
    },

    'For select boxes, should update selectedIndex when the model changes (options specified before value)': function() {
        var observable = new ko.observable('B');
        testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], value:myObservable'></select>";
        ko.applyBindings({ myObservable: observable }, testNode);
        value_of(testNode.childNodes[0].selectedIndex).should_be(1);
        value_of(observable()).should_be('B');

        observable('A');
        value_of(testNode.childNodes[0].selectedIndex).should_be(0);
        value_of(observable()).should_be('A');
    },

    'For select boxes, should update selectedIndex when the model changes (value specified before options)': function() {
        var observable = new ko.observable('B');
        testNode.innerHTML = "<select data-bind='value:myObservable, options:[\"A\", \"B\"]'></select>";
        ko.applyBindings({ myObservable: observable }, testNode);
        value_of(testNode.childNodes[0].selectedIndex).should_be(1);
        value_of(observable()).should_be('B');

        observable('A');
        value_of(testNode.childNodes[0].selectedIndex).should_be(0);
        value_of(observable()).should_be('A');
    },

    'For select boxes, should display the caption when the model value changes to undefined': function() {
        var observable = new ko.observable('B');
        testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], optionsCaption:\"Select...\", value:myObservable'></select>";
        ko.applyBindings({ myObservable: observable }, testNode);
        value_of(testNode.childNodes[0].selectedIndex).should_be(2);
        observable(undefined);
        value_of(testNode.childNodes[0].selectedIndex).should_be(0);
    },

    'For select boxes, should update the model value when the UI is changed (setting it to undefined when the caption is selected)': function () {
        var observable = new ko.observable('B');
        testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], optionsCaption:\"Select...\", value:myObservable'></select>";
        ko.applyBindings({ myObservable: observable }, testNode);
        var dropdown = testNode.childNodes[0];

        dropdown.selectedIndex = 1;
        ko.utils.triggerEvent(dropdown, "change");
        value_of(observable()).should_be("A");

        dropdown.selectedIndex = 0;
        ko.utils.triggerEvent(dropdown, "change");
        value_of(observable()).should_be(undefined);
    },

    'For select boxes, should be able to associate option values with arbitrary objects (not just strings)': function() {
        var x = {}, y = {};
        var selectedValue = ko.observable(y);
        testNode.innerHTML = "<select data-bind='options: myOptions, value: selectedValue'></select>";
        var dropdown = testNode.childNodes[0];
        ko.applyBindings({ myOptions: [x, y], selectedValue: selectedValue }, testNode);

        // Check the UI displays the entry corresponding to the chosen value
        value_of(dropdown.selectedIndex).should_be(1);

        // Check that when we change the model value, the UI is updated
        selectedValue(x);
        value_of(dropdown.selectedIndex).should_be(0);

        // Check that when we change the UI, this changes the model value
        dropdown.selectedIndex = 1;
        ko.utils.triggerEvent(dropdown, "change");
        value_of(selectedValue()).should_be(y);
    },

    'For select boxes, should automatically initialize the model property to match the first option value if no option value matches the current model property value': function() {
        // The rationale here is that we always want the model value to match the option that appears to be selected in the UI
        //  * If there is *any* option value that equals the model value, we'd initalise the select box such that *that* option is the selected one
        //  * If there is *no* option value that equals the model value (often because the model value is undefined), we should set the model
        //    value to match an arbitrary option value to avoid inconsistency between the visible UI and the model
        var observable = new ko.observable(); // Undefined by default

        // Should work with options specified before value
        testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], value:myObservable'></select>";
        ko.applyBindings({ myObservable: observable }, testNode);
        value_of(observable()).should_be("A");

        // ... and with value specified before options
        testNode.innerHTML = "<select data-bind='value:myObservable, options:[\"A\", \"B\"]'></select>";
        observable(undefined);
        value_of(observable()).should_be(undefined);
        ko.applyBindings({ myObservable: observable }, testNode);
        value_of(observable()).should_be("A");
    },

    'For nonempty select boxes, should reject model values that don\'t match any option value, resetting the model value to whatever is visibly selected in the UI': function() {
        var observable = new ko.observable('B');
        testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\", \"C\"], value:myObservable'></select>";
        ko.applyBindings({ myObservable: observable }, testNode);
        value_of(testNode.childNodes[0].selectedIndex).should_be(1);

        observable('D'); // This change should be rejected, as there's no corresponding option in the UI
        value_of(observable()).should_not_be('D');
    },

    'For select boxes, option values can be numerical, and are not implicitly converted to strings': function() {
        var observable = new ko.observable(30);
        testNode.innerHTML = "<select data-bind='options:[10,20,30,40], value:myObservable'></select>";
        ko.applyBindings({ myObservable: observable }, testNode);

        // First check that numerical model values will match a dropdown option
        value_of(testNode.childNodes[0].selectedIndex).should_be(2); // 3rd element, zero-indexed

        // Then check that dropdown options map back to numerical model values
        testNode.childNodes[0].selectedIndex = 1;
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        value_of(typeof observable()).should_be("number");
        value_of(observable()).should_be(20);
    },

    'For select boxes with values attributes, should always use value (and not text)': function() {
        var observable = new ko.observable('A');
        testNode.innerHTML = "<select data-bind='value:myObservable'><option value=''>A</option><option value='A'>B</option></select>";
        ko.applyBindings({ myObservable: observable }, testNode);
        var dropdown = testNode.childNodes[0];
        value_of(dropdown.selectedIndex).should_be(1);

        dropdown.selectedIndex = 0;
        ko.utils.triggerEvent(dropdown, "change");
        value_of(observable()).should_be("");
    },

    'For select boxes with text values but no value property, should use text value': function() {
        var observable = new ko.observable('B');
        testNode.innerHTML = "<select data-bind='value:myObservable'><option>A</option><option>B</option><option>C</option></select>";
        ko.applyBindings({ myObservable: observable }, testNode);
        var dropdown = testNode.childNodes[0];
        value_of(dropdown.selectedIndex).should_be(1);

        dropdown.selectedIndex = 0;
        ko.utils.triggerEvent(dropdown, "change");
        value_of(observable()).should_be("A");

        observable('C');
        value_of(dropdown.selectedIndex).should_be(2);
    },

    'On IE < 10, should handle autofill selection by treating "propertychange" followed by "blur" as a change event': function() {
        // This spec describes the awkward choreography of events needed to detect changes to text boxes on IE < 10,
        // because it doesn't fire regular "change" events when the user selects an autofill entry. It isn't applicable
        // on IE 10+ or other browsers, because they don't have that problem with autofill.
        var isOldIE = JSSpec.Browser.IEVersion && JSSpec.Browser.IEVersion < 10;

        if (isOldIE) {
            var myobservable = new ko.observable(123).extend({ notify: 'always' });
            var numUpdates = 0;
            myobservable.subscribe(function() { numUpdates++ });
            testNode.innerHTML = "<input data-bind='value:someProp' />";
            ko.applyBindings({ someProp: myobservable }, testNode);

            // Simulate:
            // 1. Select from autofill
            // 2. Modify the textbox further
            // 3. Tab out of the textbox
            // --- should be treated as a single change
            testNode.childNodes[0].value = "some user-entered value";
            ko.utils.triggerEvent(testNode.childNodes[0], "propertychange");
            ko.utils.triggerEvent(testNode.childNodes[0], "change");
            value_of(myobservable()).should_be("some user-entered value");
            value_of(numUpdates).should_be(1);
            ko.utils.triggerEvent(testNode.childNodes[0], "blur");
            value_of(numUpdates).should_be(1);

            // Simulate:
            // 1. Select from autofill
            // 2. Tab out of the textbox
            // 3. Reselect, edit, then tab out of the textbox
            // --- should be treated as two changes (one after step 2, one after step 3)
            testNode.childNodes[0].value = "different user-entered value";
            ko.utils.triggerEvent(testNode.childNodes[0], "propertychange");
            ko.utils.triggerEvent(testNode.childNodes[0], "blur");
            value_of(myobservable()).should_be("different user-entered value");
            value_of(numUpdates).should_be(2);
            ko.utils.triggerEvent(testNode.childNodes[0], "change");
            value_of(numUpdates).should_be(3);
        }
    }
});