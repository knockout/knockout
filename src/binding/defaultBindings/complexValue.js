//var model = {
//    options: [{ no: 1, label: 'Options1' }, { no: 2, label: 'Options2' }],
//    optionsText: 'label',
//    optionsValue: 'no',
//    optionsCaption: '[Select...]',
//    textSetter: 'text',
//    valueSetter: 'id',
//    _value: { id: null, text: null }
//};

//<select data-bind="{
//                    options: model.options,
//                    optionsText: model.optionsText,
//                    optionsValue: model.optionsValue,
//                    optionsCaption: model.optionsCaption,
//                    textSetter: model.textSetter,
//                    valueSetter: model.valueSetter,
//                    complexValue: model._value}"></select>

ko.bindingHandlers.complexValue = {
    init: function (element, valueAccessor, allBindings) {
        if (ko.utils.tagNameLower(element) !== "select")
            throw "complexValue binding only work by SELECT element.";

        //var propertyChangedFired = false;
        var elementValueBeforeEvent = null;

        var textSetter = allBindings()['textSetter'];
        var valueSetter = allBindings()['valueSetter'];

        var valueUpdateHandler = function () {
            elementValueBeforeEvent = null;
            //propertyChangedFired = false;
            var modelValue = ko.unwrap(valueAccessor());

            var elementValue = ko.selectExtensions.readValue(element);
            var elementText = ko.selectExtensions.readText(element);


            if (modelValue && textSetter in modelValue && valueSetter in modelValue) {
                // Set model property text
                if (!ko.isObservable(modelValue[textSetter])) {
                    modelValue[textSetter] = elementText;
                } else if (ko.isWriteableObservable(modelValue[textSetter])) {
                    modelValue[textSetter](elementText);
                }

                // Set model property value
                if (!ko.isObservable(modelValue[valueSetter])) {
                    modelValue[valueSetter] = elementValue;
                } else if (ko.isWriteableObservable(modelValue[valueSetter])) {
                    modelValue[valueSetter](elementValue);
                }
            }
        }

        ko.utils.registerEventHandler(element, "change", valueUpdateHandler);

        var updateFromModel = function () {
            var newValue = ko.unwrap(ko.unwrap(valueAccessor())[valueSetter]);
            var elementValue = ko.selectExtensions.readValue(element);

            if (elementValueBeforeEvent !== null && newValue === elementValueBeforeEvent) {
                ko.utils.setTimeout(updateFromModel, 0);
                return;
            }

            var valueHasChanged = (newValue !== elementValue);

            if (valueHasChanged) {
                var allowUnset = allBindings.get('valueAllowUnset');
                var applyValueAction = function () {
                    ko.selectExtensions.writeValue(element, newValue, allowUnset);
                };

                applyValueAction();

                if (!allowUnset && newValue !== ko.selectExtensions.readValue(element)) {
                    // If you try to set a model value that can't be represented in an already-populated dropdown, reject that change,
                    // because you're not allowed to have a model value that disagrees with a visible UI selection.
                    ko.dependencyDetection.ignore(ko.utils.triggerEvent, null, [element, "change"]);
                } else {
                    // Workaround for IE6 bug: It won't reliably apply values to SELECT nodes during the same execution thread
                    // right after you've changed the set of OPTION nodes on it. So for that node type, we'll schedule a second thread
                    // to apply the value as well.
                    ko.utils.setTimeout(applyValueAction, 0);
                }
            }
        };

        ko.computed(updateFromModel, null, { disposeWhenNodeIsRemoved: element });
    },
    update: function () { }
};
ko.expressionRewriting.twoWayBindings['complexValue'] = true;
