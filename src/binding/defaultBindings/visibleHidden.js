ko.bindingHandlers['visible'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        var isCurrentlyVisible = !(element.style.display == "none");
        if (value && !isCurrentlyVisible)
            element.style.display = "";
        else if ((!value) && isCurrentlyVisible)
            element.style.display = "none";
    }
};

ko.bindingHandlers['hidden'] = {
    'update': function (element, valueAccessor) {
        ko.bindingHandlers['visible']['update'](element, function() { return !ko.utils.unwrapObservable(valueAccessor()) });
    }
};
