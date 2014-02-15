describe('Binding: Options', function() {
    beforeEach(jasmine.prepareTestNode);

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
        expect(testNode.childNodes[0]).toHaveTexts(["A", "B", "C"]);
    });

    it('Should accept optionsText and optionsValue params to display subproperties of the model values', function() {
        var modelValues = new ko.observableArray([
            { name: 'bob', id: ko.observable(6) }, // Note that subproperties can be observable
            { name: ko.observable('frank'), id: 13 }
        ]);
        testNode.innerHTML = "<select data-bind='options:myValues, optionsText: \"name\", optionsValue: \"id\"'><option>should be deleted</option></select>";
        ko.applyBindings({ myValues: modelValues }, testNode);
        expect(testNode.childNodes[0]).toHaveTexts(["bob", "frank"]);
        expect(testNode.childNodes[0]).toHaveValues(["6", "13"]);
    });

    it('Should accept function in optionsText param to display subproperties of the model values', function() {
        var modelValues = new ko.observableArray([
            { name: 'bob', job: 'manager' },
            { name: 'frank', job: 'coder & tester' }
        ]);
        testNode.innerHTML = "<select data-bind='options:myValues, optionsText: function (v) { return v[\"name\"] + \" (\" + v[\"job\"] + \")\"; }'><option>should be deleted</option></select>";
        ko.applyBindings({ myValues: modelValues }, testNode);
        expect(testNode.childNodes[0]).toHaveTexts(["bob (manager)", "frank (coder & tester)"]);
    });

    it('Should accept a function in optionsValue param to select subproperties of the model values (and use that for the option text)', function() {
        var modelValues = new ko.observableArray([
            { name: 'bob', job: 'manager' },
            { name: 'frank', job: 'coder & tester' }
        ]);
        testNode.innerHTML = "<select data-bind='options: myValues, optionsValue: function (v) { return v.name + \" (\" + v.job + \")\"; }'><option>should be deleted</option></select>";
        ko.applyBindings({ myValues: modelValues }, testNode);
        expect(testNode.childNodes[0]).toHaveValues(["bob (manager)", "frank (coder & tester)"]);
        expect(testNode.childNodes[0]).toHaveTexts(["bob (manager)", "frank (coder & tester)"]);
    });

    it('Should exclude any items marked as destroyed', function() {
        var modelValues = new ko.observableArray([
            { name: 'bob', _destroy: true },
            { name: 'frank' }
        ]);
        testNode.innerHTML = "<select data-bind='options: myValues, optionsValue: \"name\"'></select>";
        ko.applyBindings({ myValues: modelValues }, testNode);
        expect(testNode.childNodes[0]).toHaveValues(["frank"]);
    });

    it('Should include items marked as destroyed if optionsIncludeDestroyed is set', function() {
        var modelValues = new ko.observableArray([
            { name: 'bob', _destroy: true },
            { name: 'frank' }
        ]);
        testNode.innerHTML = "<select data-bind='options: myValues, optionsValue: \"name\", optionsIncludeDestroyed: true'></select>";
        ko.applyBindings({ myValues: modelValues }, testNode);
        expect(testNode.childNodes[0]).toHaveValues(["bob", "frank"]);
    });

    it('Should update the SELECT node\'s options if the model changes', function () {
        var observable = new ko.observableArray(["A", "B", "C"]);
        testNode.innerHTML = "<select data-bind='options:myValues'><option>should be deleted</option></select>";
        ko.applyBindings({ myValues: observable }, testNode);
        observable.splice(1, 1);
        expect(testNode.childNodes[0]).toHaveTexts(["A", "C"]);
    });

    it('Should retain as much selection as possible when changing the SELECT node\'s options', function () {
        var observable = new ko.observableArray(["A", "B", "C"]);
        testNode.innerHTML = "<select data-bind='options:myValues' multiple='multiple'></select>";
        ko.applyBindings({ myValues: observable }, testNode);
        testNode.childNodes[0].options[1].selected = true;
        expect(testNode.childNodes[0]).toHaveSelectedValues(["B"]);
        observable(["B", "C", "A"]);
        expect(testNode.childNodes[0]).toHaveSelectedValues(["B"]);
    });

    it('Should retain selection when replacing the options data with new objects that have the same "value"', function () {
        var observable = new ko.observableArray([{x:"A"}, {x:"B"}, {x:"C"}]);
        testNode.innerHTML = "<select data-bind='options:myValues, optionsValue:\"x\"' multiple='multiple'></select>";
        ko.applyBindings({ myValues: observable }, testNode);
        testNode.childNodes[0].options[1].selected = true;
        expect(testNode.childNodes[0]).toHaveSelectedValues(["B"]);
        observable([{x:"A"}, {x:"C"}, {x:"B"}]);
        expect(testNode.childNodes[0]).toHaveSelectedValues(["B"]);
    });

    it('Should select first option when removing the selected option and the original first option', function () {
        // This test failed in IE<=8 and Firefox without changes made in #1208
        testNode.innerHTML = '<select data-bind="options: filterValues, optionsText: \'x\', optionsValue: \'x\'">';
        var viewModel = {
            filterValues: ko.observableArray([{x:1},{x:2},{x:3}])
        };
        ko.applyBindings(viewModel, testNode);
        testNode.childNodes[0].options[1].selected = true;
        expect(testNode.childNodes[0]).toHaveSelectedValues([2]);

        viewModel.filterValues.splice(0, 2, {x:4});
        expect(testNode.childNodes[0]).toHaveSelectedValues([4]);
    });

    it('Should select caption by default and retain selection when adding multiple items', function () {
        // This test failed in IE<=8 without changes made in #1208
        testNode.innerHTML = '<select data-bind="options: filterValues, optionsCaption: \'foo\'">';
        var viewModel = {
            filterValues: ko.observableArray()
        };
        ko.applyBindings(viewModel, testNode);
        expect(testNode.childNodes[0]).toHaveSelectedValues([undefined]);
        var captionElement = testNode.childNodes[0].options[0];

        viewModel.filterValues.push("1");
        viewModel.filterValues.push("2");
        expect(testNode.childNodes[0]).toHaveSelectedValues([undefined]);

        // The option element for the caption is retained
        expect(testNode.childNodes[0].options[0]).toBe(captionElement);
    });

    it('Should trigger a change event when the options selection is populated or changed by modifying the options data (single select)', function() {
        var observable = new ko.observableArray(["A", "B", "C"]), changeHandlerFireCount = 0;
        testNode.innerHTML = "<select data-bind='options:myValues'></select>";
        ko.utils.registerEventHandler(testNode.childNodes[0], "change", function() {
            changeHandlerFireCount++;
        });
        ko.applyBindings({ myValues: observable }, testNode);
        expect(testNode.childNodes[0].selectedIndex).toEqual(0);
        expect(changeHandlerFireCount).toEqual(1);

        // Change the order of options; since selection is not changed, should not trigger change event
        observable(["B", "C", "A"]);
        expect(testNode.childNodes[0].selectedIndex).toEqual(2);
        expect(changeHandlerFireCount).toEqual(1);

        // Change to a new set of options; since selection is changed, should trigger change event
        observable(["D", "E"]);
        expect(testNode.childNodes[0].selectedIndex).toEqual(0);
        expect(changeHandlerFireCount).toEqual(2);

        // Delete all options; selection is changed (to nothing), so should trigger event
        observable([]);
        expect(testNode.childNodes[0].selectedIndex).toEqual(-1);
        expect(changeHandlerFireCount).toEqual(3);

        // Re-add options; should trigger change event
        observable([1, 2, 3]);
        expect(testNode.childNodes[0].selectedIndex).toEqual(0);
        expect(changeHandlerFireCount).toEqual(4);
    });

    it('Should trigger a change event when the options selection is changed by modifying the options data (multiple select)', function() {
        var observable = new ko.observableArray(["A", "B", "C"]), changeHandlerFireCount = 0;
        testNode.innerHTML = "<select data-bind='options:myValues' multiple='multiple'></select>";
        ko.utils.registerEventHandler(testNode.childNodes[0], "change", function() {
            changeHandlerFireCount++;
        });
        ko.applyBindings({ myValues: observable }, testNode);
        expect(changeHandlerFireCount).toEqual(0);  // Selection wasn't changed

        // Select the first item and change the order of options; since selection is not changed, should not trigger change event
        testNode.childNodes[0].options[0].selected = true;
        expect(testNode.childNodes[0]).toHaveSelectedValues(["A"]);
        observable(["B", "C", "A"]);
        expect(testNode.childNodes[0]).toHaveSelectedValues(["A"]);
        expect(changeHandlerFireCount).toEqual(0);

        // Select another item and then remove it from options; since selection is changed, should trigger change event
        testNode.childNodes[0].options[0].selected = true;
        expect(testNode.childNodes[0]).toHaveSelectedValues(["B","A"]);
        observable(["C", "A"]);
        expect(testNode.childNodes[0]).toHaveSelectedValues(["A"]);
        expect(changeHandlerFireCount).toEqual(1);

        // Change to a new set of options; since selection is changed (to nothing), should trigger change event
        observable(["D", "E"]);
        expect(testNode.childNodes[0]).toHaveSelectedValues([]);
        expect(changeHandlerFireCount).toEqual(2);

        // Delete all options; selection is not changed, so shouldn't trigger event
        observable([]);
        expect(changeHandlerFireCount).toEqual(2);

        // Set observable options and select them
        observable([ko.observable("X"), ko.observable("Y")]);
        expect(changeHandlerFireCount).toEqual(2);
        testNode.childNodes[0].options[0].selected = testNode.childNodes[0].options[1].selected = true;
        expect(testNode.childNodes[0]).toHaveSelectedValues(["X","Y"]);

        // Change the value of a selected item, which should deselect it and trigger a change event
        observable()[1]("Z");
        expect(testNode.childNodes[0]).toHaveSelectedValues(["X"]);
        expect(changeHandlerFireCount).toEqual(3);
    });

    it('Should place a caption at the top of the options list and display it when the model value is undefined', function() {
        testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], optionsCaption: \"Select one...\"'></select>";
        ko.applyBindings({}, testNode);
        expect(testNode.childNodes[0]).toHaveTexts(["Select one...", "A", "B"]);
    });

    it('Should not include the caption if the options value is null', function() {
        testNode.innerHTML = "<select data-bind='options: null, optionsCaption: \"Select one...\"'></select>";
        ko.applyBindings({}, testNode);
        expect(testNode.childNodes[0]).toHaveTexts([]);
    });

    it('Should not include the caption if the optionsCaption value is null', function() {
        testNode.innerHTML = "<select data-bind='options: [\"A\", \"B\"], optionsCaption: null'></select>";
        ko.applyBindings({}, testNode);
        expect(testNode.childNodes[0]).toHaveTexts(['A', 'B']);
    });

    it('Should not include the caption if the optionsCaption value is undefined', function() {
      testNode.innerHTML = "<select data-bind='options: [\"A\", \"B\"], optionsCaption: test'></select>";
      ko.applyBindings({ test: ko.observable() }, testNode);
      expect(testNode.childNodes[0]).toHaveTexts(['A', 'B']);
    });

    it('Should include a caption even if it\'s blank', function() {
        testNode.innerHTML = "<select data-bind='options: [\"A\",\"B\"], optionsCaption: \"\"'></select>";
        ko.applyBindings({}, testNode);
        expect(testNode.childNodes[0]).toHaveTexts(["", "A", "B"]);
    });

    it('Should allow the caption to be given by an observable, and update it when the model value changes (without affecting selection)', function() {
        var myCaption = ko.observable("Initial caption");
        testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], optionsCaption: myCaption'></select>";
        ko.applyBindings({ myCaption: myCaption }, testNode);

        testNode.childNodes[0].options[2].selected = true;
        expect(testNode.childNodes[0].selectedIndex).toEqual(2);
        expect(testNode.childNodes[0]).toHaveTexts(["Initial caption", "A", "B"]);

        // Show we can update the caption without affecting selection
        myCaption("New caption");
        expect(testNode.childNodes[0].selectedIndex).toEqual(2);
        expect(testNode.childNodes[0]).toHaveTexts(["New caption", "A", "B"]);

        // Show that caption will be removed if value is null
        myCaption(null);
        expect(testNode.childNodes[0].selectedIndex).toEqual(1);
        expect(testNode.childNodes[0]).toHaveTexts(["A", "B"]);
    });

    it('Should allow the option text to be given by an observable and update it when the model changes without affecting selection', function() {
        var people = [
            { name: ko.observable('Annie'), id: 'A' },
            { name: ko.observable('Bert'), id: 'B' }
        ];
        testNode.innerHTML = "<select data-bind=\"options: people, optionsText: 'name', optionsValue: 'id', optionsCaption: '-'\"></select>";
        ko.applyBindings({people: people}, testNode);
        testNode.childNodes[0].options[2].selected = true;

        expect(testNode.childNodes[0].selectedIndex).toEqual(2);
        expect(testNode.childNodes[0]).toHaveTexts(["-", "Annie", "Bert"]);

        // Also show we can update the text without affecting selection
        people[1].name("Bob");
        expect(testNode.childNodes[0].selectedIndex).toEqual(2);
        expect(testNode.childNodes[0]).toHaveTexts(["-", "Annie", "Bob"]);
    });

    it('Should call an optionsAfterRender callback function and not cause updates if an observable accessed in the callback is changed', function () {
        testNode.innerHTML = "<select data-bind=\"options: someItems, optionsText: 'childprop', optionsAfterRender: callback\"></select>";
        var callbackObservable = ko.observable(1),
            someItems = ko.observableArray([{ childprop: 'first child' }]),
            callbacks = 0;
        ko.applyBindings({ someItems: someItems, callback: function() { callbackObservable(); callbacks++; } }, testNode);
        expect(callbacks).toEqual(1);

        // Change the array, but don't update the observableArray so that the options binding isn't updated
        someItems().push({ childprop: 'hidden child'});
        expect(testNode.childNodes[0]).toContainText('first child');
        // Update callback observable and check that the binding wasn't updated
        callbackObservable(2);
        expect(testNode.childNodes[0]).toContainText('first child');
        // Update the observableArray and verify that the binding is now updated
        someItems.valueHasMutated();
        expect(testNode.childNodes[0]).toContainText('first childhidden child');
        expect(callbacks).toEqual(2);
    });
});