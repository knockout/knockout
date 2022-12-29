(function () {

if (window && window.navigator) {
    var parseVersion = function (matches) {
        if (matches) {
            return parseFloat(matches[1]);
        }
    };

    // Detect various browser versions because some old versions don't fully support the 'input' event
    var userAgent = window.navigator.userAgent,
        operaVersion, chromeVersion, safariVersion, firefoxVersion, ieVersion, edgeVersion;

    (operaVersion = window.opera && window.opera.version && parseInt(window.opera.version()))
        || (edgeVersion = parseVersion(userAgent.match(/Edge\/([^ ]+)$/)))
        || (chromeVersion = parseVersion(userAgent.match(/Chrome\/([^ ]+)/)))
        || (safariVersion = parseVersion(userAgent.match(/Version\/([^ ]+) Safari/)))
        || (firefoxVersion = parseVersion(userAgent.match(/Firefox\/([^ ]+)/)))
        || (ieVersion = ko.utils.ieVersion || parseVersion(userAgent.match(/MSIE ([^ ]+)/)))      // Detects up to IE 10
        || (ieVersion = parseVersion(userAgent.match(/rv:([^ )]+)/)));      // Detects IE 11
}

// IE 8 and 9 have bugs that prevent the normal events from firing when the value changes.
// But it does fire the 'selectionchange' event on many of those, presumably because the
// cursor is moving and that counts as the selection changing. The 'selectionchange' event is
// fired at the document level only and doesn't directly indicate which element changed. We
// set up just one event handler for the document and use 'activeElement' to determine which
// element was changed.
if (ieVersion >= 8 && ieVersion < 10) {
    var selectionChangeRegisteredName = ko.utils.domData.nextKey(),
        selectionChangeHandlerName = ko.utils.domData.nextKey();
    var selectionChangeHandler = function(event) {
        var target = this.activeElement,
            handler = target && ko.utils.domData.get(target, selectionChangeHandlerName);
        if (handler) {
            handler(event);
        }
    };
    var registerForSelectionChangeEvent = function (element, handler) {
        var ownerDoc = element.ownerDocument;
        if (!ko.utils.domData.get(ownerDoc, selectionChangeRegisteredName)) {
            ko.utils.domData.set(ownerDoc, selectionChangeRegisteredName, true);
            ko.utils.registerEventHandler(ownerDoc, 'selectionchange', selectionChangeHandler);
        }
        ko.utils.domData.set(element, selectionChangeHandlerName, handler);
    };
}

ko.bindingHandlers['textInput'] = {
    'init': function (element, valueAccessor, allBindings) {

        var previousElementValue = element.value,
            timeoutHandle,
            elementValueBeforeEvent;

        var updateModel = function (event) {
            clearTimeout(timeoutHandle);
            elementValueBeforeEvent = timeoutHandle = undefined;

            var elementValue = element.value;
            if (previousElementValue !== elementValue) {
                // Provide a way for tests to know exactly which event was processed
                if (DEBUG && event) element['_ko_textInputProcessedEvent'] = event.type;
                previousElementValue = elementValue;
                ko.expressionRewriting.writeValueToProperty(valueAccessor(), allBindings, 'textInput', elementValue);
            }
        };

        var deferUpdateModel = function (event) {
            if (!timeoutHandle) {
                // The elementValueBeforeEvent variable is set *only* during the brief gap between an
                // event firing and the updateModel function running. This allows us to ignore model
                // updates that are from the previous state of the element, usually due to techniques
                // such as rateLimit. Such updates, if not ignored, can cause keystrokes to be lost.
                elementValueBeforeEvent = element.value;
                var handler = DEBUG ? updateModel.bind(element, {type: event.type}) : updateModel;
                timeoutHandle = ko.utils.setTimeout(handler, 4);
            }
        };

        // IE9 will mess up the DOM if you handle events synchronously which results in DOM changes (such as other bindings);
        // so we'll make sure all updates are asynchronous
        var ieUpdateModel = ko.utils.ieVersion == 9 ? deferUpdateModel : updateModel,
            ourUpdate = false;

        var updateView = function () {
            var modelValue = ko.utils.unwrapObservable(valueAccessor());

            if (modelValue === null || modelValue === undefined) {
                modelValue = '';
            }

            if (elementValueBeforeEvent !== undefined && modelValue === elementValueBeforeEvent) {
                ko.utils.setTimeout(updateView, 4);
                return;
            }

            // Update the element only if the element and model are different. On some browsers, updating the value
            // will move the cursor to the end of the input, which would be bad while the user is typing.
            if (element.value !== modelValue) {
                ourUpdate = true;  // Make sure we ignore events (propertychange) that result from updating the value
                element.value = modelValue;
                ourUpdate = false;
                previousElementValue = element.value; // In case the browser changes the value (see #2281)
            }
        };

        var onEvent = function (event, handler) {
            ko.utils.registerEventHandler(element, event, handler);
        };

        if (DEBUG && ko.bindingHandlers['textInput']['_forceUpdateOn']) {
            // Provide a way for tests to specify exactly which events are bound
            ko.utils.arrayForEach(ko.bindingHandlers['textInput']['_forceUpdateOn'], function(eventName) {
                if (eventName.slice(0,5) == 'after') {
                    onEvent(eventName.slice(5), deferUpdateModel);
                } else {
                    onEvent(eventName, updateModel);
                }
            });
        } else {
            if (ieVersion) {
                // All versions (including 11) of Internet Explorer have a bug that they don't generate an input or propertychange event when ESC is pressed
                onEvent('keypress', updateModel);
            }
            if (ieVersion < 11) {
                // Internet Explorer <= 8 doesn't support the 'input' event, but does include 'propertychange' that fires whenever
                // any property of an element changes. Unlike 'input', it also fires if a property is changed from JavaScript code,
                // but that's an acceptable compromise for this binding. IE 9 and 10 support 'input', but since they don't always
                // fire it when using autocomplete, we'll use 'propertychange' for them also.
                onEvent('propertychange', function(event) {
                    if (!ourUpdate && event.propertyName === 'value') {
                        ieUpdateModel(event);
                    }
                });
            }
            if (ieVersion == 8) {
                // IE 8 has a bug where it fails to fire 'propertychange' on the first update following a value change from
                // JavaScript code. It also doesn't fire if you clear the entire value. To fix this, we bind to the following
                // events too.
                onEvent('keyup', updateModel);      // A single keystroke
                onEvent('keydown', updateModel);    // The first character when a key is held down
            }
            if (registerForSelectionChangeEvent) {
                // Internet Explorer 9 doesn't fire the 'input' event when deleting text, including using
                // the backspace, delete, or ctrl-x keys, clicking the 'x' to clear the input, dragging text
                // out of the field, and cutting or deleting text using the context menu. 'selectionchange'
                // can detect all of those except dragging text out of the field, for which we use 'dragend'.
                // These are also needed in IE8 because of the bug described above.
                registerForSelectionChangeEvent(element, ieUpdateModel);  // 'selectionchange' covers cut, paste, drop, delete, etc.
                onEvent('dragend', deferUpdateModel);
            }

            if (!ieVersion || ieVersion >= 9) {
                // All other supported browsers support the 'input' event, which fires whenever the content of the element is changed
                // through the user interface.
                onEvent('input', ieUpdateModel);
            }

            if (safariVersion < 5 && ko.utils.tagNameLower(element) === "textarea") {
                // Safari <5 doesn't fire the 'input' event for <textarea> elements (it does fire 'textInput'
                // but only when typing). So we'll just catch as much as we can with keydown, cut, and paste.
                onEvent('keydown', deferUpdateModel);
                onEvent('paste', deferUpdateModel);
                onEvent('cut', deferUpdateModel);
            } else if (operaVersion < 11) {
                // Opera 10 doesn't always fire the 'input' event for cut, paste, undo & drop operations.
                // We can try to catch some of those using 'keydown'.
                onEvent('keydown', deferUpdateModel);
            } else if (firefoxVersion < 4.0) {
                // Firefox <= 3.6 doesn't fire the 'input' event when text is filled in through autocomplete
                onEvent('DOMAutoComplete', updateModel);

                // Firefox <=3.5 doesn't fire the 'input' event when text is dropped into the input.
                onEvent('dragdrop', updateModel);       // <3.5
                onEvent('drop', updateModel);           // 3.5
            } else if (edgeVersion && element.type === "number") {
                // Microsoft Edge doesn't fire 'input' or 'change' events for number inputs when
                // the value is changed via the up / down arrow keys
                onEvent('keydown', deferUpdateModel);
            }
        }

        // Bind to the change event so that we can catch programmatic updates of the value that fire this event.
        onEvent('change', updateModel);

        // To deal with browsers that don't notify any kind of event for some changes (IE, Safari, etc.)
        onEvent('blur', updateModel);

        ko.computed(updateView, null, { disposeWhenNodeIsRemoved: element });
    }
};
ko.expressionRewriting.twoWayBindings['textInput'] = true;

// textinput is an alias for textInput
ko.bindingHandlers['textinput'] = {
    // preprocess is the only way to set up a full alias
    'preprocess': function (value, name, addBinding) {
        addBinding('textInput', value);
    }
};

})();