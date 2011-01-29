
ko.primitivesEqual = function (oldValue, newValue) {
    return oldValue != newValue;
};

ko.setupCheckValueChanged = function (options) {
    // checkValueChanged can be a comparator function(old, new) for object equality or a boolean for primitives equality
    if(typeof options["checkValueChanged"] != "function")
    {
        options["checkValueChanged"] = options["checkValueChanged"] ? ko.primitivesEqual : false;
    }

    return options;
};

ko.checkValueChanged = function (oldValue, newValue, options) {
    return !options["checkValueChanged"] || options["checkValueChanged"](oldValue, newValue);
}
