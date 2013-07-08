---
layout: documentation
title: The "submit" binding
---

### Purpose
The `submit` binding adds an event handler so that your chosen JavaScript function will be invoked when the associated DOM element is submitted. Typically you will only want to use this on `form` elements.

When you use the `submit` binding on a form, Knockout will prevent the browser's default submit action for that form. In other words, the browser will call your handler function but will *not* submit the form to the server. This is a useful default because when you use the `submit` binding, it's normally because you're using the form as an interface to your view model, not as a regular HTML form. If you *do* want to let the form submit like a normal HTML form, just return `true` from your `submit` handler.

### Example
    <form data-bind="submit: doSomething">
        ... form contents go here ...
        <button type="submit">Submit</button>
    </form>

    <script type="text/javascript">
        var viewModel = {
            doSomething : function(formElement) {
                // ... now do something
            }
        };
    </script>

As illustrated in this example, KO passes the form element as a parameter to your submit handler function. You can ignore that parameter if you want, or there are various ways you might want to use it, for example:

 * Extracting additional data or state from the form elements

 * Triggering UI-level validation using a library such as [jQuery Validation](https://github.com/jzaefferer/jquery-validation), using code similar to the following snippet: `if ($(formElement).valid()) { /* do something */ }`.

### Why not just put a `click` handler on the submit button?

Instead of using `submit` on the form, you *could* use `click` on the submit button. However, `submit` has the advantage that it also captures alternative ways to submit the form, such as pressing the *enter* key while typing into a text box.

### Parameters

 * Main parameter

   The function you want to bind to the element's `submit` event.

   You can reference any JavaScript function - it doesn't have to be a function on your view model. You can reference a function on any object by writing `submit: someObject.someFunction`.

   Functions on your view model are slightly special because you can reference them by name, i.e., you can write `submit: doSomething` and *don't* have to write `submit: viewModel.doSomething` (though technically that's also valid).

 * Additional parameters

   * None

### Notes

For information about how to pass additional parameters to your submit handler function, or how to control the `this` handle when invoking functions that aren't on your view model, see the notes relating to the [click binding](click-binding.html). All the notes on that page apply to `submit` handlers too.

### Dependencies

None, other than the core Knockout library.