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

    it('Should retain selection when replacing the options data with new object that have the same "value"', function () {
        var observable = new ko.observableArray([{x:"A"}, {x:"B"}, {x:"C"}]);
        testNode.innerHTML = "<select data-bind='options:myValues, optionsValue:\"x\"' multiple='multiple'></select>";
        ko.applyBindings({ myValues: observable }, testNode);
        testNode.childNodes[0].options[1].selected = true;
        expect(testNode.childNodes[0]).toHaveSelectedValues(["B"]);
        observable([{x:"A"}, {x:"C"}, {x:"B"}]);
        expect(testNode.childNodes[0]).toHaveSelectedValues(["B"]);
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

        // Also show we can update the caption without affecting selection
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