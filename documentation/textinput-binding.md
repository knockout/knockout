---
layout: documentation
title: The "textInput" binding
---

### Purpose
The `textInput` binding links an `<input type="text" />` or a `<textarea>` with a viewmodel property, providing two-way updates between the viewmodel property and the element's value. Unlike the `value` binding, `textInput` provides instant updates from the DOM for all types of user input, including autocomplete, drag-and-drop, and clipboard events.

### Example

    <p>Login name: <input type="text" name="username" data-bind="value: userName" /></p>
    <p>Password: <input type="password" name="password" data-bind="value: userPassword" /></p>

    ViewModel:
    <pre data-bind="text: ko.toJSON($root, null, 2)"></pre>

    <script type="text/javascript">
        var viewModel = {
            userName: ko.observable(""),        // Initially blank
            userPassword: ko.observable("abc"), // Prepopulate
        };
    </script>

### Parameters

 * Main Parameter

   KO sets the elements `value` property to your parameters value. Any previous value will be overwritten.

   If this parameter is an observable value, the binding will update the element's value whenever the value changes. If the parameter isn't observable, it will only set the element's value once and will not update it again later.

   If you supply something other than a number or a string (e.g., you pass an object or an array), the displayed text will be equivalent to `yourParameter.toString()` (that's usually not very useful, so it's best to supply string or numeric values).

   Whenever the user edits the value in the associated form control, KO will update the property on your view model. KO will always attempt to update your view model when the value has been modified by the user or any DOM events.
 
 * Additional parameters

   * None


### Note 1: `textInput` vs `value` binding

The `textInput` binding should be considered a special case of the `value` binding. `value` uses the `valueUpdate` binding to control which events trigger viewmodel updates, but different browsers can require a variety of events to achieve instant updates. The `textInput` binding takes care of these cases. You should not use the `textInput` binding and the `value` binding together.


### Dependencies

None, other than the core Knockout library.

