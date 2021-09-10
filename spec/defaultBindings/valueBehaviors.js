describe('Binding: Value', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should assign the value to the node', function () {
        testNode.innerHTML = "<input data-bind='value:123' />";
        ko.applyBindings(null, testNode);
        expect(testNode.childNodes[0].value).toEqual("123");
    });

    it('Should treat null values as empty strings', function () {
        testNode.innerHTML = "<input data-bind='value:myProp' />";
        ko.applyBindings({ myProp: ko.observable(0) }, testNode);
        expect(testNode.childNodes[0].value).toEqual("0");
    });

    it('Should assign an empty string as value if the model value is null', function () {
        testNode.innerHTML = "<input data-bind='value:(null)' />";
        ko.applyBindings(null, testNode);
        expect(testNode.childNodes[0].value).toEqual("");
    });

    it('Should assign an empty string as value if the model value is undefined', function () {
        testNode.innerHTML = "<input data-bind='value:undefined' />";
        ko.applyBindings(null, testNode);
        expect(testNode.childNodes[0].value).toEqual("");
    });

    it('For observable values, should unwrap the value and update on change', function () {
        var myobservable = new ko.observable(123);
        testNode.innerHTML = "<input data-bind='value:someProp' />";
        ko.applyBindings({ someProp: myobservable }, testNode);
        expect(testNode.childNodes[0].value).toEqual("123");
        myobservable(456);
        expect(testNode.childNodes[0].value).toEqual("456");
    });

    it('For observable values, should update on change if new value is \'strictly\' different from previous value', function() {
        var myobservable = new ko.observable("+123");
        testNode.innerHTML = "<input data-bind='value:someProp' />";
        ko.applyBindings({ someProp: myobservable }, testNode);
        expect(testNode.childNodes[0].value).toEqual("+123");
        myobservable(123);
        expect(testNode.childNodes[0].value).toEqual("123");
    });

    it('For writeable observable values, should catch the node\'s onchange and write values back to the observable', function () {
        var myobservable = new ko.observable(123);
        testNode.innerHTML = "<input data-bind='value:someProp' />";
        ko.applyBindings({ someProp: myobservable }, testNode);
        testNode.childNodes[0].value = "some user-entered value";
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        expect(myobservable()).toEqual("some user-entered value");
    });

    it('For writeable observable values, should always write when triggered, even when value is the same', function () {
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
        expect(validValue()).toEqual("1234");
        expect(isValid()).toEqual(true);
        expect(testNode.childNodes[0].value).toEqual("1234");

        //set to an invalid value
        testNode.childNodes[0].value = "1234a";
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        expect(validValue()).toEqual("1234");
        expect(isValid()).toEqual(false);
        
        // binding should revert element value since the change was rejected by the computed observable 
        expect(testNode.childNodes[0].value).toEqual("1234");

        //set to a valid value where the current value of the writeable computed is the same as the written value
        testNode.childNodes[0].value = "1234";
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        expect(validValue()).toEqual("1234");
        expect(isValid()).toEqual(true);
        expect(testNode.childNodes[0].value).toEqual("1234");
    });

    it('Should ignore node changes when bound to a read-only observable', function() {
        var computedValue = ko.computed(function() { return 'zzz' });
        var vm = { prop: computedValue };

        testNode.innerHTML = "<input data-bind='value: prop' />";
        ko.applyBindings(vm, testNode);
        expect(testNode.childNodes[0].value).toEqual("zzz");

        // Change the input value and trigger change event; verify that the view model wasn't changed
        testNode.childNodes[0].value = "yyy";
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        expect(vm.prop).toEqual(computedValue);
        expect(computedValue()).toEqual('zzz');
    });

    it('For non-observable property values, should catch the node\'s onchange and write values back to the property', function () {
        var model = { modelProperty123: 456 };
        testNode.innerHTML = "<input data-bind='value: modelProperty123' />";
        ko.applyBindings(model, testNode);
        expect(testNode.childNodes[0].value).toEqual("456");

        testNode.childNodes[0].value = 789;
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        expect(model.modelProperty123).toEqual("789");
    });

    it('Should be able to read and write to a property of an object returned by a function', function () {
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
        expect(testNode.childNodes[0].value).toEqual('666');
        expect(testNode.childNodes[1].value).toEqual('666');
        expect(testNode.childNodes[2].value).toEqual('666');

        // .property
        testNode.childNodes[0].value = 667;
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        expect(mySetter.set).toEqual('667');

        // ["property"]
        testNode.childNodes[1].value = 668;
        ko.utils.triggerEvent(testNode.childNodes[1], "change");
        expect(mySetter.set).toEqual('668');

        // ['property']
        testNode.childNodes[0].value = 669;
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        expect(mySetter.set).toEqual('669');
    });

    it('Should be able to write to observable subproperties of an observable, even after the parent observable has changed', function () {
        // This spec represents https://github.com/SteveSanderson/knockout/issues#issue/13
        var originalSubproperty = ko.observable("original value");
        var newSubproperty = ko.observable();
        var model = { myprop: ko.observable({ subproperty : originalSubproperty }) };

        // Set up a text box whose value is linked to the subproperty of the observable's current value
        testNode.innerHTML = "<input data-bind='value: myprop().subproperty' />";
        ko.applyBindings(model, testNode);
        expect(testNode.childNodes[0].value).toEqual("original value");

        model.myprop({ subproperty : newSubproperty }); // Note that myprop (and hence its subproperty) is changed *after* the bindings are applied
        testNode.childNodes[0].value = "Some new value";
        ko.utils.triggerEvent(testNode.childNodes[0], "change");

        // Verify that the change was written to the *new* subproperty, not the one referenced when the bindings were first established
        expect(newSubproperty()).toEqual("Some new value");
        expect(originalSubproperty()).toEqual("original value");
    });

    it('Should only register one single onchange handler', function () {
        var notifiedValues = [];
        var myobservable = new ko.observable(123);
        myobservable.subscribe(function (value) { notifiedValues.push(value); });
        expect(notifiedValues.length).toEqual(0);

        testNode.innerHTML = "<input data-bind='value:someProp' />";
        ko.applyBindings({ someProp: myobservable }, testNode);

        // Implicitly observe the number of handlers by seeing how many times "myobservable"
        // receives a new value for each onchange on the text box. If there's just one handler,
        // we'll see one new value per onchange event. More handlers cause more notifications.
        testNode.childNodes[0].value = "ABC";
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        expect(notifiedValues.length).toEqual(1);

        testNode.childNodes[0].value = "DEF";
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        expect(notifiedValues.length).toEqual(2);
    });

    it('Should be able to catch updates after specific events (e.g., keyup) instead of onchange', function () {
        var myobservable = new ko.observable(123);
        testNode.innerHTML = "<input data-bind='value:someProp, valueUpdate: \"keyup\"' />";
        ko.applyBindings({ someProp: myobservable }, testNode);
        testNode.childNodes[0].value = "some user-entered value";
        ko.utils.triggerEvent(testNode.childNodes[0], "keyup");
        expect(myobservable()).toEqual("some user-entered value");
    });

    it('Should catch updates on change as well as the nominated valueUpdate event', function () {
        // Represents issue #102 (https://github.com/SteveSanderson/knockout/issues/102)
        var myobservable = new ko.observable(123);
        testNode.innerHTML = "<input data-bind='value:someProp, valueUpdate: \"keyup\"' />";
        ko.applyBindings({ someProp: myobservable }, testNode);
        testNode.childNodes[0].value = "some user-entered value";
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        expect(myobservable()).toEqual("some user-entered value");
    });

    it('Should delay reading value and updating observable when prefixing an event with "after"', function () {
        jasmine.Clock.useMock();

        var myobservable = new ko.observable("123");
        testNode.innerHTML = "<input data-bind='value:someProp, valueUpdate: \"afterkeyup\"' />";
        ko.applyBindings({ someProp: myobservable }, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "keyup");
        testNode.childNodes[0].value = "some user-entered value";
        expect(myobservable()).toEqual("123");  // observable is not changed yet

        jasmine.Clock.tick(20);
        expect(myobservable()).toEqual("some user-entered value");  // it's changed after a delay
    });

    it('Should ignore "unchanged" notifications from observable during delayed event processing', function () {
        jasmine.Clock.useMock();

        var myobservable = new ko.observable("123");
        testNode.innerHTML = "<input data-bind='value:someProp, valueUpdate: \"afterkeyup\"' />";
        ko.applyBindings({ someProp: myobservable }, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "keyup");
        testNode.childNodes[0].value = "some user-entered value";

        // Notification of previous value (unchanged) is ignored
        myobservable.valueHasMutated();
        expect(testNode.childNodes[0].value).toEqual("some user-entered value");

        // Observable is updated to new element value
        jasmine.Clock.tick(20);
        expect(myobservable()).toEqual("some user-entered value");
    });

    it('Should not ignore actual change notifications from observable during delayed event processing', function () {
        jasmine.Clock.useMock();

        var myobservable = new ko.observable("123");
        testNode.innerHTML = "<input data-bind='value:someProp, valueUpdate: \"afterkeyup\"' />";
        ko.applyBindings({ someProp: myobservable }, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "keyup");
        testNode.childNodes[0].value = "some user-entered value";

        // New value is written to input element
        myobservable("some value from the server");
        expect(testNode.childNodes[0].value).toEqual("some value from the server");

        // New value remains when event is processed
        jasmine.Clock.tick(20);
        expect(myobservable()).toEqual("some value from the server");
    });

    it('On IE < 10, should handle autofill selection by treating "propertychange" followed by "blur" as a change event', function() {
        // This spec describes the awkward choreography of events needed to detect changes to text boxes on IE < 10,
        // because it doesn't fire regular "change" events when the user selects an autofill entry. It isn't applicable
        // on IE 10+ or other browsers, because they don't have that problem with autofill.
        var isOldIE = jasmine.ieVersion && jasmine.ieVersion < 10;

        if (isOldIE) {
            var myobservable = new ko.observable(123).extend({ notify: 'always' });
            var numUpdates = 0;
            myobservable.subscribe(function() { numUpdates++ });
            testNode.innerHTML = "<input data-bind='value:someProp' />";
            ko.applyBindings({ someProp: myobservable }, testNode);

            // Simulate a blur occurring before the first real property change.
            // See that no 'update' event fires.
            ko.utils.triggerEvent(testNode.childNodes[0], "focus");
            ko.utils.triggerEvent(testNode.childNodes[0], "blur");
            expect(numUpdates).toEqual(0);

            // Simulate:
            // 1. Select from autofill
            // 2. Modify the textbox further
            // 3. Tab out of the textbox
            // --- should be treated as a single change
            testNode.childNodes[0].value = "some user-entered value";
            ko.utils.triggerEvent(testNode.childNodes[0], "propertychange");
            ko.utils.triggerEvent(testNode.childNodes[0], "change");
            expect(myobservable()).toEqual("some user-entered value");
            expect(numUpdates).toEqual(1);
            ko.utils.triggerEvent(testNode.childNodes[0], "blur");
            expect(numUpdates).toEqual(1);

            // Simulate:
            // 1. Select from autofill
            // 2. Tab out of the textbox
            // 3. Reselect, edit, then tab out of the textbox
            // --- should be treated as two changes (one after step 2, one after step 3)
            testNode.childNodes[0].value = "different user-entered value";
            ko.utils.triggerEvent(testNode.childNodes[0], "propertychange");
            ko.utils.triggerEvent(testNode.childNodes[0], "blur");
            expect(myobservable()).toEqual("different user-entered value");
            expect(numUpdates).toEqual(2);
            ko.utils.triggerEvent(testNode.childNodes[0], "change");
            expect(numUpdates).toEqual(3);
        }
    });

    it('Should bind to file inputs but not allow setting an non-empty value', function() {
        var observable = ko.observable('zzz');
        var vm = { prop: observable };

        testNode.innerHTML = "<input type='file' data-bind='value: prop' />";
        ko.applyBindings(vm, testNode);
        expect(testNode.childNodes[0].value).toEqual("");
    });

    describe('For select boxes', function() {
        it('Should update selectedIndex when the model changes (options specified before value)', function() {
            var observable = new ko.observable('B');
            testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], value:myObservable'></select>";
            ko.applyBindings({ myObservable: observable }, testNode);
            expect(testNode.childNodes[0].selectedIndex).toEqual(1);
            expect(observable()).toEqual('B');

            observable('A');
            expect(testNode.childNodes[0].selectedIndex).toEqual(0);
            expect(observable()).toEqual('A');
        });

        it('Should update selectedIndex when the model changes (value specified before options)', function() {
            var observable = new ko.observable('B');
            testNode.innerHTML = "<select data-bind='value:myObservable, options:[\"A\", \"B\"]'></select>";
            ko.applyBindings({ myObservable: observable }, testNode);
            expect(testNode.childNodes[0].selectedIndex).toEqual(1);
            expect(observable()).toEqual('B');

            observable('A');
            expect(testNode.childNodes[0].selectedIndex).toEqual(0);
            expect(observable()).toEqual('A');
        });

        it('Should display the caption when the model value changes to undefined, null, or \"\" when using \'options\' binding', function() {
            var observable = new ko.observable('B');
            testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], optionsCaption:\"Select...\", value:myObservable'></select>";
            ko.applyBindings({ myObservable: observable }, testNode);

            // Caption is selected when observable changed to undefined
            expect(testNode.childNodes[0].selectedIndex).toEqual(2);
            observable(undefined);
            expect(testNode.childNodes[0].selectedIndex).toEqual(0);

            // Caption is selected when observable changed to null
            observable("B");
            expect(testNode.childNodes[0].selectedIndex).toEqual(2);
            observable(null);
            expect(testNode.childNodes[0].selectedIndex).toEqual(0);

            // Caption is selected when observable changed to ""
            observable("B");
            expect(testNode.childNodes[0].selectedIndex).toEqual(2);
            observable("");
            expect(testNode.childNodes[0].selectedIndex).toEqual(0);

            // Also check that the selection doesn't change later (see https://github.com/knockout/knockout/issues/2218)
            waits(10);
            runs(function() {
                expect(testNode.childNodes[0].selectedIndex).toEqual(0);
            });
        });

        it('Should display the caption when the model value changes to undefined, null, or \"\" when options specified directly', function() {
            var observable = new ko.observable('B');
            testNode.innerHTML = "<select data-bind='value:myObservable'><option value=''>Select...</option><option>A</option><option>B</option></select>";
            ko.applyBindings({ myObservable: observable }, testNode);

            // Caption is selected when observable changed to undefined
            expect(testNode.childNodes[0].selectedIndex).toEqual(2);
            observable(undefined);
            expect(testNode.childNodes[0].selectedIndex).toEqual(0);

            // Caption is selected when observable changed to null
            observable("B");
            expect(testNode.childNodes[0].selectedIndex).toEqual(2);
            observable(null);
            expect(testNode.childNodes[0].selectedIndex).toEqual(0);

            // Caption is selected when observable changed to ""
            observable("B");
            expect(testNode.childNodes[0].selectedIndex).toEqual(2);
            observable("");
            expect(testNode.childNodes[0].selectedIndex).toEqual(0);
        });

        it('When size > 1, should unselect all options when value is undefined, null, or \"\"', function() {
            var observable = new ko.observable('B');
            testNode.innerHTML = "<select size='2' data-bind='options:[\"A\", \"B\"], value:myObservable'></select>";
            ko.applyBindings({ myObservable: observable }, testNode);

            // Nothing is selected when observable changed to undefined
            expect(testNode.childNodes[0].selectedIndex).toEqual(1);
            observable(undefined);
            expect(testNode.childNodes[0].selectedIndex).toEqual(-1);

            // Nothing is selected when observable changed to null
            observable("B");
            expect(testNode.childNodes[0].selectedIndex).toEqual(1);
            observable(null);
            expect(testNode.childNodes[0].selectedIndex).toEqual(-1);

            // Nothing is selected when observable changed to ""
            observable("B");
            expect(testNode.childNodes[0].selectedIndex).toEqual(1);
            observable("");
            expect(testNode.childNodes[0].selectedIndex).toEqual(-1);
        });

        it('Should update the model value when the UI is changed (setting it to undefined when the caption is selected)', function () {
            var observable = new ko.observable('B');
            testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], optionsCaption:\"Select...\", value:myObservable'></select>";
            ko.applyBindings({ myObservable: observable }, testNode);
            var dropdown = testNode.childNodes[0];

            dropdown.selectedIndex = 1;
            ko.utils.triggerEvent(dropdown, "change");
            expect(observable()).toEqual("A");

            dropdown.selectedIndex = 0;
            ko.utils.triggerEvent(dropdown, "change");
            expect(observable()).toEqual(undefined);
        });

        it('Should be able to associate option values with arbitrary objects (not just strings)', function() {
            var x = {}, y = {};
            var selectedValue = ko.observable(y);
            testNode.innerHTML = "<select data-bind='options: myOptions, value: selectedValue'></select>";
            var dropdown = testNode.childNodes[0];
            ko.applyBindings({ myOptions: [x, y], selectedValue: selectedValue }, testNode);

            // Check the UI displays the entry corresponding to the chosen value
            expect(dropdown.selectedIndex).toEqual(1);

            // Check that when we change the model value, the UI is updated
            selectedValue(x);
            expect(dropdown.selectedIndex).toEqual(0);

            // Check that when we change the UI, this changes the model value
            dropdown.selectedIndex = 1;
            ko.utils.triggerEvent(dropdown, "change");
            expect(selectedValue()).toEqual(y);
        });

        it('Should automatically initialize the model property to match the first option value if no option value matches the current model property value', function() {
            // The rationale here is that we always want the model value to match the option that appears to be selected in the UI
            //  * If there is *any* option value that equals the model value, we'd initalise the select box such that *that* option is the selected one
            //  * If there is *no* option value that equals the model value (often because the model value is undefined), we should set the model
            //    value to match an arbitrary option value to avoid inconsistency between the visible UI and the model
            var observable = new ko.observable(); // Undefined by default

            // Should work with options specified before value
            testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], value:myObservable'></select>";
            ko.applyBindings({ myObservable: observable }, testNode);
            expect(observable()).toEqual("A");

            // ... and with value specified before options
            ko.utils.domData.clear(testNode);
            testNode.innerHTML = "<select data-bind='value:myObservable, options:[\"A\", \"B\"]'></select>";
            observable(undefined);
            expect(observable()).toEqual(undefined);
            ko.applyBindings({ myObservable: observable }, testNode);
            expect(observable()).toEqual("A");
        });

        it('When non-empty, should reject model values that don\'t match any option value, resetting the model value to whatever is visibly selected in the UI', function() {
            var observable = new ko.observable('B');
            testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\", \"C\"], value:myObservable'></select>";
            ko.applyBindings({ myObservable: observable }, testNode);
            expect(testNode.childNodes[0].selectedIndex).toEqual(1);

            observable('D'); // This change should be rejected, as there's no corresponding option in the UI
            expect(observable()).toEqual('B');

            observable(null); // This change should also be rejected
            expect(observable()).toEqual('B');
        });

        it('Should support numerical option values, which are not implicitly converted to strings', function() {
            var observable = new ko.observable(30);
            testNode.innerHTML = "<select data-bind='options:[10,20,30,40], value:myObservable'></select>";
            ko.applyBindings({ myObservable: observable }, testNode);

            // First check that numerical model values will match a dropdown option
            expect(testNode.childNodes[0].selectedIndex).toEqual(2); // 3rd element, zero-indexed

            // Then check that dropdown options map back to numerical model values
            testNode.childNodes[0].selectedIndex = 1;
            ko.utils.triggerEvent(testNode.childNodes[0], "change");
            expect(typeof observable()).toEqual("number");
            expect(observable()).toEqual(20);
        });

        it('Should always use value (and not text) when options have value attributes', function() {
            var observable = new ko.observable('A');
            testNode.innerHTML = "<select data-bind='value:myObservable'><option value=''>A</option><option value='A'>B</option></select>";
            ko.applyBindings({ myObservable: observable }, testNode);
            var dropdown = testNode.childNodes[0];
            expect(dropdown.selectedIndex).toEqual(1);

            dropdown.selectedIndex = 0;
            ko.utils.triggerEvent(dropdown, "change");
            expect(observable()).toEqual("");
        });

        it('Should use text value when options have text values but no value attribute', function() {
            var observable = new ko.observable('B');
            testNode.innerHTML = "<select data-bind='value:myObservable'><option>A</option><option>B</option><option>C</option></select>";
            ko.applyBindings({ myObservable: observable }, testNode);
            var dropdown = testNode.childNodes[0];
            expect(dropdown.selectedIndex).toEqual(1);

            dropdown.selectedIndex = 0;
            ko.utils.triggerEvent(dropdown, "change");
            expect(observable()).toEqual("A");

            observable('C');
            expect(dropdown.selectedIndex).toEqual(2);
        });

        it('Should not throw an exception for value binding on multiple select boxes', function() {
            testNode.innerHTML = "<select data-bind=\"options: ['abc','def','ghi'], value: x\"></select><select data-bind=\"options: ['xyz','uvw'], value: x\"></select>";
            var observable = ko.observable();
            expect(function() {
                ko.applyBindings({ x: observable }, testNode);
            }).not.toThrow();
            expect(observable()).not.toBeUndefined();       // The spec doesn't specify which of the two possible values is actually set
        });

        it('Should update model value and selection when options change', function() {
            var observable = ko.observable("D");
            var options = ko.observableArray(["A", "B"]);
            testNode.innerHTML = "<select data-bind='options:myOptions, value:myObservable'></select>";
            ko.applyBindings({ myObservable: observable, myOptions: options }, testNode);

            // Observable is updated to match default selection (first option)
            expect(testNode.childNodes[0].selectedIndex).toEqual(0);
            expect(observable()).toEqual("A");

            // Replace with new options; observable is updated to match
            options(["B", "C"]);
            expect(testNode.childNodes[0].selectedIndex).toEqual(0);
            expect(observable()).toEqual("B");

            // Update with options that move the selection
            options(["A", "B"]);
            expect(testNode.childNodes[0].selectedIndex).toEqual(1);
            expect(observable()).toEqual("B");

            // Update back to options that remove the selection (default selected)
            options(["E", "F"]);
            expect(testNode.childNodes[0].selectedIndex).toEqual(0);
            expect(observable()).toEqual("E");
        });

        it('Should update model value and selection when changing observable option value', function() {
            var selected = ko.observable('B');
            var people = [
                { name: ko.observable('Annie'), id: ko.observable('A') },
                { name: ko.observable('Bert'), id: ko.observable('B') }
            ];
            testNode.innerHTML = "<select data-bind=\"options:people, optionsText:'name', optionsValue:'id', value:selected\"></select>";

            ko.applyBindings({people: people, selected: selected}, testNode);
            expect(testNode.childNodes[0].selectedIndex).toEqual(1);
            expect(testNode.childNodes[0]).toHaveTexts(["Annie", "Bert"]);
            expect(selected()).toEqual("B");

            // Changing an option name shouldn't change selection
            people[1].name("Charles");
            expect(testNode.childNodes[0].selectedIndex).toEqual(1);
            expect(testNode.childNodes[0]).toHaveTexts(["Annie", "Charles"]);
            expect(selected()).toEqual("B");

            // Changing the selected option value should reset selection
            people[1].id("C");
            expect(testNode.childNodes[0].selectedIndex).toEqual(0);
            expect(selected()).toEqual("A");
        });

        it('Should update model value and selection when contents change', function() {
            var observable = ko.observable("D");
            var options = ko.observableArray(["A", "B"]);
            testNode.innerHTML = "<select data-bind='value:myObservable, foreach: myOptions'><option data-bind='value: $data, text: $data'></option></select>";
            ko.applyBindings({ myObservable: observable, myOptions: options }, testNode);

            // Observable is updated to match default selection (first option)
            expect(testNode.childNodes[0].selectedIndex).toEqual(0);
            expect(observable()).toEqual("A");

            // Replace with new options; observable is updated to match
            options(["B", "C"]);
            expect(testNode.childNodes[0].selectedIndex).toEqual(0);
            expect(observable()).toEqual("B");

            // Update with options that move the selection
            options(["A", "B"]);
            expect(testNode.childNodes[0].selectedIndex).toEqual(1);
            expect(observable()).toEqual("B");

            // Update back to options that remove the selection (default selected)
            options(["E", "F"]);
            expect(testNode.childNodes[0].selectedIndex).toEqual(0);
            expect(observable()).toEqual("E");
        });

        it('Should set selection initially after contents are bound', function() {
            var observable = ko.observable("B");
            var options = ko.observableArray(["A", "B"]);
            testNode.innerHTML = "<select data-bind='value:myObservable'><!--ko foreach: myOptions--><option data-bind='value: $data, text: $data'></option><!--/ko--></select>";
            ko.applyBindings({ myObservable: observable, myOptions: options }, testNode);

            expect(testNode.childNodes[0].selectedIndex).toEqual(1);
            expect(observable()).toEqual("B");
        });

        it('Should update observable before subsequent change event handler', function () {
            // See https://github.com/knockout/knockout/issues/2530
            testNode.innerHTML = '<select data-bind="value: testId, event: { change: function() {$data.checkValue($element.value)} }"><option value="1">1</option><option value="2">2</option></select>';
            var checkedValue;
            var vm = {
                testId: ko.observable(1),
                checkValue: function (val) {
                    checkedValue = val;
                    expect(val).toEqual(vm.testId());
                }
            };
            ko.applyBindings(vm, testNode);

            testNode.childNodes[0].selectedIndex = 1;
            ko.utils.triggerEvent(testNode.childNodes[0], "change");
            expect(checkedValue).toEqual(vm.testId());
        });

        describe('Using valueAllowUnset option', function () {
            it('Should display the caption when the model value changes to undefined, null, or \"\" when using \'options\' binding', function() {
                var observable = ko.observable('B');
                testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], optionsCaption:\"Select...\", value:myObservable, valueAllowUnset:true'></select>";
                ko.applyBindings({ myObservable: observable }, testNode);
                var select = testNode.childNodes[0];

                select.selectedIndex = 2;
                observable(undefined);
                expect(select.selectedIndex).toEqual(0);

                select.selectedIndex = 2;
                observable(null);
                expect(select.selectedIndex).toEqual(0);

                select.selectedIndex = 2;
                observable("");
                expect(select.selectedIndex).toEqual(0);
            });

            it('Should display the caption when the model value changes to undefined, null, or \"\" when options specified directly', function() {
                var observable = ko.observable('B');
                testNode.innerHTML = "<select data-bind='value:myObservable, valueAllowUnset:true'><option value=''>Select...</option><option>A</option><option>B</option></select>";
                ko.applyBindings({ myObservable: observable }, testNode);
                var select = testNode.childNodes[0];

                select.selectedIndex = 2;
                observable(undefined);
                expect(select.selectedIndex).toEqual(0);

                select.selectedIndex = 2;
                observable(null);
                expect(select.selectedIndex).toEqual(0);

                select.selectedIndex = 2;
                observable("");
                expect(select.selectedIndex).toEqual(0);
            });

            it('Should display the caption when the model value changes to undefined after having no selection', function() {
                var observable = ko.observable('B');
                testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], optionsCaption:\"Select...\", value:myObservable, valueAllowUnset:true'></select>";
                ko.applyBindings({ myObservable: observable }, testNode);
                var select = testNode.childNodes[0];

                select.selectedIndex = -1;
                observable(undefined);
                expect(select.selectedIndex).toEqual(0);
            });

            it('Should select no option value if no option value matches the current model property value', function() {
                var observable = ko.observable();
                testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], value:myObservable, valueAllowUnset:true'></select>";
                ko.applyBindings({ myObservable: observable }, testNode);

                expect(testNode.childNodes[0].selectedIndex).toEqual(-1);
                expect(observable()).toEqual(undefined);
            });

            it('Should select no option value if model value does\'t match any option value', function() {
                var observable = ko.observable('B');
                testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\", \"C\"], value:myObservable, valueAllowUnset:true'></select>";
                ko.applyBindings({ myObservable: observable }, testNode);
                expect(testNode.childNodes[0].selectedIndex).toEqual(1);

                observable('D');
                expect(testNode.childNodes[0].selectedIndex).toEqual(-1);
            });

            it('Should maintain model value and update selection when options change', function() {
                var observable = ko.observable("D");
                var options = ko.observableArray(["A", "B"]);
                testNode.innerHTML = "<select data-bind='options:myOptions, value:myObservable, valueAllowUnset:true'></select>";
                ko.applyBindings({ myObservable: observable, myOptions: options }, testNode);

                // Initially nothing is selected because the value isn't in the options list
                expect(testNode.childNodes[0].selectedIndex).toEqual(-1);
                expect(observable()).toEqual("D");

                // Replace with new options that still don't contain the value
                options(["B", "C"]);
                expect(testNode.childNodes[0].selectedIndex).toEqual(-1);
                expect(observable()).toEqual("D");

                // Now update with options that do contain the value
                options(["C", "D"]);
                expect(testNode.childNodes[0].selectedIndex).toEqual(1);
                expect(observable()).toEqual("D");

                // Update back to options that don't contain the value
                options(["E", "F"]);
                expect(testNode.childNodes[0].selectedIndex).toEqual(-1);
                expect(observable()).toEqual("D");
            });

            it('Should maintain model value and update selection when changing observable option text or value', function() {
                var selected = ko.observable('B');
                var people = [
                    { name: ko.observable('Annie'), id: ko.observable('A') },
                    { name: ko.observable('Bert'), id: ko.observable('B') }
                ];
                testNode.innerHTML = "<select data-bind=\"options:people, optionsText:'name', optionsValue:'id', value:selected, valueAllowUnset:true\"></select>";

                ko.applyBindings({people: people, selected: selected}, testNode);
                expect(testNode.childNodes[0].selectedIndex).toEqual(1);
                expect(testNode.childNodes[0]).toHaveTexts(["Annie", "Bert"]);
                expect(selected()).toEqual("B");

                // Changing an option name shouldn't change selection
                people[1].name("Charles");
                expect(testNode.childNodes[0].selectedIndex).toEqual(1);
                expect(testNode.childNodes[0]).toHaveTexts(["Annie", "Charles"]);
                expect(selected()).toEqual("B");

                // Changing the selected option value should clear selection
                people[1].id("C");
                expect(testNode.childNodes[0].selectedIndex).toEqual(-1);
                expect(selected()).toEqual("B");

                // Changing an option name while nothing is selected won't select anything
                people[0].name("Amelia");
                expect(testNode.childNodes[0].selectedIndex).toEqual(-1);
                expect(selected()).toEqual("B");
            });

            it('Should maintain model value and update selection when contents change', function() {
                var observable = ko.observable("D");
                var options = ko.observableArray(["A", "B"]);
                testNode.innerHTML = "<select data-bind='value:myObservable, valueAllowUnset:true, foreach: myOptions'><option data-bind='value: $data, text: $data'></option></select>";
                ko.applyBindings({ myObservable: observable, myOptions: options }, testNode);

                // Initially nothing is selected because the value isn't in the options list
                expect(testNode.childNodes[0].selectedIndex).toEqual(-1);
                expect(observable()).toEqual("D");

                // Replace with new options that still don't contain the value
                options(["B", "C"]);
                expect(testNode.childNodes[0].selectedIndex).toEqual(-1);
                expect(observable()).toEqual("D");

                // Now update with options that do contain the value
                options(["C", "D"]);
                expect(testNode.childNodes[0].selectedIndex).toEqual(1);
                expect(observable()).toEqual("D");

                // Update back to options that don't contain the value
                options(["E", "F"]);
                expect(testNode.childNodes[0].selectedIndex).toEqual(-1);
                expect(observable()).toEqual("D");
            });

            it('Should select no options if model value is null and option value is 0', function() {
                var observable = ko.observable(null);
                var options = [
                    { name: 'B', id: 1 },
                    { name: 'A', id: 0 }
                ];
                testNode.innerHTML = "<select data-bind='options:options, optionsValue:\"id\", optionsText:\"name\", value:myObservable, valueAllowUnset:true'></select>";
                ko.applyBindings({ myObservable: observable, options: options }, testNode);

                expect(testNode.childNodes[0].selectedIndex).toEqual(-1);
                expect(observable()).toEqual(undefined);
            });
        });
    });

    describe('Acts like \'checkedValue\' on a checkbox or radio', function() {
        it('Should update value, but not respond to events when on a checkbox', function() {
            var observable = new ko.observable('B');
            testNode.innerHTML = "<input type='checkbox' data-bind='value: myObservable' />";
            ko.applyBindings({ myObservable: observable }, testNode);

            var checkbox = testNode.childNodes[0];
            expect(checkbox.value).toEqual('B');

            observable('C');
            expect(checkbox.value).toEqual('C');

            checkbox.value = 'D';
            ko.utils.triggerEvent(checkbox, "change");

            // observable does not update, as we are not handling events when on a checkbox/radio
            expect(observable()).toEqual('C');
        });

        it('Should update value, but not respond to events when on a radio', function() {
            var observable = new ko.observable('B');
            testNode.innerHTML = "<input type='radio' data-bind='value: myObservable' />";
            ko.applyBindings({ myObservable: observable }, testNode);

            var radio = testNode.childNodes[0];
            expect(radio.value).toEqual('B');

            observable('C');
            expect(radio.value).toEqual('C');

            radio.value = 'D';
            ko.utils.triggerEvent(radio, "change");

            // observable does not update, as we are not handling events when on a checkbox/radio
            expect(observable()).toEqual('C');
        });
    });
});