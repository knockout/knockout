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

describe('Binding: Text', {
    before_each: prepareTestNode,

    'Should assign the value to the node, HTML-encoding the value': function () {    	
        var model = { textProp: "'Val <with> \"special\" <i>characters</i>'" };
        testNode.innerHTML = "<span data-bind='text:textProp'></span>";
        ko.applyBindings(model, testNode);
        value_of(testNode.childNodes[0].textContent || testNode.childNodes[0].innerText).should_be(model.textProp);
    },

    'Should assign an empty string as value if the model value is null': function () {
        testNode.innerHTML = "<span data-bind='text:(null)' ></span>";
        ko.applyBindings(null, testNode);
        var actualText = "textContent" in testNode.childNodes[0] ? testNode.childNodes[0].textContent : testNode.childNodes[0].innerText;
        value_of(actualText).should_be("");
    },
    
    'Should assign an empty string as value if the model value is undefined': function () {
        testNode.innerHTML = "<span data-bind='text:undefined' ></span>";
        ko.applyBindings(null, testNode);
        var actualText = "textContent" in testNode.childNodes[0] ? testNode.childNodes[0].textContent : testNode.childNodes[0].innerText;
        value_of(actualText).should_be("");
    }	    	
});

describe('Binding: HTML', {
    before_each: prepareTestNode,

    'Should assign the value to the node without HTML-encoding the value': function () {    	
        var model = { textProp: "My <span>HTML-containing</span> value" };
        testNode.innerHTML = "<span data-bind='html:textProp'></span>";
        ko.applyBindings(model, testNode);
        value_of(testNode.childNodes[0].innerHTML.toLowerCase()).should_be(model.textProp.toLowerCase());
        value_of(testNode.childNodes[0].childNodes[1].innerHTML).should_be("HTML-containing");
    },

    'Should assign an empty string as value if the model value is null': function () {
        testNode.innerHTML = "<span data-bind='html:(null)' ></span>";
        ko.applyBindings(null, testNode);
        value_of(testNode.childNodes[0].innerHTML).should_be("");
    },
    
    'Should assign an empty string as value if the model value is undefined': function () {
        testNode.innerHTML = "<span data-bind='html:undefined' ></span>";
        ko.applyBindings(null, testNode);
        value_of(testNode.childNodes[0].innerHTML).should_be("");
    },
    
    'Should be able to write arbitrary HTML, even if it is not semantically correct': function() {
        // Represents issue #98 (https://github.com/SteveSanderson/knockout/issues/98)
        // IE 8 and earlier is excessively strict about the use of .innerHTML - it throws
        // if you try to write a <P> tag inside an existing <P> tag, for example.
        var model = { textProp: "<p>hello</p><p>this isn't semantically correct</p>" };
        testNode.innerHTML = "<p data-bind='html:textProp'></p>";
        ko.applyBindings(model, testNode);
        value_of(testNode.childNodes[0]).should_contain_html(model.textProp);
    },
    
    'Should be able to write arbitrary HTML, including <tr> elements into tables': function() {
        // Some HTML elements are awkward, because the browser implicitly adds surrounding
        // elements, or won't allow those elements to be direct children of others.
        // The most common examples relate to tables.
        var model = { textProp: "<tr><td>hello</td></tr>" };
        testNode.innerHTML = "<table data-bind='html:textProp'></table>";
        ko.applyBindings(model, testNode);
        
        // Accept either of the following outcomes - there may or may not be an implicitly added <tbody>.
        var tr = testNode.childNodes[0].childNodes[0];
        if (tr.tagName == 'TBODY')
            tr = tr.childNodes[0];

        var td = tr.childNodes[0];

        value_of(tr.tagName).should_be("TR");
        value_of(td.tagName).should_be("TD");
        value_of('innerText' in td ? td.innerText : td.textContent).should_be("hello");
    }
});

