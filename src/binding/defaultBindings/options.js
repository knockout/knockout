function ensureDropdownSelectionIsConsistentWithModelValue(element, modelValue, preferModelValue) {
    if (preferModelValue) {
        if (modelValue !== ko.selectExtensions.readValue(element))
            ko.selectExtensions.writeValue(element, modelValue);
    }

    // No matter which direction we're syncing in, we want the end result to be equality between dropdown value and model value.
    // If they aren't equal, either we prefer the dropdown value, or the model value couldn't be represented, so either way,
    // change the model value to match the dropdown.
    if (modelValue !== ko.selectExtensions.readValue(element))
        ko.dependencyDetection.ignore(ko.utils.triggerEvent, null, [element, "change"]);
};

ko.bindingHandlers['options'] = {
    'update': function (element, valueAccessor, allBindingsAccessor) {
        if (ko.utils.tagNameLower(element) !== "select")
            throw new Error("options binding applies only to SELECT elements");

        var selectWasPreviouslyEmpty = element.length == 0;
        var previousSelectedValues = ko.utils.arrayMap(ko.utils.arrayFilter(element.childNodes, function (node) {
            return node.tagName && (ko.utils.tagNameLower(node) === "option") && node.selected;
        }), function (node) {
            return ko.selectExtensions.readValue(node) || node.innerText || node.textContent;
        });
        var previousScrollTop = element.scrollTop;

        var value = ko.utils.unwrapObservable(valueAccessor());
        var selectedValue = element.value;

        // Remove all existing <option>s.
        // Need to use .remove() rather than .removeChild() for <option>s otherwise IE behaves oddly (https://github.com/SteveSanderson/knockout/issues/134)
        while (element.length > 0) {
            ko.cleanNode(element.options[0]);
            element.remove(0);
        }

        if (value) {
            var allBindings = allBindingsAccessor(),
                includeDestroyed = allBindings['optionsIncludeDestroyed'];

            if (typeof value.length != "number")
                value = [value];
            if (allBindings['optionsCaption']) {
                var option = document.createElement("option");
                ko.utils.setHtml(option, allBindings['optionsCaption']);
                ko.selectExtensions.writeValue(option, undefined);
                element.appendChild(option);
            }

            for (var i = 0, j = value.length; i < j; i++) {
                // Skip destroyed items
                var arrayEntry = value[i];
                if (arrayEntry && arrayEntry['_destroy'] && !includeDestroyed)
                    continue;

                var option = document.createElement("option");

                function applyToObject(object, predicate, defaultValue) {
                    var predicateType = typeof predicate;
                    if (predicateType == "function")    // Given a function; run it against the data value
                        return predicate(object);
                    else if (predicateType == "string") // Given a string; treat it as a property name on the data value
                        return object[predicate];
                    else                                // Given no optionsText arg; use the data value itself
                        return defaultValue;
                }

                // Apply a value to the option element
                var optionValue = applyToObject(arrayEntry, allBindings['optionsValue'], arrayEntry);
                ko.selectExtensions.writeValue(option, ko.utils.unwrapObservable(optionValue));

                // Apply some text to the option element
                var optionText = applyToObject(arrayEntry, allBindings['optionsText'], optionValue);
                ko.utils.setTextContent(option, optionText);

                element.appendChild(option);
            }

            // IE6 doesn't like us to assign selection to OPTION nodes before they're added to the document.
            // That's why we first added them without selection. Now it's time to set the selection.
            var newOptions = element.getElementsByTagName("option");
            var countSelectionsRetained = 0;
            for (var i = 0, j = newOptions.length; i < j; i++) {
                if (ko.utils.arrayIndexOf(previousSelectedValues, ko.selectExtensions.readValue(newOptions[i])) >= 0) {
                    ko.utils.setOptionNodeSelectionState(newOptions[i], true);
                    countSelectionsRetained++;
                }
            }

            element.scrollTop = previousScrollTop;

            if (selectWasPreviouslyEmpty && ('value' in allBindings)) {
                // Ensure consistency between model value and selected option.
                // If the dropdown is being populated for the first time here (or was otherwise previously empty),
                // the dropdown selection state is meaningless, so we preserve the model value.
                ensureDropdownSelectionIsConsistentWithModelValue(element, ko.utils.peekObservable(allBindings['value']), /* preferModelValue */ true);
            }

            // Workaround for IE9 bug
            ko.utils.ensureSelectElementIsRenderedCorrectly(element);
        }
    }
};
ko.bindingHandlers['options'].optionValueDomDataKey = '__ko.optionValueDomData__';
