
function prepareTestNode() {
    var existingNode = document.getElementById("testNode");
    if (existingNode != null)
        existingNode.parentNode.removeChild(existingNode);
    testNode = document.createElement("div");
    testNode.id = "testNode";
    document.body.appendChild(testNode);
}

function getSelectedValuesFromSelectNode(selectNode) {
    var selectedNodes = ko.utils.arrayFilter(selectNode.childNodes, function (node) { return node.selected; });
    return ko.utils.arrayMap(selectedNodes, function (node) { return ko.selectExtensions.readValue(node); });
}

describe('Binding: Enable/Disable', {
    before_each: prepareTestNode,

    'Enable means the node is enabled only when the value is true': function () {
        var observable = new ko.observable();
        testNode.innerHTML = "<input data-bind='enable:myModelProperty()' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);

        value_of(testNode.childNodes[0].disabled).should_be(true);
        observable(1);
        value_of(testNode.childNodes[0].disabled).should_be(false);
    },

    'Disable means the node is enabled only when the value is false': function () {
        var observable = new ko.observable();
        testNode.innerHTML = "<input data-bind='disable:myModelProperty()' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);

        value_of(testNode.childNodes[0].disabled).should_be(false);
        observable(1);
        value_of(testNode.childNodes[0].disabled).should_be(true);
    },

    'Enable should unwrap observables implicitly': function () {
        var observable = new ko.observable(false);
        testNode.innerHTML = "<input data-bind='enable:myModelProperty' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);
        value_of(testNode.childNodes[0].disabled).should_be(true);
    },

    'Disable should unwrap observables implicitly': function () {
        var observable = new ko.observable(false);
        testNode.innerHTML = "<input data-bind='disable:myModelProperty' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);
        value_of(testNode.childNodes[0].disabled).should_be(false);
    }
});

describe('Binding: Visible', {
    before_each: prepareTestNode,

    'Should display the node only when the value is true': function () {
        var observable = new ko.observable(false);
        testNode.innerHTML = "<input data-bind='visible:myModelProperty()' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);

        value_of(testNode.childNodes[0].style.display).should_be("none");
        observable(true);
        value_of(testNode.childNodes[0].style.display).should_be("");
    },

    'Should unwrap observables implicitly': function () {
        var observable = new ko.observable(false);
        testNode.innerHTML = "<input data-bind='visible:myModelProperty' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);
        value_of(testNode.childNodes[0].style.display).should_be("none");
    }
});

describe('Binding: Value', {
    before_each: prepareTestNode,

    'Should assign the value to the node': function () {
        testNode.innerHTML = "<input data-bind='value:123' />";
        ko.applyBindings(null, testNode);
        value_of(testNode.childNodes[0].value).should_be(123);
    },

    'For observable values, should unwrap the value and update on change': function () {
        var myobservable = new ko.observable(123);
        testNode.innerHTML = "<input data-bind='value:someProp' />";
        ko.applyBindings({ someProp: myobservable }, testNode);
        value_of(testNode.childNodes[0].value).should_be(123);
        myobservable(456);
        value_of(testNode.childNodes[0].value).should_be(456);
    },

    'For writeable observable values, should catch the node\'s onchange and write values back to the observable': function () {
        var myobservable = new ko.observable(123);
        testNode.innerHTML = "<input data-bind='value:someProp' />";
        ko.applyBindings({ someProp: myobservable }, testNode);
        testNode.childNodes[0].value = "some user-entered value";
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        value_of(myobservable()).should_be("some user-entered value");
    },

    'For non-observable property values, should catch the node\'s onchange and write values back to the property': function () {
        var model = { modelProperty: 123 };
        testNode.innerHTML = "<input data-bind='value: modelProperty' />";
        ko.applyBindings(model, testNode);
        value_of(testNode.childNodes[0].value).should_be(123);

        testNode.childNodes[0].value = 456;
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        value_of(model.modelProperty).should_be(456);
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
    
    'For select boxes, should update selectedIndex when the model changes': function() {
        var observable = new ko.observable('B');
        testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], value:myObservable'></select>";
        ko.applyBindings({ myObservable: observable }, testNode);
        value_of(testNode.childNodes[0].selectedIndex).should_be(1);
        observable('A');
        value_of(testNode.childNodes[0].selectedIndex).should_be(0);
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
    }
})

