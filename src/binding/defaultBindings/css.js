var classesWrittenByBindingKey = '__ko__cssValue';
ko.bindingHandlers['class'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.stringTrim(ko.utils.unwrapObservable(valueAccessor()));
        ko.utils.toggleDomNodeCssClass(element, element[classesWrittenByBindingKey], false);
        element[classesWrittenByBindingKey] = value;
        ko.utils.toggleDomNodeCssClass(element, value, true);
    }
};

ko.bindingHandlers['css'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (value !== null && typeof value == "object") {
            ko.utils.objectForEach(value, function(className, shouldHaveClass) {
                shouldHaveClass = ko.utils.unwrapObservable(shouldHaveClass);
                ko.utils.toggleDomNodeCssClass(element, className, shouldHaveClass);
            });
        } else {
            ko.bindingHandlers['class']['update'](element, valueAccessor);
        }
    }
};
