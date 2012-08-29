describe('Binding: Selected Options', {
    before_each: JSSpec.prepareTestNode,

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

        value_of(testNode.childNodes[0]).should_have_selected_values([bObject]);
        selection.push("C");
        value_of(testNode.childNodes[0]).should_have_selected_values([bObject, "C"]);
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
    },

    'Should set selection in the SELECT node inside an optgroup to match the model': function () {
        var selection = new ko.observableArray(['a']);
        testNode.innerHTML = "<select multiple='multiple' data-bind='selectedOptions:mySelection'><optgroup label='group'><option value='a'>a-text</option><option value='b'>b-text</option><option value='c'>c-text</option></optgroup><optgroup label='group2'><option value='d'>d-text</option></optgroup></select>";
        ko.applyBindings({ mySelection: selection }, testNode);

        value_of(testNode.childNodes[0].childNodes[0]).should_have_selected_values(['a']);
        value_of(testNode.childNodes[0].childNodes[1]).should_have_selected_values([]);
        selection.push('c');
        value_of(testNode.childNodes[0].childNodes[0]).should_have_selected_values(['a', 'c']);
        value_of(testNode.childNodes[0].childNodes[1]).should_have_selected_values([]);
        selection.push('d');
        value_of(testNode.childNodes[0].childNodes[0]).should_have_selected_values(['a', 'c']);
        value_of(testNode.childNodes[0].childNodes[1]).should_have_selected_values(['d']);
    }
});