describe('Binding: Options', {
    before_each: prepareTestNode,

    // Todo: when the options list is populated, this should trigger a change event so that observers are notified of the new value (i.e., the default selection)

    'Should only be applicable to SELECT nodes': function () {
        var threw = false;
        testNode.innerHTML = "<input data-bind='options:{}' />";
        try { ko.applyBindings({}, testNode); }
        catch (ex) { threw = true; }
        value_of(threw).should_be(true);
    },

    'Should set the SELECT node\'s options set to match the model value': function () {
        var observable = new ko.observableArray(["A", "B", "C"]);
        testNode.innerHTML = "<select data-bind='options:myValues'><option>should be deleted</option></select>";
        ko.applyBindings({ myValues: observable }, testNode);
        var displayedOptions = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.innerHTML; });
        value_of(displayedOptions).should_be(["A", "B", "C"]);
    },

    'Should update the SELECT node\'s options if the model changes': function () {
        var observable = new ko.observableArray(["A", "B", "C"]);
        testNode.innerHTML = "<select data-bind='options:myValues'><option>should be deleted</option></select>";
        ko.applyBindings({ myValues: observable }, testNode);
        observable.splice(1, 1);
        var displayedOptions = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.innerHTML; });
        value_of(displayedOptions).should_be(["A", "C"]);
    },

    'Should retain as much selection as possible when changing the SELECT node\'s options': function () {
        var observable = new ko.observableArray(["A", "B", "C"]);
        testNode.innerHTML = "<select data-bind='options:myValues' multiple='multiple'><option>A</option><option selected='selected'>B</option><option selected='selected'>X</option></select>";
        ko.applyBindings({ myValues: observable }, testNode);
        value_of(getSelectedValuesFromSelectNode(testNode.childNodes[0])).should_be(["B"]);
    },
    
    'Should place a caption at the top of the options list and display it when the model value is undefined': function() {
        testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], optionsCaption: \"Select one...\"'></select>";
        ko.applyBindings({}, testNode);
        var displayedOptions = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.innerHTML; });        
        value_of(displayedOptions).should_be(["Select one...", "A", "B"]);
    }
});

describe('Binding: Selected Options', {
    before_each: prepareTestNode,

    'Should only be applicable to SELECT nodes': function () {
        var threw = false;
        testNode.innerHTML = "<input data-bind='selectedOptions:[]' />";
        try { ko.applyBindings({}, testNode); }
        catch (ex) { threw = true; }
        value_of(threw).should_be(true);
    },

    'Should set selection in the SELECT node to match the model': function () {
        var bObject = {};
        var values = new ko.observableArray(["A", bObject, "C"]);
        var selection = new ko.observableArray([bObject]);
        testNode.innerHTML = "<select multiple='multiple' data-bind='options:myValues, selectedOptions:mySelection'></select>";
        ko.applyBindings({ myValues: values, mySelection: selection }, testNode);

        value_of(getSelectedValuesFromSelectNode(testNode.childNodes[0])).should_be([bObject]);
        selection.push("C");
        value_of(getSelectedValuesFromSelectNode(testNode.childNodes[0])).should_be([bObject, "C"]);
    },

    'Should update the model when selection in the SELECT node changes': function () {
        var cObject = {};
        var values = new ko.observableArray(["A", "B", cObject]);
        var selection = new ko.observableArray(["B"]);
        testNode.innerHTML = "<select multiple='multiple' data-bind='options:myValues, selectedOptions:mySelection'></select>";
        ko.applyBindings({ myValues: values, mySelection: selection }, testNode);

        value_of(selection()).should_be(["B"]);
        testNode.childNodes[0].childNodes[0].selected = true;
        testNode.childNodes[0].childNodes[1].selected = false;
        testNode.childNodes[0].childNodes[2].selected = true;
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        
        value_of(selection()).should_be(["A", cObject]);
        value_of(selection()[1] === cObject).should_be(true); // Also check with strict equality, because we don't want to falsely accept [object Object] == cObject
    }
});

describe('Binding: Submit', {
    before_each: prepareTestNode,

    'Should invoke the supplied function on submit and prevent default action, using model as \'this\' param and the form node as a param to the handler': function () {
        var firstParamStored;
        var model = { wasCalled: false, doCall: function (firstParam) { this.wasCalled = true; firstParamStored = firstParam; } };
        testNode.innerHTML = "<form data-bind='submit:doCall' />";
        var formNode = testNode.childNodes[0];
        ko.applyBindings(model, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "submit");
        value_of(model.wasCalled).should_be(true);
        value_of(firstParamStored).should_be(formNode);
    }
});

