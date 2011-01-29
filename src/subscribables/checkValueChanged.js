
function comparePrimitives(oldValue, newValue) {
    return oldValue != newValue;
};

function setupCheckValueChanged(options) {
    // checkValueChanged can be a comparator function(old, new) for object equality or a boolean for primitives equality
    if(typeof options["checkValueChanged"] != "function")
    {
        options["checkValueChanged"] = options["checkValueChanged"] ? comparePrimitives : false;
    }

    return options;
};

function checkValueChanged(oldValue, newValue, options) {
    return !options["checkValueChanged"] || options["checkValueChanged"](oldValue, newValue);
}
