describe('Binding: Selected Options', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should only be applicable to SELECT nodes', function () {
        var threw = false;
        testNode.innerHTML = "<input data-bind='selectedOptions:[]' />";
        try { ko.applyBindings({}, testNode); }
        catch (ex) { threw = true; }
        expect(threw).toEqual(true);
    });

    it('Should set selection in the SELECT node to match the model', function () {
        var bObject = {};
        var values = new ko.observableArray(["A", bObject, "C"]);
        var selection = new ko.observableArray([bObject]);
        testNode.innerHTML = "<select multiple='multiple' data-bind='options:myValues, selectedOptions:mySelection'></select>";
        ko.applyBindings({ myValues: values, mySelection: selection }, testNode);

        expect(testNode.childNodes[0]).toHaveSelectedValues([bObject]);
        selection.push("C");
        expect(testNode.childNodes[0]).toHaveSelectedValues([bObject, "C"]);
    });

    it('Should update the model when selection in the SELECT node changes', function () {
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

        expect(selection()).toEqual(["B"]);
        setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[0], true);
        setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[1], false);
        setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[2], true);
        ko.utils.triggerEvent(testNode.childNodes[0], "change");

        expect(selection()).toEqual(["A", cObject]);
        expect(selection()[1] === cObject).toEqual(true); // Also check with strict equality, because we don't want to falsely accept [object Object] == cObject
    });

    it('Should update the model when selection in the SELECT node changes for non-observable property values', function () {
        function setMultiSelectOptionSelectionState(optionElement, state) {
            // Workaround an IE 6 bug (http://benhollis.net/experiments/browserdemos/ie6-adding-options.html)
            if (/MSIE 6/i.test(navigator.userAgent))
                optionElement.setAttribute('selected', state);
            else
                optionElement.selected = state;
        }

        var cObject = {};
        var values = new ko.observableArray(["A", "B", cObject]);
        var selection = ["B"];
        var myModel = { myValues: values, mySelection: selection };
        testNode.innerHTML = "<select multiple='multiple' data-bind='options:myValues, selectedOptions:mySelection'></select>";
        ko.applyBindings(myModel, testNode);

        expect(myModel.mySelection).toEqual(["B"]);
        setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[0], true);
        setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[1], false);
        setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[2], true);
        ko.utils.triggerEvent(testNode.childNodes[0], "change");

        expect(myModel.mySelection).toEqual(["A", cObject]);
        expect(myModel.mySelection[1] === cObject).toEqual(true); // Also check with strict equality, because we don't want to falsely accept [object Object] == cObject
    });

    it('Should update the model when selection in the SELECT node inside an optgroup changes', function () {
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

        expect(selection()).toEqual([]);

        setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[0].childNodes[0], true);
        setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[0].childNodes[1], false);
        setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[0].childNodes[2], true);
        ko.utils.triggerEvent(testNode.childNodes[0], "change");

        expect(selection()).toEqual(['a', 'c']);
    });

    it('Should set selection in the SELECT node inside an optgroup to match the model', function () {
        var selection = new ko.observableArray(['a']);
        testNode.innerHTML = "<select multiple='multiple' data-bind='selectedOptions:mySelection'><optgroup label='group'><option value='a'>a-text</option><option value='b'>b-text</option><option value='c'>c-text</option></optgroup><optgroup label='group2'><option value='d'>d-text</option></optgroup></select>";
        ko.applyBindings({ mySelection: selection }, testNode);

        expect(testNode.childNodes[0].childNodes[0]).toHaveSelectedValues(['a']);
        expect(testNode.childNodes[0].childNodes[1]).toHaveSelectedValues([]);
        selection.push('c');
        expect(testNode.childNodes[0].childNodes[0]).toHaveSelectedValues(['a', 'c']);
        expect(testNode.childNodes[0].childNodes[1]).toHaveSelectedValues([]);
        selection.push('d');
        expect(testNode.childNodes[0].childNodes[0]).toHaveSelectedValues(['a', 'c']);
        expect(testNode.childNodes[0].childNodes[1]).toHaveSelectedValues(['d']);
    });

    it('Should not change the scroll position when updating the view', function() {
        var selection = ko.observableArray(), data = [];
        for (var i = 1; i < 101; i++) {
            data.push({ code: '0000' + i, name: 'Item ' + i });
        }

        testNode.innerHTML = "<select multiple=\"multiple\" data-bind=\"options: data, optionsText: 'name', optionsValue: 'code', selectedOptions: selectedItems\"></select>";
        ko.applyBindings({ selectedItems: selection, data: data }, testNode);

        var selectElem = testNode.childNodes[0];
        expect(selectElem.scrollTop).toBe(0);
        expect(selectElem).toHaveSelectedValues([]);

        selection.push('0000100');
        expect(selectElem.scrollTop).toBe(0);
        expect(selectElem).toHaveSelectedValues(['0000100']);

        selectElem.scrollTop = 80;
        var previousScrollTop = selectElem.scrollTop;   // some browsers modify the scrollTop right away
        selection.push('000050');
        expect(selectElem.scrollTop).toBe(previousScrollTop);
        expect(selectElem).toHaveSelectedValues(['000050', '0000100']);
    });

    it('Should update model value and selection when options change', function() {
        var selection = new ko.observableArray(["B"]);
        var options = ko.observableArray(["A", "B"]);
        testNode.innerHTML = "<select multiple='multiple' data-bind='options:myOptions, selectedOptions:mySelection'></select>";

        ko.applyBindings({ mySelection: selection, myOptions: options }, testNode);
        expect(testNode.childNodes[0]).toHaveSelectedValues(["B"]);
        expect(selection()).toEqual(["B"]);

        // Update with options that move the selection
        options(["B", "C"]);
        expect(testNode.childNodes[0]).toHaveSelectedValues(["B"]);
        expect(selection()).toEqual(["B"]);

        // Replace with new options; observable is updated
        options(["C", "D"]);
        expect(testNode.childNodes[0]).toHaveSelectedValues([]);
        expect(selection()).toEqual([]);
    });

    it('Should update model value and selection when changing observable option value', function() {
        var selection = new ko.observableArray(["B"]);
        var people = [
            { name: ko.observable('Annie'), id: ko.observable('A') },
            { name: ko.observable('Bert'), id: ko.observable('B') }
        ];
        testNode.innerHTML = "<select multiple='multiple' data-bind=\"options:people, optionsText:'name', optionsValue:'id', selectedOptions:mySelection\"></select>";

        ko.applyBindings({people: people, mySelection: selection}, testNode);
        expect(testNode.childNodes[0]).toHaveTexts(["Annie", "Bert"]);
        expect(testNode.childNodes[0]).toHaveSelectedValues(["B"]);
        expect(selection()).toEqual(["B"]);

        // Changing an option name shouldn't change selection
        people[1].name("Charles");
        expect(testNode.childNodes[0]).toHaveTexts(["Annie", "Charles"]);
        expect(testNode.childNodes[0]).toHaveSelectedValues(["B"]);
        expect(selection()).toEqual(["B"]);

        // Changing the selected option value should reset selection
        people[1].id("C");
        expect(testNode.childNodes[0]).toHaveSelectedValues([]);
        expect(selection()).toEqual([]);
    });

    it('Should update model value and selection when contents change', function() {
        var selection = new ko.observableArray(["B"]);
        var options = ko.observableArray(["A", "B"]);
        testNode.innerHTML = "<select multiple='multiple' data-bind='selectedOptions:mySelection, foreach: myOptions'><option data-bind='value: $data, text: $data'></option></select>";

        ko.applyBindings({ mySelection: selection, myOptions: options }, testNode);
        expect(testNode.childNodes[0]).toHaveSelectedValues(["B"]);
        expect(selection()).toEqual(["B"]);

        // Update with options that move the selection
        options(["B", "C"]);
        expect(testNode.childNodes[0]).toHaveSelectedValues(["B"]);
        expect(selection()).toEqual(["B"]);

        // Replace with new options; observable is updated
        options(["C", "D"]);
        expect(testNode.childNodes[0]).toHaveSelectedValues([]);
        expect(selection()).toEqual([]);
    });

    it('Should set selection initially after contents are bound', function() {
        var selection = new ko.observableArray(["B"]);
        var options = ko.observableArray(["A", "B"]);
        testNode.innerHTML = "<select multiple='multiple' data-bind='selectedOptions:mySelection'><!--ko foreach: myOptions--><option data-bind='value: $data, text: $data'></option><!--/ko--></select>";

        ko.applyBindings({ mySelection: selection, myOptions: options }, testNode);
        expect(testNode.childNodes[0]).toHaveSelectedValues(["B"]);
        expect(selection()).toEqual(["B"]);
    });
});