describe('Binding: Click', {
    before_each: prepareTestNode,

    'Should invoke the supplied function on click, using model as \'this\' param': function () {
        var model = { wasCalled: false, doCall: function () { this.wasCalled = true; } };
        testNode.innerHTML = "<button data-bind='click:doCall'>hey</button>";
        ko.applyBindings(model, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        value_of(model.wasCalled).should_be(true);
    },

    'Should prevent default action': function () {
        testNode.innerHTML = "<a href='http://www.example.com/' data-bind='click: function() { }'>hey</button>";
        ko.applyBindings(null, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        // Assuming we haven't been redirected to http://www.example.com/, this spec has now passed
    }
});

describe('Binding: CSS class name', {
    before_each: prepareTestNode,

    'Should give the element the specific CSS class only when the specified value is true': function () {
        var observable1 = new ko.observable();
        var observable2 = new ko.observable(true);
        testNode.innerHTML = "<div class='unrelatedClass1 unrelatedClass2' data-bind='css: { myRule: someModelProperty, anotherRule: anotherModelProperty }'>Hallo</div>";
        ko.applyBindings({ someModelProperty: observable1, anotherModelProperty: observable2 }, testNode);

        value_of(testNode.childNodes[0].className).should_be("unrelatedClass1 unrelatedClass2 anotherRule");
        observable1(true);
        value_of(testNode.childNodes[0].className).should_be("unrelatedClass1 unrelatedClass2 anotherRule myRule");
        observable2(false);
        value_of(testNode.childNodes[0].className).should_be("unrelatedClass1 unrelatedClass2 myRule");
    }
});

describe('Binding: CSS style', {
    before_each: prepareTestNode,

    'Should give the element the specified CSS style value': function () {
        var myObservable = new ko.observable("red");
        testNode.innerHTML = "<div data-bind='style: { backgroundColor: colorValue }'>Hallo</div>";
        ko.applyBindings({ colorValue: myObservable }, testNode);

        value_of(testNode.childNodes[0].style.backgroundColor).should_be_one_of(["red", "#ff0000"]); // Opera returns style color values in #rrggbb notation, unlike other browsers
        myObservable("green");
        value_of(testNode.childNodes[0].style.backgroundColor).should_be_one_of(["green", "#008000"]);
        myObservable(undefined);
        value_of(testNode.childNodes[0].style.backgroundColor).should_be("");
    }
});

describe('Binding: Unique Name', {
    before_each: prepareTestNode,

    'Should apply a different name to each element': function () {
        testNode.innerHTML = "<div data-bind='uniqueName: true'></div><div data-bind='uniqueName: true'></div>";
        ko.applyBindings({}, testNode);

        value_of(testNode.childNodes[0].name.length > 0).should_be(true);
        value_of(testNode.childNodes[1].name.length > 0).should_be(true);
        value_of(testNode.childNodes[0].name == testNode.childNodes[1].name).should_be(false);
    }
});

describe('Binding: Checked', {
    before_each: prepareTestNode,

    'Should be able to control a checkbox\'s checked state': function () {
        var myobservable = new ko.observable(true);
        testNode.innerHTML = "<input type='checkbox' data-bind='checked:someProp' />";

        ko.applyBindings({ someProp: myobservable }, testNode);
        value_of(testNode.childNodes[0].checked).should_be(true);

        myobservable(false);
        value_of(testNode.childNodes[0].checked).should_be(false);
    },

    'Should update observable properties on the underlying model when the checkbox change event fires': function () {
        var myobservable = new ko.observable(false);
        testNode.innerHTML = "<input type='checkbox' data-bind='checked:someProp' />";
        ko.applyBindings({ someProp: myobservable }, testNode);

        testNode.childNodes[0].checked = true;
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        value_of(myobservable()).should_be(true);
    },

    'Should update non-observable properties on the underlying model when the checkbox change event fires': function () {
        var model = { someProp: false };
        testNode.innerHTML = "<input type='checkbox' data-bind='checked:someProp' />";
        ko.applyBindings(model, testNode);

        testNode.childNodes[0].checked = true;
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
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

        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        value_of(myobservable()).should_be("this radio button value");
    },

    'Should set a non-observable model property to this radio button\'s value when checked': function () {
        var model = { someProp: "another value" };
        testNode.innerHTML = "<input type='radio' value='this radio button value' data-bind='checked:someProp' />";
        ko.applyBindings(model, testNode);

        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        value_of(model.someProp).should_be("this radio button value");
    }
});