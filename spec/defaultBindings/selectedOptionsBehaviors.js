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
});