describe('Binding: Value', {
    before_each: prepareTestNode,

    'Should assign the value to the node': function () {
        testNode.innerHTML = "<input data-bind='value:123' />";
        ko.applyBindings(null, testNode);
        value_of(testNode.childNodes[0].value).should_be(123);
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
        var model = { modelProperty123: 456 };
        testNode.innerHTML = "<input data-bind='value: modelProperty123' />";
        ko.applyBindings(model, testNode);
        value_of(testNode.childNodes[0].value).should_be(456);

        testNode.childNodes[0].value = 789;
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        value_of(model.modelProperty123).should_be(789);
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

    'On IE, should respond exactly once to "propertychange" followed by "blur" or "change" or both': function() {
        var isIE = navigator.userAgent.indexOf("MSIE") >= 0;

        if (isIE) {
            var myobservable = new ko.observable(123).extend({ notify: 'always' });
            var numUpdates = 0;
            myobservable.subscribe(function() { numUpdates++ });
            testNode.innerHTML = "<input data-bind='value:someProp' />";
            ko.applyBindings({ someProp: myobservable }, testNode);

            // First try change then blur
            testNode.childNodes[0].value = "some user-entered value";
            ko.utils.triggerEvent(testNode.childNodes[0], "propertychange");
            ko.utils.triggerEvent(testNode.childNodes[0], "change");
            value_of(myobservable()).should_be("some user-entered value");
            value_of(numUpdates).should_be(1);
            ko.utils.triggerEvent(testNode.childNodes[0], "blur");
            value_of(numUpdates).should_be(1);

            // Now try blur then change
            testNode.childNodes[0].value = "different user-entered value";
            ko.utils.triggerEvent(testNode.childNodes[0], "propertychange");
            ko.utils.triggerEvent(testNode.childNodes[0], "blur");
            value_of(myobservable()).should_be("different user-entered value");
            value_of(numUpdates).should_be(2);
            ko.utils.triggerEvent(testNode.childNodes[0], "change");
            value_of(numUpdates).should_be(2);
        }
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
    
    'Should accept optionsText and optionsValue params to display subproperties of the model values': function() {
        var modelValues = new ko.observableArray([
            { name: 'bob', id: ko.observable(6) }, // Note that subproperties can be observable
            { name: ko.observable('frank'), id: 13 }
        ]);	
        testNode.innerHTML = "<select data-bind='options:myValues, optionsText: \"name\", optionsValue: \"id\"'><option>should be deleted</option></select>";
        ko.applyBindings({ myValues: modelValues }, testNode);
        var displayedText = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.innerHTML; });	
        var displayedValues = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.value; });	
        value_of(displayedText).should_be(["bob", "frank"]);
        value_of(displayedValues).should_be([6, 13]);
    },

    'Should accept function in optionsText param to display subproperties of the model values': function() {
        var modelValues = new ko.observableArray([
            { name: 'bob', job: 'manager' }, 
            { name: 'frank', job: 'coder & tester' }
        ]);	
        testNode.innerHTML = "<select data-bind='options:myValues, optionsText: function (v) { return v[\"name\"] + \" (\" + v[\"job\"] + \")\"; }, optionsValue: \"id\"'><option>should be deleted</option></select>";
        ko.applyBindings({ myValues: modelValues }, testNode);
        var displayedText = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.innerText || node.textContent; });	
        value_of(displayedText).should_be(["bob (manager)", "frank (coder & tester)"]);
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
        function setMultiSelectOptionSelectionState(optionElement, state) {
            // Workaround an IE 6 bug (http://benhollis.net/experiments/browserdemos/ie6-adding-options.html)
            if (/MSIE 6/i.test(navigator.userAgent)) 
                optionElement.setAttribute('selected', state);
            else
                optionElement.selected = state;    			
        }
        
        var cObject = {};
        var values = new ko.observableArray(["A", "B", cObject]);
        var selection = new ko.observableArray(["B"]);
        testNode.innerHTML = "<select multiple='multiple' data-bind='options:myValues, selectedOptions:mySelection'></select>";
        ko.applyBindings({ myValues: values, mySelection: selection }, testNode);		

        value_of(selection()).should_be(["B"]);        
        setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[0], true);
        setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[1], false);
        setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[2], true);
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        
        value_of(selection()).should_be(["A", cObject]);
        value_of(selection()[1] === cObject).should_be(true); // Also check with strict equality, because we don't want to falsely accept [object Object] == cObject
    },

    'Should update the model when selection in the SELECT node inside an optgroup changes': function () {
        function setMultiSelectOptionSelectionState(optionElement, state) {
            // Workaround an IE 6 bug (http://benhollis.net/experiments/browserdemos/ie6-adding-options.html)
            if (/MSIE 6/i.test(navigator.userAgent)) 
                optionElement.setAttribute('selected', state);
            else
                optionElement.selected = state;             
        }

        var selection = new ko.observableArray([]);
        testNode.innerHTML = "<select multiple='multiple' data-bind='selectedOptions:mySelection'><optgroup label='group'><option value='a'>a-text</option><option value='b'>b-text</option><option value='c'>c-text</option></optgroup></select>";
        ko.applyBindings({ mySelection: selection }, testNode);

        value_of(selection()).should_be([]);

        setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[0].childNodes[0], true);
        setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[0].childNodes[1], false);
        setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[0].childNodes[2], true);
        ko.utils.triggerEvent(testNode.childNodes[0], "change");

        value_of(selection()).should_be(['a', 'c']);
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

describe('Binding: Event', {
    before_each: prepareTestNode,

    'Should invoke the supplied function when the event occurs, using model as \'this\' param and first arg, and event as second arg': function () {
        var model = { 
            firstWasCalled: false, 
            firstHandler: function (passedModel, evt) { 
                value_of(evt.type).should_be("click");
                value_of(this).should_be(model);
                value_of(passedModel).should_be(model);

                value_of(model.firstWasCalled).should_be(false);
                model.firstWasCalled = true; 
            },

            secondWasCalled: false, 
            secondHandler: function (passedModel, evt) {
                value_of(evt.type).should_be("mouseover");
                value_of(this).should_be(model);
                value_of(passedModel).should_be(model);

                value_of(model.secondWasCalled).should_be(false);
                model.secondWasCalled = true; 
            }
        };
        testNode.innerHTML = "<button data-bind='event:{click:firstHandler, mouseover:secondHandler, mouseout:null}'>hey</button>";
        ko.applyBindings(model, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        value_of(model.firstWasCalled).should_be(true);
        value_of(model.secondWasCalled).should_be(false);
        ko.utils.triggerEvent(testNode.childNodes[0], "mouseover");
        value_of(model.secondWasCalled).should_be(true);
        ko.utils.triggerEvent(testNode.childNodes[0], "mouseout"); // Shouldn't do anything (specifically, shouldn't throw)
    },

    'Should prevent default action': function () {
        testNode.innerHTML = "<a href='http://www.example.com/' data-bind='event: { click: function() { } }'>hey</button>";
        ko.applyBindings(null, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        // Assuming we haven't been redirected to http://www.example.com/, this spec has now passed
    },
    
    'Should let bubblable events bubble to parent elements by default': function() {
        var model = { 
            innerWasCalled: false, innerDoCall: function () { this.innerWasCalled = true; },
            outerWasCalled: false, outerDoCall: function () { this.outerWasCalled = true; }
        };
        testNode.innerHTML = "<div data-bind='event:{click:outerDoCall}'><button data-bind='event:{click:innerDoCall}'>hey</button></div>";
        ko.applyBindings(model, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], "click");
        value_of(model.innerWasCalled).should_be(true);    	
        value_of(model.outerWasCalled).should_be(true);    	
    },
    
    'Should be able to prevent bubbling of bubblable events using the (eventname)Bubble:false option': function() {
        var model = { 
            innerWasCalled: false, innerDoCall: function () { this.innerWasCalled = true; },
            outerWasCalled: false, outerDoCall: function () { this.outerWasCalled = true; }
        };
        testNode.innerHTML = "<div data-bind='event:{click:outerDoCall}'><button data-bind='event:{click:innerDoCall}, clickBubble:false'>hey</button></div>";
        ko.applyBindings(model, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], "click");
        value_of(model.innerWasCalled).should_be(true);    	
        value_of(model.outerWasCalled).should_be(false);    	
    },

    'Should be able to supply handler params using "bind" helper': function() {
        // Using "bind" like this just eliminates the function literal wrapper - it's purely stylistic
        var didCallHandler = false, someObj = {};
        var myHandler = function() {
            value_of(this).should_be(someObj);
            value_of(arguments.length).should_be(5);

            // First x args will be the ones you bound
            value_of(arguments[0]).should_be(123);
            value_of(arguments[1]).should_be("another");
            value_of(arguments[2].something).should_be(true);

            // Then you get the args we normally pass to handlers, i.e., the model then the event
            value_of(arguments[3]).should_be(viewModel);
            value_of(arguments[4].type).should_be("mouseover");

            didCallHandler = true;
        };
        testNode.innerHTML = "<button data-bind='event:{ mouseover: myHandler.bind(someObj, 123, \"another\", { something: true }) }'>hey</button>";
        var viewModel = { myHandler: myHandler, someObj: someObj };
        ko.applyBindings(viewModel, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "mouseover");
        value_of(didCallHandler).should_be(true);        
    }
});

