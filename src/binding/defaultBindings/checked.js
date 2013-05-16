(function() {

ko.bindingHandlers['checked'] = {
    'after': ['value', 'attr'],
    'init': function (element, valueAccessor, allBindings) {
        function checkedValue() {
            return allBindings['has']('checkedValue')
                ? ko.utils.unwrapObservable(allBindings.get('checkedValue'))
                : element.value;
        }

        function updateModel() {
            // This updates the model value from the view value.
            // It runs in response to DOM events (click) and changes in checkedValue.
            var isChecked = element.checked,
                elemValue = useCheckedValue ? checkedValue() : isChecked;

            if (shouldSet && (isCheckbox || isChecked)) {
                var modelValue = ko.dependencyDetection.ignore(valueAccessor);
                if (isValueArray) {
                    var valueMatch = (oldValue === elemValue);
                    // For checkboxes bound to an array, we add/remove the checkbox value to that array
                    // This works for both observable and non-observable arrays
                    if (valueMatch || isChecked)
                        ko.utils.addOrRemoveItem(modelValue, elemValue, isChecked);
                    // Remove the old value if it's different
                    if (!valueMatch && isChecked)
                        ko.utils.addOrRemoveItem(modelValue, oldValue, false);
                    oldValue = elemValue;
                } else {
                    ko.expressionRewriting.writeValueToProperty(modelValue, allBindings, 'checked', elemValue, true);
                }
            }
        };

        function updateView() {
            // This updates the view value from the model value.
            // It runs in response to changes in the bound (checked) value.
            var modelValue = ko.utils.unwrapObservable(valueAccessor()),
                elemValue = useCheckedValue && ko.dependencyDetection.ignore(checkedValue);
            if (isValueArray) {
                // When bound to an array, the checkbox being checked represents its value being present in that array
                element.checked = ko.utils.arrayIndexOf(modelValue, elemValue) >= 0;
            } else if (isCheckbox) {
                // When bound to any other value (not an array), the checkbox being checked represents the value being trueish
                element.checked = modelValue;
            } else {
                element.checked = (elemValue === modelValue);
            }
        };

        var isCheckbox = element.type == "checkbox",
            isRadio = element.type == "radio";

        // Only bind to check boxes and radio buttons
        if (!isCheckbox && !isRadio) {
            return;
        }

        var isValueArray = isCheckbox && (ko.utils.unwrapObservable(valueAccessor()) instanceof Array),
            oldValue = isValueArray ? checkedValue() : undefined,
            useCheckedValue = isRadio || isValueArray,
            shouldSet = false;

        // IE 6 won't allow radio buttons to be selected unless they have a name
        if (isRadio && !element.name)
            ko.bindingHandlers['uniqueName']['init'](element, function() { return true });

        // Set up two computeds to update the binding:

        // The first responds to changes in the checkedValue value and to element clicks
        ko.dependentObservable(updateModel, null, { disposeWhenNodeIsRemoved: element });
        ko.utils.registerEventHandler(element, "click", updateModel);

        // The second responds to changes in the checked value
        ko.dependentObservable(updateView, null, { disposeWhenNodeIsRemoved: element });

        shouldSet = true;
    }
};
ko.expressionRewriting.twoWayBindings['checked'] = true;

ko.bindingHandlers['checkedValue'] = {
    'update': function (element, valueAccessor) {
        element.value = ko.utils.unwrapObservable(valueAccessor());
    }
};

})();