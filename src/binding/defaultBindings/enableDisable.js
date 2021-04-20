ko.bindingHandlers['enable'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        ko.utils.setElementEnabled(element, value);
        //element.disabled may not work in every Browser and is not typescript HTMLElement compatible
        // if (en && element.hasAttribute("disabled")) {
        //     element.removeAttribute("disabled");
        // }
        // else if (!en && !element.hasAttribute("disabled")) {
        //     element.setAttribute("disabled", "disabled");
        // }
    }
};

ko.bindingHandlers['disable'] = {
    'update': function (element, valueAccessor) {
        var value = !ko.utils.unwrapObservable(valueAccessor());
        ko.utils.setElementEnabled(element, value);
        //element.disabled may not work in every Browser and is not typescript HTMLElement compatible
        // if (en && element.hasAttribute("disabled")) {
        //     element.removeAttribute("disabled");
        // }
        // else if (!en && !element.hasAttribute("disabled")) {
        //     element.setAttribute("disabled", "disabled");
        // }
    }
};
