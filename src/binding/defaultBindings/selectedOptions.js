ko.bindingHandlers['selectedOptions'] = {
    'init': function (element, valueAccessor, allBindings) {
        function updateFromView() {
            var value = valueAccessor(), valueToWrite = [];
            ko.utils.arrayForEach(element.getElementsByTagName("option"), function(node) {
                if (node.selected)
                    valueToWrite.push(ko.selectExtensions.readValue(node));
            });
            ko.expressionRewriting.writeValueToProperty(value, allBindings, 'selectedOptions', valueToWrite);
        }

        function updateFromModel() {
            var newValue = ko.utils.unwrapObservable(valueAccessor()),
                previousScrollTop = element.scrollTop;

            if (newValue && typeof newValue.length == "number") {
                ko.utils.arrayForEach(element.getElementsByTagName("option"), function(node) {
                    var isSelected = ko.utils.arrayIndexOf(newValue, ko.selectExtensions.readValue(node)) >= 0;
                    if (node.selected != isSelected) {      // This check prevents flashing of the select element in IE
                        ko.utils.setOptionNodeSelectionState(node, isSelected);
                    }
                });
            }

            element.scrollTop = previousScrollTop;
        }

        if (ko.utils.tagNameLower(element) != "select") {
            throw new Error("selectedOptions binding applies only to SELECT elements");
        }

        var updateFromModelComputed;
        ko.bindingEvent.subscribe(element, ko.bindingEvent.childrenComplete, function () {
            if (!updateFromModelComputed) {
                ko.utils.registerEventHandler(element, "change", updateFromView);
                updateFromModelComputed = ko.computed(updateFromModel, null, { disposeWhenNodeIsRemoved: element });
            } else {
                updateFromView();
            }
        }, null, { 'notifyImmediately': true });
    },
    'update': function() {} // Keep for backwards compatibility with code that may have wrapped binding
};
ko.expressionRewriting.twoWayBindings['selectedOptions'] = true;
