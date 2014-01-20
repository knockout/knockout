ko.bindingHandlers['selectedOptions'] = {
    'after': ['options', 'foreach'],
    'init': function (element, valueAccessor, allBindings) {
        // Fix for the broken <select> tag in iOS7
        // More info here: https://github.com/knockout/knockout/issues/1280
        var listenToChangeEvent = true;
        if (/(iPad|iPhone|iPod)/g.test(navigator.userAgent)) {
            listenToChangeEvent = false;
            ko.utils.registerEventHandler(element, "focus", function () {
                listenToChangeEvent = true;
            });
            ko.utils.registerEventHandler(element, "blur", function () {
                listenToChangeEvent = false;
                // Fix the <select> tag itself
                setTimeout(function() {
                    ko.bindingHandlers['selectedOptions']['update'](element, valueAccessor);
                }, 600);
            });
        }
        ko.utils.registerEventHandler(element, "change", function () {
            if (!listenToChangeEvent)
                return;
            var value = valueAccessor(), valueToWrite = [];
            ko.utils.arrayForEach(element.getElementsByTagName("option"), function(node) {
                if (node.selected)
                    valueToWrite.push(ko.selectExtensions.readValue(node));
            });
            ko.expressionRewriting.writeValueToProperty(value, allBindings, 'selectedOptions', valueToWrite);
        });
    },
    'update': function (element, valueAccessor) {
        if (ko.utils.tagNameLower(element) != "select")
            throw new Error("values binding applies only to SELECT elements");

        var newValue = ko.utils.unwrapObservable(valueAccessor());
        if (newValue && typeof newValue.length == "number") {
            ko.utils.arrayForEach(element.getElementsByTagName("option"), function(node) {
                var isSelected = ko.utils.arrayIndexOf(newValue, ko.selectExtensions.readValue(node)) >= 0;
                ko.utils.setOptionNodeSelectionState(node, isSelected);
            });
        }
    }
};
ko.expressionRewriting.twoWayBindings['selectedOptions'] = true;
