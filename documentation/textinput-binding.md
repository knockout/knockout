---
layout: documentation
title: The "textInput" binding
---

### Purpose
The `textInput` binding links a text box (`<input>`) or text area (`<textarea>`) with a viewmodel property, providing two-way updates between the viewmodel property and the element's value. Unlike the `value` binding, `textInput` provides instant updates from the DOM for all types of user input, including autocomplete, drag-and-drop, and clipboard events.

### Example

    <p>Login name: <input data-bind="textInput: userName" /></p>
    <p>Password: <input type="password" data-bind="textInput: userPassword" /></p>

    ViewModel:
    <pre data-bind="text: ko.toJSON($root, null, 2)"></pre>

    <script>
        ko.applyBindings({
            userName: ko.observable(""),        // Initially blank
            userPassword: ko.observable("abc")  // Prepopulate
        });
    </script>

### Parameters

  * Main Parameter

    KO sets the element's text content to your parameter value. Any previous value will be overwritten.

    If this parameter is an observable value, the binding will update the element's value whenever the observable value changes. If the parameter isn't observable, it will only set the element's value once and will not update it again later.

    If you supply something other than a number or a string (e.g., you pass an object or an array), the displayed text will be equivalent to `yourParameter.toString()` (that's usually not very useful, so it's best to supply string or numeric values).

    Whenever the user edits the value in the associated form control, KO will update the property on your view model. KO will always attempt to update your view model when the value has been modified by the user or any DOM events.
 
  * Additional parameters

     * None


### Note 1: `textInput` vs `value` binding

Although the [`value` binding](value-binding.html) can also perform two-way binding between text boxes and viewmodel properties, you should prefer `textInput` whenever you want immediate live updates. The main differences are:

  * **Immediate updates**

    `value`, by default, only updates your model when the user moves focus out of the text box. `textInput` updates your model immediately on each keystroke or other text entry mechanism (such as cutting or dragging text, which don't necessarily raise any focus change events).

  * **Browser event quirks handling**

    Browsers are highly inconsistent in the events that fire in response to unusual text entry mechanisms such as cutting, dragging, or accepting autocomplete suggestions. The `value` binding, even with extra options such as `valueUpdate: afterkeydown` to get updates on particular events, does not cover all text entry scenarios on all browsers.

    The `textInput` binding is specifically designed to handle a wide range of browser quirks, to provide consistent and immediate model updates even in response to unusual text entry methods.

Don't try to use the `value` and `textInput` bindings together on the same element, as that won't achieve anything useful.

### Dependencies

None, other than the core Knockout library.