describe('Binding: Click', {
    // This is just a special case of the "event" binding, so not necessary to respecify all its behaviours	
    before_each: prepareTestNode,

    'Should invoke the supplied function on click, using model as \'this\' param and first arg, and event as second arg': function () {
        var model = { 
            wasCalled: false, 
            doCall: function (arg1, arg2) { 
                this.wasCalled = true;
                value_of(arg1).should_be(model);
                value_of(arg2.type).should_be("click");
            } 
        };
        testNode.innerHTML = "<button data-bind='click:doCall'>hey</button>";
        ko.applyBindings(model, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        value_of(model.wasCalled).should_be(true);
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
    },
    
    'Should give the element a single CSS class without a leading space when the specified value is true': function() {
        var observable1 = new ko.observable();
        testNode.innerHTML = "<div data-bind='css: { myRule: someModelProperty }'>Hallo</div>";
        ko.applyBindings({ someModelProperty: observable1 }, testNode);

        value_of(testNode.childNodes[0].className).should_be("");
        observable1(true);
        value_of(testNode.childNodes[0].className).should_be("myRule");
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

describe('Binding: Attr', {
    before_each: prepareTestNode,
  
    'Should be able to set arbitrary attribute values': function() {
        var model = { myValue: "first value" };
        testNode.innerHTML = "<div data-bind='attr: {firstAttribute: myValue, \"second-attribute\": true}'></div>";
        ko.applyBindings(model, testNode);
        value_of(testNode.childNodes[0].getAttribute("firstAttribute")).should_be("first value");
        value_of(testNode.childNodes[0].getAttribute("second-attribute")).should_be("true");
    },
    
    'Should respond to changes in an observable value': function() {
        var model = { myprop : ko.observable("initial value") };
        testNode.innerHTML = "<div data-bind='attr: { someAttrib: myprop }'></div>";
        ko.applyBindings(model, testNode);
        value_of(testNode.childNodes[0].getAttribute("someAttrib")).should_be("initial value");
        
        // Change the observable; observe it reflected in the DOM
        model.myprop("new value");
        value_of(testNode.childNodes[0].getAttribute("someAttrib")).should_be("new value");
    },
    
    'Should remove the attribute if the value is strictly false, null, or undefined': function() {
        var model = { myprop : ko.observable() };
        testNode.innerHTML = "<div data-bind='attr: { someAttrib: myprop }'></div>";
        ko.applyBindings(model, testNode);
        ko.utils.arrayForEach([false, null, undefined], function(testValue) {
            model.myprop("nonempty value");
            value_of(testNode.childNodes[0].getAttribute("someAttrib")).should_be("nonempty value");	
            model.myprop(testValue);
            value_of(testNode.childNodes[0].getAttribute("someAttrib")).should_be(null);        
        });        
    },

    'Should be able to set class attribute and access it using className property': function() {
        var model = { myprop : ko.observable("newClass") };
        testNode.innerHTML = "<div class='oldClass' data-bind=\"attr: {'class': myprop}\"></div>";
        value_of(testNode.childNodes[0].className).should_be("oldClass");
        ko.applyBindings(model, testNode);
        value_of(testNode.childNodes[0].className).should_be("newClass");
        // Should be able to clear class also
        model.myprop(undefined);
        value_of(testNode.childNodes[0].className).should_be("");        
        value_of(testNode.childNodes[0].getAttribute("class")).should_be(null);        
    }  
});

describe('Binding: Hasfocus', {
    before_each: prepareTestNode,

    'Should respond to changes on an observable value by blurring or focusing the element': function() {
        var currentState;
        var model = { myVal: ko.observable() }
        testNode.innerHTML = "<input data-bind='hasfocus: myVal' /><input />";        
        ko.applyBindings(model, testNode);
        ko.utils.registerEventHandler(testNode.childNodes[0], "focusin", function() { currentState = true });
        ko.utils.registerEventHandler(testNode.childNodes[0], "focusout",  function() { currentState = false });

        // When the value becomes true, we focus
        model.myVal(true);
        value_of(currentState).should_be(true);

        // When the value becomes false, we blur
        model.myVal(false);
        value_of(currentState).should_be(false);        
    },    

    'Should set an observable value to be true on focus and false on blur': function() {
        var model = { myVal: ko.observable() }
        testNode.innerHTML = "<input data-bind='hasfocus: myVal' /><input />";
        ko.applyBindings(model, testNode);

        // Need to raise "focusin" and "focusout" manually, because simply calling ".focus()" and ".blur()"
        // in IE doesn't reliably trigger the "focus" and "blur" events synchronously
        
        ko.utils.triggerEvent(testNode.childNodes[0], "focusin");
        value_of(model.myVal()).should_be(true);

        // Move the focus elsewhere
        ko.utils.triggerEvent(testNode.childNodes[0], "focusout");
        value_of(model.myVal()).should_be(false);
    },

    'Should set a non-observable value to be true on focus and false on blur': function() {
        var model = { myVal: null }
        testNode.innerHTML = "<input data-bind='hasfocus: myVal' /><input />";
        ko.applyBindings(model, testNode);

        ko.utils.triggerEvent(testNode.childNodes[0], "focusin");
        value_of(model.myVal).should_be(true);

        // Move the focus elsewhere
        ko.utils.triggerEvent(testNode.childNodes[0], "focusout");
        value_of(model.myVal).should_be(false);        
    }
});

describe('Binding: If', {
    before_each: prepareTestNode,

    'Should remove descendant nodes from the document (and not bind them) if the value is falsey': function() {
        testNode.innerHTML = "<div data-bind='if: someItem'><span data-bind='text: someItem.nonExistentChildProp'></span></div>";
        value_of(testNode.childNodes[0].childNodes.length).should_be(1);
        ko.applyBindings({ someItem: null }, testNode);
        value_of(testNode.childNodes[0].childNodes.length).should_be(0);		
    },
    
    'Should leave descendant nodes in the document (and bind them) if the value is truey, independently of the active template engine': function() {		
        ko.setTemplateEngine(new ko.templateEngine()); // This template engine will just throw errors if you try to use it
        testNode.innerHTML = "<div data-bind='if: someItem'><span data-bind='text: someItem.existentChildProp'></span></div>";
        value_of(testNode.childNodes.length).should_be(1);
        ko.applyBindings({ someItem: { existentChildProp: 'Child prop value' } }, testNode);
        value_of(testNode.childNodes[0].childNodes.length).should_be(1);
        value_of(testNode.childNodes[0].childNodes[0]).should_contain_text("Child prop value");
    },
    
    'Should toggle the presence and bindedness of descendant nodes according to the truthiness of the value': function() {
        var someItem = ko.observable(undefined);
        testNode.innerHTML = "<div data-bind='if: someItem'><span data-bind='text: someItem().occasionallyExistentChildProp'></span></div>";
        ko.applyBindings({ someItem: someItem }, testNode);
        
        // First it's not there
        value_of(testNode.childNodes[0].childNodes.length).should_be(0);
        
        // Then it's there
        someItem({ occasionallyExistentChildProp: 'Child prop value' });
        value_of(testNode.childNodes[0].childNodes.length).should_be(1);
        value_of(testNode.childNodes[0].childNodes[0]).should_contain_text("Child prop value");
        
        // Then it's gone again
        someItem(null);
        value_of(testNode.childNodes[0].childNodes.length).should_be(0);
    },

    'Should not interfere with binding context': function() {
        testNode.innerHTML = "<div data-bind='if: true'>Parents: <span data-bind='text: $parents.length'></span></div>";
        ko.applyBindings({ }, testNode);
        value_of(testNode.childNodes[0]).should_contain_text("Parents: 0");
        value_of(ko.contextFor(testNode.childNodes[0].childNodes[1]).$parents.length).should_be(0);
    },
    
    'Should be able to define an \"if\" region using a containerless template': function() {
        var someitem = ko.observable(undefined);
        testNode.innerHTML = "hello <!-- ko if: someitem --><span data-bind=\"text: someitem().occasionallyexistentchildprop\"></span><!-- /ko --> goodbye";
        ko.applyBindings({ someitem: someitem }, testNode);
        
        // First it's not there
        value_of(testNode).should_contain_html("hello <!-- ko if: someitem --><!-- /ko --> goodbye");
        
        // Then it's there
        someitem({ occasionallyexistentchildprop: 'child prop value' });
        value_of(testNode).should_contain_html("hello <!-- ko if: someitem --><span data-bind=\"text: someitem().occasionallyexistentchildprop\">child prop value</span><!-- /ko --> goodbye");

        // Then it's gone again
        someitem(null);
        value_of(testNode).should_contain_html("hello <!-- ko if: someitem --><!-- /ko --> goodbye");
    },
    
    'Should be able to nest \"if\" regions defined by containerless templates': function() {
        var condition1 = ko.observable(false);
        var condition2 = ko.observable(false);
        testNode.innerHTML = "hello <!-- ko if: condition1 -->First is true<!-- ko if: condition2 -->Both are true<!-- /ko --><!-- /ko -->";
        ko.applyBindings({ condition1: condition1, condition2: condition2 }, testNode);

        // First neither are there
        value_of(testNode).should_contain_html("hello <!-- ko if: condition1 --><!-- /ko -->");

        // Make outer appear
        condition1(true);
        value_of(testNode).should_contain_html("hello <!-- ko if: condition1 -->first is true<!-- ko if: condition2 --><!-- /ko --><!-- /ko -->");

        // Make inner appear
        condition2(true);
        value_of(testNode).should_contain_html("hello <!-- ko if: condition1 -->first is true<!-- ko if: condition2 -->both are true<!-- /ko --><!-- /ko -->");
    } 
});

describe('Binding: Ifnot', {
    before_each: prepareTestNode,

    'Should remove descendant nodes from the document (and not bind them) if the value is truey': function() {
        testNode.innerHTML = "<div data-bind='ifnot: condition'><span data-bind='text: someItem.nonExistentChildProp'></span></div>";
        value_of(testNode.childNodes[0].childNodes.length).should_be(1);
        ko.applyBindings({ someItem: null, condition: true }, testNode);
        value_of(testNode.childNodes[0].childNodes.length).should_be(0);		
    },
    
    'Should leave descendant nodes in the document (and bind them) if the value is falsey, independently of the active template engine': function() {		
        ko.setTemplateEngine(new ko.templateEngine()); // This template engine will just throw errors if you try to use it
        testNode.innerHTML = "<div data-bind='ifnot: condition'><span data-bind='text: someItem.existentChildProp'></span></div>";
        value_of(testNode.childNodes.length).should_be(1);
        ko.applyBindings({ someItem: { existentChildProp: 'Child prop value' }, condition: false }, testNode);
        value_of(testNode.childNodes[0].childNodes.length).should_be(1);
        value_of(testNode.childNodes[0].childNodes[0]).should_contain_text("Child prop value");
    },
    
    'Should toggle the presence and bindedness of descendant nodes according to the falsiness of the value': function() {
        var someItem = ko.observable(undefined);
        var condition = ko.observable(true);
        testNode.innerHTML = "<div data-bind='ifnot: condition'><span data-bind='text: someItem().occasionallyExistentChildProp'></span></div>";
        ko.applyBindings({ someItem: someItem, condition: condition }, testNode);
        
        // First it's not there
        value_of(testNode.childNodes[0].childNodes.length).should_be(0);
        
        // Then it's there
        someItem({ occasionallyExistentChildProp: 'Child prop value' });
        condition(false);
        value_of(testNode.childNodes[0].childNodes.length).should_be(1);
        value_of(testNode.childNodes[0].childNodes[0]).should_contain_text("Child prop value");
        
        // Then it's gone again
        condition(true);
        someItem(null);
        value_of(testNode.childNodes[0].childNodes.length).should_be(0);
    },

    'Should not interfere with binding context': function() {
        testNode.innerHTML = "<div data-bind='ifnot: false'>Parents: <span data-bind='text: $parents.length'></span></div>";
        ko.applyBindings({ }, testNode);
        value_of(testNode.childNodes[0]).should_contain_text("Parents: 0");
        value_of(ko.contextFor(testNode.childNodes[0].childNodes[1]).$parents.length).should_be(0);
    }
});

describe('Binding: With', {
    before_each: prepareTestNode,

    'Should remove descendant nodes from the document (and not bind them) if the value is falsey': function() {
        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: someItem.nonExistentChildProp'></span></div>";
        value_of(testNode.childNodes[0].childNodes.length).should_be(1);
        ko.applyBindings({ someItem: null }, testNode);
        value_of(testNode.childNodes[0].childNodes.length).should_be(0);		
    },
    
    'Should leave descendant nodes in the document (and bind them in the context of the supplied value) if the value is truey': function() {		
        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: existentChildProp'></span></div>";
        value_of(testNode.childNodes.length).should_be(1);
        ko.applyBindings({ someItem: { existentChildProp: 'Child prop value' } }, testNode);
        value_of(testNode.childNodes[0].childNodes.length).should_be(1);
        value_of(testNode.childNodes[0].childNodes[0]).should_contain_text("Child prop value");
    },
    
    'Should toggle the presence and bindedness of descendant nodes according to the truthiness of the value, performing binding in the context of the value': function() {
        var someItem = ko.observable(undefined);
        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: occasionallyExistentChildProp'></span></div>";
        ko.applyBindings({ someItem: someItem }, testNode);
        
        // First it's not there
        value_of(testNode.childNodes[0].childNodes.length).should_be(0);
        
        // Then it's there
        someItem({ occasionallyExistentChildProp: 'Child prop value' });
        value_of(testNode.childNodes[0].childNodes.length).should_be(1);
        value_of(testNode.childNodes[0].childNodes[0]).should_contain_text("Child prop value");
        
        // Then it's gone again
        someItem(null);
        value_of(testNode.childNodes[0].childNodes.length).should_be(0);
    },
    
    'Should not bind the same elements more than once even if the supplied value notifies a change': function() {
        var countedClicks = 0;
        var someItem = ko.observable({
            childProp: ko.observable('Hello'),
            handleClick: function() { countedClicks++ }
        });
        
        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: childProp, click: handleClick'></span></div>";
        ko.applyBindings({ someItem: someItem }, testNode);
        
        // Initial state is one subscriber, one click handler
        value_of(testNode.childNodes[0].childNodes[0]).should_contain_text("Hello");
        value_of(someItem().childProp.getSubscriptionsCount()).should_be(1);
        ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], "click");
        value_of(countedClicks).should_be(1);
        
        // Force "update" binding handler to fire, then check we still have one subscriber...
        someItem.valueHasMutated();
        value_of(someItem().childProp.getSubscriptionsCount()).should_be(1);
        
        // ... and one click handler
        countedClicks = 0;
        ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], "click");
        value_of(countedClicks).should_be(1);		
    },
    
    'Should be able to access parent binding context via $parent': function() {
        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: $parent.parentProp'></span></div>";
        ko.applyBindings({ someItem: { }, parentProp: 'Parent prop value' }, testNode);
        value_of(testNode.childNodes[0].childNodes[0]).should_contain_text("Parent prop value");
    },
    
    'Should be able to access all parent binding contexts via $parents, and root context via $root': function() {
        testNode.innerHTML = "<div data-bind='with: topItem'>" +
                                "<div data-bind='with: middleItem'>" +
                                    "<div data-bind='with: bottomItem'>" +
                                        "<span data-bind='text: name'></span>" +
                                        "<span data-bind='text: $parent.name'></span>" +
                                        "<span data-bind='text: $parents[1].name'></span>" +
                                        "<span data-bind='text: $parents[2].name'></span>" +
                                        "<span data-bind='text: $root.name'></span>" +
                                    "</div>" +
                                "</div>" +
                              "</div>";
        ko.applyBindings({ 
            name: 'outer',
            topItem: {
                name: 'top',
                middleItem: { 
                    name: 'middle',
                    bottomItem: {
                        name: "bottom"
                    }
                }
            }
        }, testNode);
        var finalContainer = testNode.childNodes[0].childNodes[0].childNodes[0];
        value_of(finalContainer.childNodes[0]).should_contain_text("bottom");
        value_of(finalContainer.childNodes[1]).should_contain_text("middle");
        value_of(finalContainer.childNodes[2]).should_contain_text("top");
        value_of(finalContainer.childNodes[3]).should_contain_text("outer");
        value_of(finalContainer.childNodes[4]).should_contain_text("outer");

        // Also check that, when we later retrieve the binding contexts, we get consistent results
        value_of(ko.contextFor(testNode).$data.name).should_be("outer");
        value_of(ko.contextFor(testNode.childNodes[0]).$data.name).should_be("outer");
        value_of(ko.contextFor(testNode.childNodes[0].childNodes[0]).$data.name).should_be("top");
        value_of(ko.contextFor(testNode.childNodes[0].childNodes[0].childNodes[0]).$data.name).should_be("middle");
        value_of(ko.contextFor(testNode.childNodes[0].childNodes[0].childNodes[0].childNodes[0]).$data.name).should_be("bottom");
        var firstSpan = testNode.childNodes[0].childNodes[0].childNodes[0].childNodes[0];
        value_of(firstSpan.tagName).should_be("SPAN");
        value_of(ko.contextFor(firstSpan).$data.name).should_be("bottom");
        value_of(ko.contextFor(firstSpan).$root.name).should_be("outer");
        value_of(ko.contextFor(firstSpan).$parents[1].name).should_be("top");
    },
    
    'Should be able to define an \"with\" region using a containerless template': function() {
        var someitem = ko.observable(undefined);
        testNode.innerHTML = "hello <!-- ko with: someitem --><span data-bind=\"text: occasionallyexistentchildprop\"></span><!-- /ko --> goodbye";
        ko.applyBindings({ someitem: someitem }, testNode);
        
        // First it's not there
        value_of(testNode).should_contain_html("hello <!-- ko with: someitem --><!-- /ko --> goodbye");
        
        // Then it's there
        someitem({ occasionallyexistentchildprop: 'child prop value' });
        value_of(testNode).should_contain_html("hello <!-- ko with: someitem --><span data-bind=\"text: occasionallyexistentchildprop\">child prop value</span><!-- /ko --> goodbye");

        // Then it's gone again
        someitem(null);
        value_of(testNode).should_contain_html("hello <!-- ko with: someitem --><!-- /ko --> goodbye");
    },
    
    'Should be able to nest \"with\" regions defined by containerless templates': function() {
        testNode.innerHTML = "hello <!-- ko with: topitem -->" 
                               + "Got top: <span data-bind=\"text: topprop\"></span>" 
                               + "<!-- ko with: childitem -->"
                                   + "Got child: <span data-bind=\"text: childprop\"></span>"
                               + "<!-- /ko -->"
                           + "<!-- /ko -->";
        var viewModel = { topitem: ko.observable(null) };
        ko.applyBindings(viewModel, testNode);

        // First neither are there
        value_of(testNode).should_contain_html("hello <!-- ko with: topitem --><!-- /ko -->");

        // Make top appear
        viewModel.topitem({ topprop: 'property of top', childitem: ko.observable() });
        value_of(testNode).should_contain_html("hello <!-- ko with: topitem -->got top: <span data-bind=\"text: topprop\">property of top</span><!-- ko with: childitem --><!-- /ko --><!-- /ko -->");

        // Make child appear
        viewModel.topitem().childitem({ childprop: 'property of child' });
        value_of(testNode).should_contain_html("hello <!-- ko with: topitem -->got top: <span data-bind=\"text: topprop\">property of top</span><!-- ko with: childitem -->got child: <span data-bind=\"text: childprop\">property of child</span><!-- /ko --><!-- /ko -->");

        // Make top disappear
        viewModel.topitem(null);
        value_of(testNode).should_contain_html("hello <!-- ko with: topitem --><!-- /ko -->");
    }      
});

