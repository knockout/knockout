/// <reference path="bindingAttributeSyntax.js" />

ko.bindingHandlers.click = {
    init: function (element, value, allBindings, viewModel) {
        ko.utils.registerEventHandler(element, "click", function (event) {
            try { value.call(viewModel); }
            finally {
                if (event.preventDefault)
                    event.preventDefault();
                else
                    event.returnValue = false;
            }
        });
    }
};

ko.bindingHandlers.submit = {
    init: function (element, value, allBindings, viewModel) {
        if (typeof value != "function")
            throw new Error("The value for a submit binding must be a function to invoke on submit");
        ko.utils.registerEventHandler(element, "submit", function (event) {
            try { value.call(viewModel, element); }
            finally {
                if (event.preventDefault)
                    event.preventDefault();
                else
                    event.returnValue = false;
            }
        });
    }
};

ko.bindingHandlers.visible = {
    update: function (element, value) {
        value = ko.utils.unwrapObservable(value);
        var isCurrentlyVisible = !(element.style.display == "none");
        if (value && !isCurrentlyVisible)
            element.style.display = "";
        else if ((!value) && isCurrentlyVisible)
            element.style.display = "none";
    }
}

ko.bindingHandlers.enable = {
    update: function (element, value) {
        value = ko.utils.unwrapObservable(value);
        if (value && element.disabled)
            element.removeAttribute("disabled");
        else if ((!value) && (!element.disabled))
            element.disabled = true;
    }
};

ko.bindingHandlers.disable = { update: function (element, value) { ko.bindingHandlers.enable.update(element, !ko.utils.unwrapObservable(value)); } };

ko.bindingHandlers.value = {
    init: function (element, value, allBindings) {
        var eventName = allBindings.valueUpdate || "change";
        if (ko.isWriteableObservable(value))
            ko.utils.registerEventHandler(element, eventName, function () { 
                value(ko.selectExtensions.readValue(this)); 
            });
        else if (allBindings._ko_property_writers && allBindings._ko_property_writers.value)
            ko.utils.registerEventHandler(element, eventName, function () { 
                allBindings._ko_property_writers.value(ko.selectExtensions.readValue(this)); 
            });
    },
    update: function (element, value) {
        var newValue = ko.utils.unwrapObservable(value);
        if (newValue != ko.selectExtensions.readValue(element)) {
            var applyValueAction = function () { ko.selectExtensions.writeValue(element, newValue); };
            applyValueAction();

            // Workaround for IE6 bug: It won't reliably apply values to SELECT nodes during the same execution thread
            // right after you've changed the set of OPTION nodes on it. So for that node type, we'll schedule a second thread
            // to apply the value as well.
            var alsoApplyAsynchronously = element.tagName == "SELECT";
            if (alsoApplyAsynchronously)
                setTimeout(applyValueAction, 0);
        }
    }
};

ko.bindingHandlers.options = {
    update: function (element, value, allBindings) {
        if (element.tagName != "SELECT")
            throw new Error("options binding applies only to SELECT elements");

        var previousSelectedValues = ko.utils.arrayMap(ko.utils.arrayFilter(element.childNodes, function (node) {
            return node.tagName && node.tagName == "OPTION" && node.selected;
        }), function (node) {
            return ko.selectExtensions.readValue(node) || node.innerText || node.textContent;
        });

        value = ko.utils.unwrapObservable(value);
        var selectedValue = element.value;
        ko.utils.emptyDomNode(element);

        if (value) {
            if (typeof value.length != "number")
                value = [value];
            if (allBindings.optionsCaption) {
                var option = document.createElement("OPTION");
                option.innerHTML = allBindings.optionsCaption;
                ko.selectExtensions.writeValue(option, undefined);
                element.appendChild(option);
            }
            for (var i = 0, j = value.length; i < j; i++) {
                var option = document.createElement("OPTION");
                var optionValue = typeof allBindings.optionsValue == "string" ? value[i][allBindings.optionsValue] : value[i];
                if (typeof optionValue == 'object')
                    ko.selectExtensions.writeValue(option, optionValue);
                else
                    option.value = optionValue.toString();
                option.innerHTML = (typeof allBindings.optionsText == "string" ? value[i][allBindings.optionsText] : optionValue).toString();
                element.appendChild(option);
            }

            // IE6 doesn't like us to assign selection to OPTION nodes before they're added to the document.
            // That's why we first added them without selection. Now it's time to set the selection.
            var newOptions = element.getElementsByTagName("OPTION");
            var countSelectionsRetained = 0;
            for (var i = 0, j = newOptions.length; i < j; i++) {
                if (ko.utils.arrayIndexOf(previousSelectedValues, ko.selectExtensions.readValue(newOptions[i])) >= 0) {
                    ko.utils.setOptionNodeSelectionState(newOptions[i], true);
                    countSelectionsRetained++;
                }
            }
        }
    }
};
ko.bindingHandlers.options.optionValueDomDataKey = '__ko.bindingHandlers.options.optionValueDomData__';

