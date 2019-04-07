ko.bindingHandlers['value'] = {
    'init': function (element, valueAccessor, allBindings) {
        var tagName = ko.utils.tagNameLower(element),
            isInputElement = tagName == "input";

        // If the value binding is placed on a radio/checkbox, then just pass through to checkedValue and quit
        if (isInputElement && (element.type == "checkbox" || element.type == "radio")) {
            ko.applyBindingAccessorsToNode(element, { 'checkedValue': valueAccessor });
            return;
        }

        var eventsToCatch = [];
        var requestedEventsToCatch = allBindings.get("valueUpdate");
        var propertyChangedFired = false;
        var elementValueBeforeEvent = null;

        if (requestedEventsToCatch) {
            // Allow both individual event names, and arrays of event names
            if (typeof requestedEventsToCatch == "string") {
                eventsToCatch = [requestedEventsToCatch];
            } else {
                eventsToCatch = ko.utils.arrayGetDistinctValues(requestedEventsToCatch);
            }
            ko.utils.arrayRemoveItem(eventsToCatch, "change");  // We'll subscribe to "change" events later
        }

        var valueUpdateHandler = function() {
            elementValueBeforeEvent = null;
            propertyChangedFired = false;
            var modelValue = valueAccessor();
            var elementValue = ko.selectExtensions.readValue(element);
            ko.expressionRewriting.writeValueToProperty(modelValue, allBindings, 'value', elementValue);
        }

        // Workaround for https://github.com/SteveSanderson/knockout/issues/122
        // IE doesn't fire "change" events on textboxes if the user selects a value from its autocomplete list
        var ieAutoCompleteHackNeeded = ko.utils.ieVersion && isInputElement && element.type == "text"
                                       && element.autocomplete != "off" && (!element.form || element.form.autocomplete != "off");
        if (ieAutoCompleteHackNeeded && ko.utils.arrayIndexOf(eventsToCatch, "propertychange") == -1) {
            ko.utils.registerEventHandler(element, "propertychange", function () { propertyChangedFired = true });
            ko.utils.registerEventHandler(element, "focus", function () { propertyChangedFired = false });
            ko.utils.registerEventHandler(element, "blur", function() {
                if (propertyChangedFired) {
                    valueUpdateHandler();
                }
            });
        }

        ko.utils.arrayForEach(eventsToCatch, function(eventName) {
            // The syntax "after<eventname>" means "run the handler asynchronously after the event"
            // This is useful, for example, to catch "keydown" events after the browser has updated the control
            // (otherwise, ko.selectExtensions.readValue(this) will receive the control's value *before* the key event)
            var handler = valueUpdateHandler;
            if (ko.utils.stringStartsWith(eventName, "after")) {
                handler = function() {
                    // The elementValueBeforeEvent variable is non-null *only* during the brief gap between
                    // a keyX event firing and the valueUpdateHandler running, which is scheduled to happen
                    // at the earliest asynchronous opportunity. We store this temporary information so that
                    // if, between keyX and valueUpdateHandler, the underlying model value changes separately,
                    // we can overwrite that model value change with the value the user just typed. Otherwise,
                    // techniques like rateLimit can trigger model changes at critical moments that will
                    // override the user's inputs, causing keystrokes to be lost.
                    elementValueBeforeEvent = ko.selectExtensions.readValue(element);
                    ko.utils.setTimeout(valueUpdateHandler, 0);
                };
                eventName = eventName.substring("after".length);
            }
            ko.utils.registerEventHandler(element, eventName, handler);
        });

        var updateFromModel;

        if (isInputElement && element.type == "file") {
            // For file input elements, can only write the empty string
            updateFromModel = function () {
                var newValue = ko.utils.unwrapObservable(valueAccessor());
                if (newValue === null || newValue === undefined || newValue === "") {
                    element.value = "";
                } else {
                    ko.dependencyDetection.ignore(valueUpdateHandler);  // reset the model to match the element
                }
            }
        } else {
            updateFromModel = function () {
                var newValue = ko.utils.unwrapObservable(valueAccessor());
                var elementValue = ko.selectExtensions.readValue(element);

                if (elementValueBeforeEvent !== null && newValue === elementValueBeforeEvent) {
                    ko.utils.setTimeout(updateFromModel, 0);
                    return;
                }

                var valueHasChanged = newValue !== elementValue;

                if (valueHasChanged || elementValue === undefined) {
                    if (tagName === "select") {
                        var allowUnset = allBindings.get('valueAllowUnset');
                        ko.selectExtensions.writeValue(element, newValue, allowUnset);
                        if (!allowUnset && newValue !== ko.selectExtensions.readValue(element)) {
                            // If you try to set a model value that can't be represented in an already-populated dropdown, reject that change,
                            // because you're not allowed to have a model value that disagrees with a visible UI selection.
                            ko.dependencyDetection.ignore(valueUpdateHandler);
                        }
                    } else {
                        ko.selectExtensions.writeValue(element, newValue);
                    }
                }
            };
        }

        if (tagName === "select") {
            var updateFromModelComputed;
            ko.bindingEvent.subscribe(element, ko.bindingEvent.childrenComplete, function () {
                if (!updateFromModelComputed) {
                    ko.utils.registerEventHandler(element, "change", valueUpdateHandler);
                    updateFromModelComputed = ko.computed(updateFromModel, null, { disposeWhenNodeIsRemoved: element });
                } else if (allBindings.get('valueAllowUnset')) {
                    updateFromModel();
                } else {
                    valueUpdateHandler();
                }
            }, null, { 'notifyImmediately': true });
        } else {
            ko.utils.registerEventHandler(element, "change", valueUpdateHandler);
            ko.computed(updateFromModel, null, { disposeWhenNodeIsRemoved: element });
        }
    },
    'update': function() {} // Keep for backwards compatibility with code that may have wrapped value binding
};
ko.expressionRewriting.twoWayBindings['value'] = true;
