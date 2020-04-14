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
        if (value !== null && Object.prototype.toString.call(value) == "[object Object]") {
            ko.utils.objectForEach(value, function(className, shouldHaveClass) {
                shouldHaveClass = ko.utils.unwrapObservable(shouldHaveClass);
                ko.utils.toggleDomNodeCssClass(element, className, shouldHaveClass);
            });
        } else if (value !== null && Object.prototype.toString.call(value) == "[object Array]") {
            ko.utils.removeAllDomNodeCssClasses(element);
            ko.utils.arrayForEach(value, function(className) {
                ko.utils.toggleDomNodeCssClass(element, className, true);
            });
        }
        else {
            ko.bindingHandlers['class']['update'](element, valueAccessor);
        }
    }
};
