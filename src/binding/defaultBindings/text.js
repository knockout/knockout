ko.bindingHandlers['text'] = {
    'init': function() {
        // Prevent binding on the dynamically-injected text node (as developers are unlikely to expect that, and it has security implications).
        // It should also make things faster, as we no longer have to consider whether the text node might be bindable.
        return { 'controlsDescendantBindings': true };
    },
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
