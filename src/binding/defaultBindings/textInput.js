(function () {

if (window && window.navigator) {
    var parseVersion = function (matches) {
        if (matches) {
            return parseFloat(matches[1]);
        }
    };

    // Detect various browser versions because some old versions don't fully support the 'input' event
    var userAgent = window.navigator.userAgent, operaVersion, chromeVersion, safariVersion, firefoxVersion, ieVersion;

    (operaVersion = window.opera && window.opera.version && parseInt(window.opera.version()))
        || (chromeVersion = parseVersion(userAgent.match(/Chrome\/([^ ]*)/)))
        || (safariVersion = parseVersion(userAgent.match(/Version\/([^ ]*) Safari/)))
        || (firefoxVersion = parseVersion(userAgent.match(/Firefox\/([^ ]*)/)))
        || (ieVersion = ko.utils.ieVersion || parseVersion(userAgent.match(/MSIE ([^ ]*)/)));      // Detects up to IE 10
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

// Firefox < 33 has a bug that fields that aren't in focus don't receive any event when filled in
// by the password manager. There are two times that this can happen. The first is when the page
// is loaded: the fields are filled in just before the DOMContentLoaded event is fired. The
// second is when a "username" field on the page is filled in by the user: this will fill in
// the password field also without firing an event.
if (firefoxVersion < 33) {
    var inputsForOnLoad;
    if (document.readyState == 'loading') {
        inputsForOnLoad = [];
        ko.utils.registerEventHandler(document, 'DOMContentLoaded', function (event) {
            var handler;
            while (handler = inputsForOnLoad.pop()) {
                handler(event);
            }
            inputsForOnLoad = undefined;
        });
    }

    var registerForAutoFillEvent = function (element, handler, deferHandler) {
        if (inputsForOnLoad) {
            inputsForOnLoad.push(handler);
        }

        // This logic is similar to how Firefox's password manager selects a pair of username/password fields
        // See http://hg.mozilla.org/mozilla-central/file/0c8ae792f1c0/toolkit/components/passwordmgr/LoginManagerContent.jsm#l380
        if (element.type == 'password' && element.form) {
            var form = element.form,
                elements = form.elements,
                index = ko.utils.arrayIndexOf(elements, element),
                testElem, userElem;
            while (index--) {
                testElem = elements[index];
                if (testElem.type == 'password') {
                    return;
                }
                if (!userElem && testElem.type == 'text') {
                    userElem = testElem;
                }
            }
            if (userElem) {
                ko.utils.registerEventHandler(userElem, 'DOMAutoComplete', deferHandler);
                ko.utils.registerEventHandler(userElem, 'blur', deferHandler);
            }
        }
    };
}

ko.bindingHandlers['textInput'] = {
    'init': function (element, valueAccessor, allBindings) {

        var previousElementValue = element.value,
            timeoutHandle,
            elementValueBeforeEvent,
            isTextArea = (ko.utils.tagNameLower(element) === "textarea");

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
                timeoutHandle = setTimeout(handler, 4);
            }
        };

        var updateView = function () {
            var modelValue = ko.utils.unwrapObservable(valueAccessor());

            if (modelValue === null || modelValue === undefined) {
                modelValue = '';
            }

            if (elementValueBeforeEvent !== undefined && modelValue === elementValueBeforeEvent) {
                setTimeout(updateView, 4);
                return;
            }

            // Update the element only if the element and model are different. On some browsers, updating the value
            // will move the cursor to the end of the input, which would be bad while the user is typing.
            if (element.value !== modelValue) {
                previousElementValue = modelValue;  // Make sure we ignore events (propertychange) that result from updating the value
                element.value = modelValue;
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
            if (ieVersion < 10) {
                // Internet Explorer <= 8 doesn't support the 'input' event, but does include 'propertychange' that fires whenever
                // any property of an element changes. Unlike 'input', it also fires if a property is changed from JavaScript code,
                // but that's an acceptable compromise for this binding. IE 9 does support 'input', but since it doesn't fire it
                // when using autocomplete, we'll use 'propertychange' for it also.
                onEvent('propertychange', function(event) {
                    if (event.propertyName === 'value') {
                        updateModel(event);
                    }
                });

                if (ieVersion == 8) {
                    // IE 8 has a bug where it fails to fire 'propertychange' on the first update following a value change from
                    // JavaScript code. It also doesn't fire if you clear the entire value. To fix this, we bind to the following
                    // events too.
                    onEvent('keyup', updateModel);      // A single keystoke
                    onEvent('keydown', updateModel);    // The first character when a key is held down
                }
                if (registerForSelectionChangeEvent) {
                    // Internet Explorer 9 doesn't fire the 'input' event when deleting text, including using
                    // the backspace, delete, or ctrl-x keys, clicking the 'x' to clear the input, dragging text
                    // out of the field, and cutting or deleting text using the context menu. 'selectionchange'
                    // can detect all of those except dragging text out of the field, for which we use 'dragend'.
                    // These are also needed in IE8 because of the bug described above.
                    registerForSelectionChangeEvent(element, updateModel);  // 'selectionchange' covers cut, paste, drop, delete, etc.
                    onEvent('dragend', deferUpdateModel);
                }
            } else {
                // All other supported browsers support the 'input' event, which fires whenever the content of the element is changed
                // through the user interface.
                onEvent('input', updateModel);

                if (safariVersion < 5 && isTextArea) {
                    // Safari <5 doesn't fire the 'input' event for <textarea> elements (it does fire 'textInput'
                    // but only when typing). So we'll just catch as much as we can with keydown, cut, and paste.
                    onEvent('keydown', deferUpdateModel);
                    onEvent('paste', deferUpdateModel);
                    onEvent('cut', deferUpdateModel);
                } else if (operaVersion < 11) {
                    // Opera 10 doesn't always fire the 'input' event for cut, paste, undo & drop operations.
                    // We can try to catch some of those using 'keydown'.
                    onEvent('keydown', deferUpdateModel);
                } else if (ieVersion == 10) {
                    // Internet Explorer 10 sometimes doesn't fire 'input' when using autocomplete but does fire 'propertychange'.
                    // Also it sometimes doesn't fire any event when an autocomplete item is selected. To ensure we don't lose the
                    // update, check for changes on blur.
                    onEvent('propertychange', function(event) {
                        if (event.propertyName === 'value') {
                            deferUpdateModel(event);
                        }
                    });
                    onEvent('blur', updateModel);
                } else if (firefoxVersion < 33) {
                    // Firefox < 33 doesn't fire any event when a field that's not in focus is changed by auto-fill.
                    if (!isTextArea) {
                        registerForAutoFillEvent(element, updateModel, deferUpdateModel);
                    }

                    if (firefoxVersion < 4) {
                        // Firefox <= 3.6 doesn't fire the 'input' event when text is filled in through autocomplete.
                        onEvent('DOMAutoComplete', updateModel);

                        // Firefox <=3.5 doesn't fire the 'input' event when text is dropped into the input.
                        onEvent('dragdrop', updateModel);       // <3.5
                        onEvent('drop', updateModel);           // 3.5
                    }
                }
            }
        }

        // Bind to the change event so that we can catch programmatic updates of the value that fire this event.
        onEvent('change', updateModel);

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