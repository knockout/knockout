---
layout: documentation
title: The "uniqueName" binding
---

### Purpose
The `uniqueName` binding ensures that the associated DOM element has a nonempty `name` attribute. If the DOM element did not have a `name` attribute, this binding gives it one and sets it to some unique string value.

You won't need to use this often. It's only useful in a few rare cases, e.g.:

  * Other technologies may depend on the assumption that certain elements have names, even though names might be irrelevant when you're using KO. For example, [jQuery Validation](http://docs.jquery.com/Plugins/validation) currently will only validate elements that have names. To use this with a Knockout UI, it's sometimes necessary to apply the `uniqueName` binding to avoid confusing jQuery Validation. See [an example of using jQuery Validation with KO](../examples/gridEditor.html).

  * IE 6 does not allow radio buttons to be checked if they don't have a `name` attribute. Most of the time this is irrelevant because your radio button elements *will* have name attributes to put them into mutually-exclusive groups. However, just in case you didn't add a `name` attribute because it's unnecessary in your case, KO will internally use `uniqueName` on those elements to ensure they can be checked.

### Example
    <input data-bind="value: someModelProperty, uniqueName: true" />

### Parameters

 * Main parameter
 
   Pass `true` (or some value that evaluates as true) to enable the `uniqueName` binding, as in the preceding example.
     
 * Additional parameters 

   * None

### Dependencies

None, other than the core Knockout library.