describe('Binding: Foreach', {
    before_each: prepareTestNode,

    'Should remove descendant nodes from the document (and not bind them) if the value is falsey': function() {
        testNode.innerHTML = "<div data-bind='foreach: someItem'><span data-bind='text: someItem.nonExistentChildProp'></span></div>";
        value_of(testNode.childNodes[0].childNodes.length).should_be(1);
        ko.applyBindings({ someItem: null }, testNode);
        value_of(testNode.childNodes[0].childNodes.length).should_be(0);		
    },

    'Should remove descendant nodes from the document (and not bind them) if the value is undefined': function() {
        testNode.innerHTML = "<div data-bind='foreach: someItem'><span data-bind='text: someItem.nonExistentChildProp'></span></div>";
        value_of(testNode.childNodes[0].childNodes.length).should_be(1);
        ko.applyBindings({ someItem: undefined }, testNode);
        value_of(testNode.childNodes[0].childNodes.length).should_be(0);        
    },    
    
    'Should duplicate descendant nodes for each value in the array value (and bind them in the context of that supplied value)': function() {		
        testNode.innerHTML = "<div data-bind='foreach: someItems'><span data-bind='text: childProp'></span></div>";
        var someItems = [
            { childProp: 'first child' },
            { childProp: 'second child' }
        ];
        ko.applyBindings({ someItems: someItems }, testNode);
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span>');
    },
    
    'Should be able to use $data to reference each array item being bound': function() {		
        testNode.innerHTML = "<div data-bind='foreach: someItems'><span data-bind='text: $data'></span></div>";
        var someItems = ['alpha', 'beta'];
        ko.applyBindings({ someItems: someItems }, testNode);
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: $data">alpha</span><span data-bind="text: $data">beta</span>');
    },
    
    
    'Should add and remove nodes to match changes in the bound array': function() {
        testNode.innerHTML = "<div data-bind='foreach: someItems'><span data-bind='text: childProp'></span></div>";
        var someItems = ko.observableArray([
            { childProp: 'first child' },
            { childProp: 'second child' }
        ]);
        ko.applyBindings({ someItems: someItems }, testNode);
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span>');

        // Add items at the beginning...
        someItems.unshift({ childProp: 'zeroth child' });
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">zeroth child</span><span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span>');
        
        // ... middle
        someItems.splice(2, 0, { childProp: 'middle child' });
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">zeroth child</span><span data-bind="text: childprop">first child</span><span data-bind="text: childprop">middle child</span><span data-bind="text: childprop">second child</span>');
        
        // ... and end
        someItems.push({ childProp: 'last child' });
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">zeroth child</span><span data-bind="text: childprop">first child</span><span data-bind="text: childprop">middle child</span><span data-bind="text: childprop">second child</span><span data-bind="text: childprop">last child</span>');
        
        // Also remove from beginning...
        someItems.shift();
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">middle child</span><span data-bind="text: childprop">second child</span><span data-bind="text: childprop">last child</span>');
        
        // ... and middle
        someItems.splice(1, 1);
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span><span data-bind="text: childprop">last child</span>');
        
        // ... and end
        someItems.pop();
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span>');
        
        // Also, marking as "destroy" should eliminate the item from display
        someItems.destroy(someItems()[0]);
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">second child</span>');
    },

    'Should remove all nodes corresponding to a removed array item, even if they were generated via containerless templates': function() {
        // Represents issue https://github.com/SteveSanderson/knockout/issues/185
        testNode.innerHTML = "<div data-bind='foreach: someitems'>a<!-- ko if:true -->b<!-- /ko --></div>";
        var someitems = ko.observableArray([1,2]);
        ko.applyBindings({ someitems: someitems }, testNode);
        value_of(testNode).should_contain_html('<div data-bind="foreach: someitems">a<!-- ko if:true -->b<!-- /ko -->a<!-- ko if:true -->b<!-- /ko --></div>');

        // Now remove items, and check the corresponding child nodes vanished
        someitems.splice(1, 1);
        value_of(testNode).should_contain_html('<div data-bind="foreach: someitems">a<!-- ko if:true -->b<!-- /ko --></div>');
    },

    'Should update all nodes corresponding to a changed array item, even if they were generated via containerless templates': function() {
        testNode.innerHTML = "<div data-bind='foreach: someitems'><!-- ko if:true --><span data-bind='text: $data'></span><!-- /ko --></div>";
        var someitems = [ ko.observable('A'), ko.observable('B') ];
        ko.applyBindings({ someitems: someitems }, testNode);
        value_of(testNode).should_contain_text('AB');

        // Now update an item
        someitems[0]('A2');
        value_of(testNode).should_contain_text('A2B');
    },    

    'Should be able to supply show "_destroy"ed items via includeDestroyed option': function() {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, includeDestroyed: true }'><span data-bind='text: childProp'></span></div>";
        var someItems = ko.observableArray([
            { childProp: 'first child' },
            { childProp: 'second child', _destroy: true }
        ]);
        ko.applyBindings({ someItems: someItems }, testNode);
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span>');
    },    	
    
    'Should be able to supply afterAdd and beforeRemove callbacks': function() {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, afterAdd: myAfterAdd, beforeRemove: myBeforeRemove }'><span data-bind='text: childprop'></span></div>";
        var someItems = ko.observableArray([{ childprop: 'first child' }]);
        var afterAddCallbackData = [], beforeRemoveCallbackData = [];
        ko.applyBindings({ 
            someItems: someItems,
            myAfterAdd: function(elem, index, value) { afterAddCallbackData.push({ elem: elem, index: index, value: value, currentParentClone: elem.parentNode.cloneNode(true) }) },
            myBeforeRemove: function(elem, index, value) { beforeRemoveCallbackData.push({ elem: elem, index: index, value: value, currentParentClone: elem.parentNode.cloneNode(true) }) }
        }, testNode);
        
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">first child</span>');
        
        // Try adding
        someItems.push({ childprop: 'added child'});
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">added child</span>');
        value_of(afterAddCallbackData.length).should_be(1);
        value_of(afterAddCallbackData[0].elem).should_be(testNode.childNodes[0].childNodes[1]);
        value_of(afterAddCallbackData[0].index).should_be(1);
        value_of(afterAddCallbackData[0].value.childprop).should_be("added child");
        value_of(afterAddCallbackData[0].currentParentClone).should_contain_html('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">added child</span>');

        // Try removing
        someItems.shift();
        value_of(beforeRemoveCallbackData.length).should_be(1);
        value_of(beforeRemoveCallbackData[0].elem).should_contain_text("first child");
        value_of(beforeRemoveCallbackData[0].index).should_be(0);
        value_of(beforeRemoveCallbackData[0].value.childprop).should_be("first child");
        // Note that when using "beforeRemove", we *don't* remove the node from the doc - it's up to the beforeRemove callback to do it. So, check it's still there.
        value_of(beforeRemoveCallbackData[0].currentParentClone).should_contain_html('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">added child</span>');
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">added child</span>');
    },

    'Should be able to nest foreaches and access binding contexts both during and after binding': function() {
        testNode.innerHTML = "<div data-bind='foreach: items'>"
                                + "<div data-bind='foreach: children'>"
                                    + "(Val: <span data-bind='text: $data'></span>, Parents: <span data-bind='text: $parents.length'></span>, Rootval: <span data-bind='text: $root.rootVal'></span>)"
                                + "</div>"
                           + "</div>";  
        var viewModel = {
            rootVal: 'ROOTVAL',
            items: ko.observableArray([
                { children: ko.observableArray(['A1', 'A2', 'A3']) },
                { children: ko.observableArray(['B1', 'B2']) }
            ])
        };        
        ko.applyBindings(viewModel, testNode);

        // Verify we can access binding contexts during binding
        value_of(testNode.childNodes[0].childNodes[0]).should_contain_text("(Val: A1, Parents: 2, Rootval: ROOTVAL)(Val: A2, Parents: 2, Rootval: ROOTVAL)(Val: A3, Parents: 2, Rootval: ROOTVAL)");
        value_of(testNode.childNodes[0].childNodes[1]).should_contain_text("(Val: B1, Parents: 2, Rootval: ROOTVAL)(Val: B2, Parents: 2, Rootval: ROOTVAL)");

        // Verify we can access them later
        var firstInnerTextNode = testNode.childNodes[0].childNodes[0].childNodes[1];
        value_of(firstInnerTextNode.nodeType).should_be(1); // The first span associated with A1
        value_of(ko.dataFor(firstInnerTextNode)).should_be("A1");
        value_of(ko.contextFor(firstInnerTextNode).$parent.children()[2]).should_be("A3");
        value_of(ko.contextFor(firstInnerTextNode).$parents[1].items()[1].children()[1]).should_be("B2");
        value_of(ko.contextFor(firstInnerTextNode).$root.rootVal).should_be("ROOTVAL");
    },

    'Should be able to define a \'foreach\' region using a containerless template': function() {       
        testNode.innerHTML = "hi <!-- ko foreach: someitems --><span data-bind='text: childprop'></span><!-- /ko -->";
        var someitems = [
            { childprop: 'first child' },
            { childprop: 'second child' }
        ];
        ko.applyBindings({ someitems: someitems }, testNode);
        value_of(testNode).should_contain_html('hi <!-- ko foreach: someitems --><span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span><!-- /ko -->');

        // Check we can recover the binding contexts
        value_of(ko.dataFor(testNode.childNodes[3]).childprop).should_be("second child");
        value_of(ko.contextFor(testNode.childNodes[3]).$parent.someitems.length).should_be(2);
    },
    
    'Should be able to nest \'foreach\' regions defined using containerless templates' : function() {
        var innerContents = document.createElement("DIV");
        testNode.innerHTML = "";
        testNode.appendChild(document.createComment("ko foreach: items"));
        testNode.appendChild(document.createComment(    "ko foreach: children"));
        innerContents.innerHTML =                           "(Val: <span data-bind='text: $data'></span>, Parents: <span data-bind='text: $parents.length'></span>, Rootval: <span data-bind='text: $root.rootVal'></span>)";
        while (innerContents.firstChild)
            testNode.appendChild(innerContents.firstChild);
        testNode.appendChild(document.createComment(    "/ko"));
        testNode.appendChild(document.createComment("/ko"));

        var viewModel = {
            rootVal: 'ROOTVAL',
            items: ko.observableArray([
                { children: ko.observableArray(['A1', 'A2', 'A3']) },
                { children: ko.observableArray(['B1', 'B2']) }
            ])
        };        
        ko.applyBindings(viewModel, testNode);

        // Verify we can access binding contexts during binding
        value_of(testNode).should_contain_text("(Val: A1, Parents: 2, Rootval: ROOTVAL)(Val: A2, Parents: 2, Rootval: ROOTVAL)(Val: A3, Parents: 2, Rootval: ROOTVAL)(Val: B1, Parents: 2, Rootval: ROOTVAL)(Val: B2, Parents: 2, Rootval: ROOTVAL)");

        // Verify we can access them later
        var firstInnerSpan = testNode.childNodes[3];
        value_of(firstInnerSpan).should_contain_text("A1"); // It is the first span bound in the context of A1
        value_of(ko.dataFor(firstInnerSpan)).should_be("A1");
        value_of(ko.contextFor(firstInnerSpan).$parent.children()[2]).should_be("A3");
        value_of(ko.contextFor(firstInnerSpan).$parents[1].items()[1].children()[1]).should_be("B2");
        value_of(ko.contextFor(firstInnerSpan).$root.rootVal).should_be("ROOTVAL");        
    },

    'Should be able to nest \'if\' inside \'foreach\' defined using containerless templates' : function() {
        testNode.innerHTML = "<ul></ul>";
        testNode.childNodes[0].appendChild(document.createComment("ko foreach: items"));
        testNode.childNodes[0].appendChild(document.createElement("li"));        
        testNode.childNodes[0].childNodes[1].innerHTML = "<span data-bind='text: childval.childprop'></span>";
        testNode.childNodes[0].childNodes[1].insertBefore(document.createComment("ko if: childval"), testNode.childNodes[0].childNodes[1].firstChild);
        testNode.childNodes[0].childNodes[1].appendChild(document.createComment("/ko"));
        testNode.childNodes[0].appendChild(document.createComment("/ko"));

        var viewModel = {
            items: [
                { childval: {childprop: 123 } },
                { childval: null },
                { childval: {childprop: 456 } }
            ]
        };        
        ko.applyBindings(viewModel, testNode);        

        value_of(testNode).should_contain_html('<ul>'
                                                + '<!--ko foreach: items-->'
                                                   + '<li>'
                                                      + '<!--ko if: childval-->'
                                                         + '<span data-bind="text: childval.childprop">123</span>'
                                                      + '<!--/ko-->'
                                                   + '</li>'
                                                   + '<li>'
                                                      + '<!--ko if: childval-->'
                                                      + '<!--/ko-->'
                                                   + '</li>'                                                   
                                                   + '<li>'
                                                      + '<!--ko if: childval-->'
                                                         + '<span data-bind="text: childval.childprop">456</span>'
                                                      + '<!--/ko-->'
                                                   + '</li>'
                                                + '<!--/ko-->'
                                             + '</ul>');
    },

    'Should be able to use containerless templates directly inside UL elements even when closing LI tags are omitted' : function() {
        // Represents issue https://github.com/SteveSanderson/knockout/issues/155
        // Certain closing tags, including </li> are optional (http://www.w3.org/TR/html5/syntax.html#syntax-tag-omission)
        // Most browsers respect your positioning of closing </li> tags, but IE <= 7 doesn't, and treats your markup
        // as if it was written as below:

        // Your actual markup: "<ul><li>Header item</li><!-- ko foreach: someitems --><li data-bind='text: $data'></li><!-- /ko --></ul>";
        // How IE <= 8 treats it:
        testNode.innerHTML =   "<ul><li>Header item<!-- ko foreach: someitems --><li data-bind='text: $data'><!-- /ko --></ul>";
        var viewModel = {
            someitems: [ 'Alpha', 'Beta' ]
        };
        ko.applyBindings(viewModel, testNode);

        // Either of the following two results are acceptable.
        try {
            // Modern browsers implicitly re-add the closing </li> tags
            value_of(testNode).should_contain_html('<ul><li>header item</li><!-- ko foreach: someitems --><li data-bind="text: $data">alpha</li><li data-bind="text: $data">beta</li><!-- /ko --></ul>');
        } catch(ex) {
            // ... but IE < 8 doesn't add ones that immediately precede a <li>
            value_of(testNode).should_contain_html('<ul><li>header item</li><!-- ko foreach: someitems --><li data-bind="text: $data">alpha<li data-bind="text: $data">beta</li><!-- /ko --></ul>');
        }
    },

    'Should be able to nest containerless templates directly inside UL elements, even on IE < 8 with its bizarre HTML parsing/formatting' : function() {
        // Represents https://github.com/SteveSanderson/knockout/issues/212
        // This test starts with the following DOM structure:
        //    <ul>
        //        <!-- ko foreach: ['A', 'B'] -->
        //        <!-- ko if: $data == 'B' -->
        //        <li data-bind='text: $data'>
        //            <!-- /ko -->
        //            <!-- /ko -->
        //        </li>
        //    </ul>
        // Note that:
        //   1. The closing comments are inside the <li> to simulate IE<8's weird parsing
        //   2. We have to build this with manual DOM operations, otherwise IE<8 will deform it in a different weird way
        // It would be a more authentic test if we could set up the scenario using .innerHTML and then let the browser do whatever parsing it does normally,
        // but unfortunately IE varies its weirdness according to whether it's really parsing an HTML doc, or whether you're using .innerHTML.

        testNode.innerHTML = "";
        testNode.appendChild(document.createElement("ul"));
        testNode.firstChild.appendChild(document.createComment("ko foreach: ['A', 'B']"));
        testNode.firstChild.appendChild(document.createComment("ko if: $data == 'B'"));
        testNode.firstChild.appendChild(document.createElement("li"));
        testNode.firstChild.lastChild.setAttribute("data-bind", "text: $data");
        testNode.firstChild.lastChild.appendChild(document.createComment("/ko"));
        testNode.firstChild.lastChild.appendChild(document.createComment("/ko"));

        ko.applyBindings(null, testNode);        
        value_of(testNode).should_contain_text("B");
    },    

    'Should be able to output HTML5 elements (even on IE<9, as long as you reference either innershiv.js or jQuery1.7+Modernizr)': function() {
        // Represents https://github.com/SteveSanderson/knockout/issues/194
        ko.utils.setHtml(testNode, "<div data-bind='foreach:someitems'><section data-bind='text: $data'></section></div>");
        var viewModel = {
            someitems: [ 'Alpha', 'Beta' ]
        };
        ko.applyBindings(viewModel, testNode);
        value_of(testNode).should_contain_html('<div data-bind="foreach:someitems"><section data-bind="text: $data">alpha</section><section data-bind="text: $data">beta</section></div>');
    },

    'Should be able to output HTML5 elements within container-less templates (same as above)': function() {
        // Represents https://github.com/SteveSanderson/knockout/issues/194
        ko.utils.setHtml(testNode, "<!-- ko foreach:someitems --><div><section data-bind='text: $data'></section></div><!-- /ko -->");
        var viewModel = {
            someitems: [ 'Alpha', 'Beta' ]
        };
        ko.applyBindings(viewModel, testNode);
        value_of(testNode).should_contain_html('<!-- ko foreach:someitems --><div><section data-bind="text: $data">alpha</section></div><div><section data-bind="text: $data">beta</section></div><!-- /ko -->');
    }
});