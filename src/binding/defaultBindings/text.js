ko.bindingHandlers['text'] = {
    'update': function (element, valueAccessor) {
        ko.utils.setTextContent(element, valueAccessor());
    }
};
ko.virtualElements.allowedBindings['text'] = true;


ko.bindingHandlers['cellText'] = {
    update: function (element, valueAccessor) {
        var value = valueAccessor();
        var span = $('<span/>');
        var valueUnwrapped = ko.utils.unwrapObservable(value);
        span.append(valueUnwrapped);
        $(element).empty();
        $(element).append(span);
        $(element).append('&nbsp;');
    }
};

ko.virtualElements.allowedBindings['cellText'] = true;
