describe('Binding: TextInput', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should assign the value to the node', function () {
        testNode.innerHTML = "<input data-bind='textInput:123' />";
        ko.applyBindings(null, testNode);
        expect(testNode.childNodes[0].value).toEqual("123");
    });

    it('Should treat null values as empty strings', function () {
        testNode.innerHTML = "<input data-bind='textInput:myProp' />";
        ko.applyBindings({ myProp: ko.observable(0) }, testNode);
        expect(testNode.childNodes[0].value).toEqual("0");
    });

    it('Should assign an empty string as value if the model value is null', function () {
        testNode.innerHTML = "<input data-bind='textInput:(null)' />";
        ko.applyBindings(null, testNode);
        expect(testNode.childNodes[0].value).toEqual("");
    });

    it('Should assign an empty string as value if the model value is undefined', function () {
        testNode.innerHTML = "<input data-bind='textInput:undefined' />";
        ko.applyBindings(null, testNode);
        expect(testNode.childNodes[0].value).toEqual("");
    });

    it('For observable values, should unwrap the value and update on change', function () {
        var myobservable = new ko.observable(123);
        testNode.innerHTML = "<input data-bind='textInput:someProp' />";
        ko.applyBindings({ someProp: myobservable }, testNode);
        expect(testNode.childNodes[0].value).toEqual("123");
        myobservable(456);
        expect(testNode.childNodes[0].value).toEqual("456");
    });

    it('For observable values, should update on change if new value is \'strictly\' different from previous value', function() {
        var myobservable = new ko.observable("+123");
        testNode.innerHTML = "<input data-bind='textInput:someProp' />";
        ko.applyBindings({ someProp: myobservable }, testNode);
        expect(testNode.childNodes[0].value).toEqual("+123");
        myobservable(123);
        expect(testNode.childNodes[0].value).toEqual("123");
    });

    it('For writeable observable values, should catch the node\'s onchange and write values back to the observable', function () {
        var myobservable = new ko.observable(123);
        testNode.innerHTML = "<input data-bind='textInput:someProp' />";
        ko.applyBindings({ someProp: myobservable }, testNode);
        testNode.childNodes[0].value = "some user-entered value";
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        expect(myobservable()).toEqual("some user-entered value");
    });

    it('For writeable observable values, when model rejects change, update view to match', function () {
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

        testNode.innerHTML = "<input data-bind='textInput: valueForEditing' />";
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
        expect(testNode.childNodes[0].value).toEqual("1234a");

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

        testNode.innerHTML = "<input data-bind='textInput: prop' />";
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
        testNode.innerHTML = "<input data-bind='textInput: modelProperty123' />";
        ko.applyBindings(model, testNode);
        expect(testNode.childNodes[0].value).toEqual("456");

        testNode.childNodes[0].value = 789;
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        expect(model.modelProperty123).toEqual("789");
    });

    it('Should support alias "textinput"', function () {
        testNode.innerHTML = "<input data-bind='textinput:123' />";
        ko.applyBindings(null, testNode);
        expect(testNode.childNodes[0].value).toEqual("123");
    });

    it('Should write to non-observable property values using "textinput" alias', function () {
        var model = { modelProperty123: 456 };
        testNode.innerHTML = "<input data-bind='textinput: modelProperty123' />";
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
            "<input data-bind='textInput: getSetter().set' />" +
            "<input data-bind='textInput: getSetter()[\"set\"]' />" +
            "<input data-bind=\"textInput: getSetter()['set']\" />";
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
        testNode.innerHTML = "<input data-bind='textInput: myprop().subproperty' />";
        ko.applyBindings(model, testNode);
        expect(testNode.childNodes[0].value).toEqual("original value");

        model.myprop({ subproperty : newSubproperty }); // Note that myprop (and hence its subproperty) is changed *after* the bindings are applied
        testNode.childNodes[0].value = "Some new value";
        ko.utils.triggerEvent(testNode.childNodes[0], "change");

        // Verify that the change was written to the *new* subproperty, not the one referenced when the bindings were first established
        expect(newSubproperty()).toEqual("Some new value");
        expect(originalSubproperty()).toEqual("original value");
    });

    it('Should update observable on input event (on supported browsers) or propertychange event (on old IE)', function () {
        var myobservable = new ko.observable(123);
        testNode.innerHTML = "<input data-bind='textInput: someProp' />";
        ko.applyBindings({ someProp: myobservable }, testNode);
        expect(testNode.childNodes[0].value).toEqual("123");

        testNode.childNodes[0].value = "some user-entered value";   // setting the value triggers the propertychange event on IE
        if (!jasmine.ieVersion || jasmine.ieVersion >= 9) {
            ko.utils.triggerEvent(testNode.childNodes[0], "input");
        }
        if (jasmine.ieVersion === 9) {
            // IE 9 responds to the event asynchronously (see #1788)
            waitsFor(function () {
                return myobservable() === "some user-entered value";
            }, 50);
        } else {
            expect(myobservable()).toEqual("some user-entered value");
        }
    });

    it('Should write only changed values to observable', function () {
        var model = { writtenValue: '' };

        testNode.innerHTML = "<input data-bind='textInput: writtenValue' />";
        ko.applyBindings(model, testNode);

        testNode.childNodes[0].value = "1234";
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        expect(model.writtenValue).toEqual("1234");

        // trigger change event with the same value
        model.writtenValue = undefined;
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        expect(model.writtenValue).toBeUndefined();
    });

    if (typeof DEBUG != 'undefined' && DEBUG) {
        // The textInput binds to different events depending on the browser.
        // But the DEBUG version allows us to force it to bind to specific events for testing purposes.

        describe('Event processing', function () {
            beforeEach(function() {
                this.restoreAfter(ko.bindingHandlers.textInput, '_forceUpdateOn');
                ko.bindingHandlers.textInput._forceUpdateOn = ['afterkeydown'];
                jasmine.Clock.useMock();
            });

            it('Should update observable asynchronously', function () {
                var myobservable = new ko.observable("123");
                testNode.innerHTML = "<input data-bind='textInput:someProp' />";
                ko.applyBindings({ someProp: myobservable }, testNode);
                ko.utils.triggerEvent(testNode.childNodes[0], "keydown");
                testNode.childNodes[0].value = "some user-entered value";
                expect(myobservable()).toEqual("123");  // observable is not changed yet

                jasmine.Clock.tick(20);
                expect(myobservable()).toEqual("some user-entered value");  // it's changed after a delay
            });

            it('Should ignore "unchanged" notifications from observable during delayed event processing', function () {
                var myobservable = new ko.observable("123");
                testNode.innerHTML = "<input data-bind='textInput:someProp' />";
                ko.applyBindings({ someProp: myobservable }, testNode);
                ko.utils.triggerEvent(testNode.childNodes[0], "keydown");
                testNode.childNodes[0].value = "some user-entered value";

                // Notification of previous value (unchanged) is ignored
                myobservable.valueHasMutated();
                expect(testNode.childNodes[0].value).toEqual("some user-entered value");

                // Observable is updated to new element value
                jasmine.Clock.tick(20);
                expect(myobservable()).toEqual("some user-entered value");
            });

            it('Should not ignore actual change notifications from observable during delayed event processing', function () {
                var myobservable = new ko.observable("123");
                testNode.innerHTML = "<input data-bind='textInput:someProp' />";
                ko.applyBindings({ someProp: myobservable }, testNode);
                ko.utils.triggerEvent(testNode.childNodes[0], "keydown");
                testNode.childNodes[0].value = "some user-entered value";

                // New value is written to input element
                myobservable("some value from the server");
                expect(testNode.childNodes[0].value).toEqual("some value from the server");

                // New value remains when event is processed
                jasmine.Clock.tick(20);
                expect(myobservable()).toEqual("some value from the server");
            });

            it('Should update model property using earliest available event', function () {
                var model = { someProp: '123' };
                testNode.innerHTML = "<input data-bind='textInput:someProp' />";
                ko.applyBindings(model, testNode);

                ko.utils.triggerEvent(testNode.childNodes[0], "keydown");
                testNode.childNodes[0].value = "some user-entered value";
                ko.utils.triggerEvent(testNode.childNodes[0], "change");
                expect(model.someProp).toEqual("some user-entered value");  // it's changed immediately
                expect(testNode.childNodes[0]._ko_textInputProcessedEvent).toEqual("change");   // using the change event

                // even after a delay, the keydown event isn't processed
                model.someProp = undefined;
                jasmine.Clock.tick(20);
                expect(model.someProp).toBeUndefined();
                expect(testNode.childNodes[0]._ko_textInputProcessedEvent).toEqual("change");
            });
        });
    }
});
