describe('Binding: Options', {
    before_each: JSSpec.prepareTestNode,

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
        value_of(displayedValues).should_be(["6", "13"]);
    },

    'Should accept function in optionsText param to display subproperties of the model values': function() {
        var modelValues = new ko.observableArray([
            { name: 'bob', job: 'manager' },
            { name: 'frank', job: 'coder & tester' }
        ]);
        testNode.innerHTML = "<select data-bind='options:myValues, optionsText: function (v) { return v[\"name\"] + \" (\" + v[\"job\"] + \")\"; }'><option>should be deleted</option></select>";
        ko.applyBindings({ myValues: modelValues }, testNode);
        var displayedText = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.innerText || node.textContent; });
        value_of(displayedText).should_be(["bob (manager)", "frank (coder & tester)"]);
    },

    'Should accept a function in optionsValue param to select subproperties of the model values (and use that for the option text)': function() {
        var modelValues = new ko.observableArray([
            { name: 'bob', job: 'manager' },
            { name: 'frank', job: 'coder & tester' }
        ]);
        testNode.innerHTML = "<select data-bind='options: myValues, optionsValue: function (v) { return v.name + \" (\" + v.job + \")\"; }'><option>should be deleted</option></select>";
        ko.applyBindings({ myValues: modelValues }, testNode);
        var values = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.value; });
        value_of(values).should_be(["bob (manager)", "frank (coder & tester)"]);
        var displayedText = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.innerText || node.textContent; });
        value_of(displayedText).should_be(["bob (manager)", "frank (coder & tester)"]);
    },

    'Should exclude any items marked as destroyed': function() {
        var modelValues = new ko.observableArray([
            { name: 'bob', _destroy: true },
            { name: 'frank' }
        ]);
        testNode.innerHTML = "<select data-bind='options: myValues, optionsValue: \"name\"'></select>";
        ko.applyBindings({ myValues: modelValues }, testNode);
        var values = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.value; });
        value_of(values).should_be(["frank"]);
    },

    'Should include items marked as destroyed if optionsIncludeDestroyed is set': function() {
        var modelValues = new ko.observableArray([
            { name: 'bob', _destroy: true },
            { name: 'frank' }
        ]);
        testNode.innerHTML = "<select data-bind='options: myValues, optionsValue: \"name\", optionsIncludeDestroyed: true'></select>";
        ko.applyBindings({ myValues: modelValues }, testNode);
        var values = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.value; });
        value_of(values).should_be(["bob", "frank"]);
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
        value_of(testNode.childNodes[0]).should_have_selected_values(["B"]);
    },

    'Should place a caption at the top of the options list and display it when the model value is undefined': function() {
        testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], optionsCaption: \"Select one...\"'></select>";
        ko.applyBindings({}, testNode);
        var displayedOptions = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.innerHTML; });
        value_of(displayedOptions).should_be(["Select one...", "A", "B"]);
    },

    'Should allow the caption to be given by an observable, and update it when the model value changes (without affecting selection)': function() {
        var myCaption = ko.observable("Initial caption"),
            mySelectedValue = ko.observable("B");
        testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], optionsCaption: myCaption, value: mySelectedValue'></select>";
        ko.applyBindings({ myCaption: myCaption, mySelectedValue: mySelectedValue }, testNode);

        var displayedOptions = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.innerHTML; });
        value_of(testNode.childNodes[0].selectedIndex).should_be(2);
        value_of(mySelectedValue()).should_be("B");
        value_of(displayedOptions).should_be(["Initial caption", "A", "B"]);

        // Also show we can update the caption without affecting selection
        myCaption("New caption");
        var displayedOptions2 = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.innerHTML; });
        value_of(testNode.childNodes[0].selectedIndex).should_be(2);
        value_of(mySelectedValue()).should_be("B");
        value_of(displayedOptions2).should_be(["New caption", "A", "B"]);
    }
});