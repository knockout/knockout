---
layout: documentation
title: The "attr" binding
---

### Purpose
The `attr` binding provides a generic way to set the value of any attribute for the associated DOM element. This is useful, for example, when you need to set the `title` attribute of an element, the `src` of an `img` tag, or the `href` of a link based on values in your view model, with the attribute value being updated automatically whenever the corresponding model property changes.

### Example
    <a data-bind="attr: { href: url, title: details }">
        Report
    </a>
    
    <script type="text/javascript">
        var viewModel = {
            url: ko.observable("year-end.html"),
            details: ko.observable("Report including final year-end statistics")
        };
    </script>

This will set the element's `href` attribute to `year-end.html` and the element's `title` attribute to `Report including final year-end statistics`.

### Parameters

  * Main parameter
   
    You should pass a JavaScript object in which the property names correspond to attribute names, and the values correspond to the attribute values you wish to apply.
 
    If your parameter references an observable value, the binding will update the attribute whenever the observable value changes. If the parameter doesn't reference an observable value, it will only set the attribute once and will not update it later.
   
  * Additional parameters 

     * None
   
### Note: Setting attributes whose names aren't legal JavaScript variable names

If you want to apply the attribute `data-something`, you *can't* write this:

    <div data-bind="attr: { data-something: someValue }">...</div>

... because `data-something` isn't a legal identifier name at that point. The solution is simple: just wrap the identifier name in quotes so that it becomes a string literal, which is legal in a JavaScript object literal. For example,

    <div data-bind="attr: { 'data-something': someValue }">...</div>
    
### Note: Setting attributes with a namespace

The `attr` binding can be used to set attributes that include a namespace, such as `xlink:href`:

    <a data-bind="attr: { 'xlink:href': href }">
        <ellipse data-bind="attr: red" />
    </a>

### Note: Using reserved words as attribute names in older browsers

In older browsers (ie8 and below) using reserved javascript words as attribute names causes an error. You can get around this by quoting them like this:

    <input data-bind="attr: { 'for': someValue }" />

You can find a good list of reserved words on [Mozilla's MDN page here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#Keywords).

### Dependencies

None, other than the core Knockout library.