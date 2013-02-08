describe('Binding: Options', function() {
    beforeEach(jasmine.prepareTestNode);

    // Todo: when the options list is populated, this should trigger a change event so that observers are notified of the new value (i.e., the default selection)

    it('Should only be applicable to SELECT nodes', function () {
        var threw = false;
        testNode.innerHTML = "<input data-bind='options:{}' />";
        try { ko.applyBindings({}, testNode); }
        catch (ex) { threw = true; }
        expect(threw).toEqual(true);
    });

    it('Should set the SELECT node\'s options set to match the model value', function () {
        var observable = new ko.observableArray(["A", "B", "C"]);
        testNode.innerHTML = "<select data-bind='options:myValues'><option>should be deleted</option></select>";
        ko.applyBindings({ myValues: observable }, testNode);
        var displayedOptions = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.innerHTML; });
        expect(displayedOptions).toEqual(["A", "B", "C"]);
    });

    it('Should accept optionsText and optionsValue params to display subproperties of the model values', function() {
        var modelValues = new ko.observableArray([
            { name: 'bob', id: ko.observable(6) }, // Note that subproperties can be observable
            { name: ko.observable('frank'), id: 13 }
        ]);
        testNode.innerHTML = "<select data-bind='options:myValues, optionsText: \"name\", optionsValue: \"id\"'><option>should be deleted</option></select>";
        ko.applyBindings({ myValues: modelValues }, testNode);
        var displayedText = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.innerHTML; });
        var displayedValues = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.value; });
        expect(displayedText).toEqual(["bob", "frank"]);
        expect(displayedValues).toEqual(["6", "13"]);
    });

    it('Should accept function in optionsText param to display subproperties of the model values', function() {
        var modelValues = new ko.observableArray([
            { name: 'bob', job: 'manager' },
            { name: 'frank', job: 'coder & tester' }
        ]);
        testNode.innerHTML = "<select data-bind='options:myValues, optionsText: function (v) { return v[\"name\"] + \" (\" + v[\"job\"] + \")\"; }'><option>should be deleted</option></select>";
        ko.applyBindings({ myValues: modelValues }, testNode);
        var displayedText = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.innerText || node.textContent; });
        expect(displayedText).toEqual(["bob (manager)", "frank (coder & tester)"]);
    });

    it('Should accept a function in optionsValue param to select subproperties of the model values (and use that for the option text)', function() {
        var modelValues = new ko.observableArray([
            { name: 'bob', job: 'manager' },
            { name: 'frank', job: 'coder & tester' }
        ]);
        testNode.innerHTML = "<select data-bind='options: myValues, optionsValue: function (v) { return v.name + \" (\" + v.job + \")\"; }'><option>should be deleted</option></select>";
        ko.applyBindings({ myValues: modelValues }, testNode);
        var values = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.value; });
        expect(values).toEqual(["bob (manager)", "frank (coder & tester)"]);
        var displayedText = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.innerText || node.textContent; });
        expect(displayedText).toEqual(["bob (manager)", "frank (coder & tester)"]);
    });

    it('Should exclude any items marked as destroyed', function() {
        var modelValues = new ko.observableArray([
            { name: 'bob', _destroy: true },
            { name: 'frank' }
        ]);
        testNode.innerHTML = "<select data-bind='options: myValues, optionsValue: \"name\"'></select>";
        ko.applyBindings({ myValues: modelValues }, testNode);
        var values = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.value; });
        expect(values).toEqual(["frank"]);
    });

    it('Should include items marked as destroyed if optionsIncludeDestroyed is set', function() {
        var modelValues = new ko.observableArray([
            { name: 'bob', _destroy: true },
            { name: 'frank' }
        ]);
        testNode.innerHTML = "<select data-bind='options: myValues, optionsValue: \"name\", optionsIncludeDestroyed: true'></select>";
        ko.applyBindings({ myValues: modelValues }, testNode);
        var values = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.value; });
        expect(values).toEqual(["bob", "frank"]);
    });

    it('Should update the SELECT node\'s options if the model changes', function () {
        var observable = new ko.observableArray(["A", "B", "C"]);
        testNode.innerHTML = "<select data-bind='options:myValues'><option>should be deleted</option></select>";
        ko.applyBindings({ myValues: observable }, testNode);
        observable.splice(1, 1);
        var displayedOptions = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.innerHTML; });
        expect(displayedOptions).toEqual(["A", "C"]);
    });

    it('Should retain as much selection as possible when changing the SELECT node\'s options', function () {
        var observable = new ko.observableArray(["A", "B", "C"]);
        testNode.innerHTML = "<select data-bind='options:myValues' multiple='multiple'></select>";
        ko.applyBindings({ myValues: observable }, testNode);
        testNode.childNodes[0].options[1].selected = true;
        expect(testNode.childNodes[0]).toHaveSelectedValues(["B"]);
        observable.valueHasMutated();
        expect(testNode.childNodes[0]).toHaveSelectedValues(["B"]);
    });

    it('Should place a caption at the top of the options list and display it when the model value is undefined', function() {
        testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], optionsCaption: \"Select one...\"'></select>";
        ko.applyBindings({}, testNode);
        var displayedOptions = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.innerHTML; });
        expect(displayedOptions).toEqual(["Select one...", "A", "B"]);
    });

    it('Should allow the caption to be given by an observable, and update it when the model value changes (without affecting selection)', function() {
        var myCaption = ko.observable("Initial caption"),
            mySelectedValue = ko.observable("B");
        testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], optionsCaption: myCaption, value: mySelectedValue'></select>";
        ko.applyBindings({ myCaption: myCaption, mySelectedValue: mySelectedValue }, testNode);

        var displayedOptions = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.innerHTML; });
        expect(testNode.childNodes[0].selectedIndex).toEqual(2);
        expect(mySelectedValue()).toEqual("B");
        expect(displayedOptions).toEqual(["Initial caption", "A", "B"]);

        // Also show we can update the caption without affecting selection
        myCaption("New caption");
        var displayedOptions2 = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.innerHTML; });
        expect(testNode.childNodes[0].selectedIndex).toEqual(2);
        expect(mySelectedValue()).toEqual("B");
        expect(displayedOptions2).toEqual(["New caption", "A", "B"]);
    });
});