ko.bindingHandlers.selectedOptions = {
    getSelectedValuesFromSelectNode: function (selectNode) {
        var result = [];
        var nodes = selectNode.childNodes;
        for (var i = 0, j = nodes.length; i < j; i++) {
            var node = nodes[i];
            if ((node.tagName == "OPTION") && node.selected)
                result.push(ko.selectExtensions.readValue(node));
        }
        return result;
    },
    init: function (element, value, allBindings) {
        if (ko.isWriteableObservable(value))
            ko.utils.registerEventHandler(element, "change", function () { value(ko.bindingHandlers.selectedOptions.getSelectedValuesFromSelectNode(this)); });
        else if (allBindings._ko_property_writers && allBindings._ko_property_writers.value)
            ko.utils.registerEventHandler(element, "change", function () { allBindings._ko_property_writers.value(ko.bindingHandlers.selectedOptions.getSelectedValuesFromSelectNode(this)); });
    },
    update: function (element, value) {
        if (element.tagName != "SELECT")
            throw new Error("values binding applies only to SELECT elements");

        var newValue = ko.utils.unwrapObservable(value);
        if (newValue && typeof newValue.length == "number") {
            var nodes = element.childNodes;
            for (var i = 0, j = nodes.length; i < j; i++) {
                var node = nodes[i];
                if (node.tagName == "OPTION")
                    ko.utils.setOptionNodeSelectionState(node, ko.utils.arrayIndexOf(newValue, ko.selectExtensions.readValue(node)) >= 0);
            }
        }
    }
};

ko.bindingHandlers.text = {
    update: function (element, value) {
        value = ko.utils.unwrapObservable(value);
        typeof element.innerText == "string" ? element.innerText = value
                                             : element.textContent = value;
    }
};

ko.bindingHandlers.css = {
    update: function (element, value) {
        value = value || {};
        for (var className in value) {
            if (typeof className == "string") {
                var shouldHaveClass = ko.utils.unwrapObservable(value[className]);
                ko.utils.toggleDomNodeCssClass(element, className, shouldHaveClass);
            }
        }
    }
};

ko.bindingHandlers.style = {
    update: function (element, value) {
        value = ko.utils.unwrapObservable(value || {});
        for (var styleName in value) {
            if (typeof styleName == "string") {
                var styleValue = ko.utils.unwrapObservable(value[styleName]);
                element.style[styleName] = styleValue || ""; // Empty string removes the value, whereas null/undefined have no effect
            }
        }
    }
};

ko.bindingHandlers.uniqueName = {
    init: function (element, value) {
        if (value) {
            element.name = "ko_unique_" + (++ko.bindingHandlers.uniqueName.currentIndex);

            // Workaround IE 6 issue - http://www.matts411.com/post/setting_the_name_attribute_in_ie_dom/
            if (/MSIE 6/i.test(navigator.userAgent))
                element.mergeAttributes(document.createElement("<INPUT name='" + element.name + "'/>"), false);
        }
    }
};
ko.bindingHandlers.uniqueName.currentIndex = 0;

ko.bindingHandlers.checked = {
    init: function (element, value, allBindings) {
        if (ko.isWriteableObservable(value)) {
            var updateHandler;
            if (element.type == "checkbox")
                updateHandler = function () { value(this.checked) };
            else if (element.type == "radio")
                updateHandler = function () { if (this.checked) value(this.value) };
            if (updateHandler) {
                ko.utils.registerEventHandler(element, "change", updateHandler);
                ko.utils.registerEventHandler(element, "click", updateHandler);
            }
        } else if (allBindings._ko_property_writers && allBindings._ko_property_writers.checked) {
            var updateHandler;
            if (element.type == "checkbox")
                updateHandler = function () { allBindings._ko_property_writers.checked(this.checked) };
            else if (element.type == "radio")
                updateHandler = function () { if (this.checked) allBindings._ko_property_writers.checked(this.value) };
            if (updateHandler) {
                ko.utils.registerEventHandler(element, "change", updateHandler);
                ko.utils.registerEventHandler(element, "click", updateHandler);
            }
        }

        // IE 6 won't allow radio buttons to be selected unless they have a name
        if ((element.type == "radio") && !element.name)
            ko.bindingHandlers.uniqueName.init(element, true);
    },
    update: function (element, value) {
        value = ko.utils.unwrapObservable(value);
        if (element.type == "checkbox")
            element.checked = value;
        else if (element.type == "radio")
            element.checked = (element.value == value);
    }
};