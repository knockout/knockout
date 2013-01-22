---
layout: documentation
title: The "if" binding
---

### Purpose
The `if` binding causes a section of markup to appear in your document (and to have its `data-bind` attributes applied), only if a specified expression evaluates to `true` (or a `true`-ish value such as a non-`null` object or nonempty string). 

`if` plays a similar role to [the `visible` binding](visible-binding.html). The difference is that, with `visible`, the contained markup always remains in the DOM and always has its `data-bind` attributes applied - the `visible` binding just uses CSS to toggle the container element's visiblity. The `if` binding, however, physically adds or removes the contained markup in your DOM, and only applies bindings to descendants if the expression is `true`.

### Example 1

This example shows that the `if` binding can dynamically add and remove sections of markup as observable values change.

{% capture live_example_view %}
<label><input type="checkbox" data-bind="checked: displayMessage" /> Display message</label>

<div data-bind="if: displayMessage">Here is a message. Astonishing.</div>
{% endcapture %}

{% capture live_example_viewmodel %}
ko.applyBindings({
    displayMessage: ko.observable(false)
});
{% endcapture %}

{% include live-example-minimal.html %}

### Example 2

In the following example, the `<div>` element will be empty for "Mercury", but populated for "Earth". That's because Earth has a non-null `capital` property, whereas "Mercury" has `null` for that property.

    <ul data-bind="foreach: planets">
        <li>
            Planet: <b data-bind="text: name"> </b>
            <div data-bind="if: capital">
                Capital: <b data-bind="text: capital.cityName"> </b>
            </div>
        </li>
    </ul>


    <script>
        ko.applyBindings({
            planets: [
                { name: 'Mercury', capital: null }, 
                { name: 'Earth', capital: { cityName: 'Barnsley' } }        
            ]
        });
    </script>

It's important to understand that the `if` binding really is vital to make this code work properly. Without it, there would be an error when trying to evaluate `capital.cityName` in the context of "Mercury" where `capital` is `null`. In JavaScript, you're not allowed to evaluate subproperties of `null` or `undefined` values.

### Parameters

 * Main parameter
 
   The expression you wish to evaluate. If it evaluates to `true` (or a true-ish value), the contained markup will be present in the document, and any `data-bind` attributes on it will be applied. If your expression evaluates to `false`, the contained markup will be removed from your document without first applying any bindings to it.

   If your expression involves any observable values, the expression will be re-evaluated whenever any of them change. Correspondingly, the markup within your `if` block can be added or removed dynamically as the result of the expression changes. `data-bind` attributes will be applied to **a new copy of the contained markup** whenever it is re-added.
     
 * Additional parameters 

   * None

### Note: Using "if" without a container element

Sometimes you may want to control the presence/absence of a section of markup *without* having any container element that can hold an `if` binding. For example, you might want to control whether a certain `<li>` element appears alongside siblings that always appear:

    <ul>
        <li>This item always appears</li>
        <li>I want to make this item present/absent dynamically</li>
    </ul>

In this case, you can't put `if` on the `<ul>` (because then it would affect the first `<li>` too), and you can't put any other container around the second `<li>` (because HTML doesn't allow extra containers within `<ul>`s).

To handle this, you can use the *containerless control flow syntax*, which is based on comment tags. For example,

    <ul>
        <li>This item always appears</li>
        <!-- ko if: someExpressionGoesHere -->
            <li>I want to make this item present/absent dynamically</li>
        <!-- /ko -->
    </ul>

The `<!-- ko -->` and `<!-- /ko -->` comments act as start/end markers, defining a "virtual element" that contains the markup inside. Knockout understands this virtual element syntax and binds as if you had a real container element.

### Dependencies

None, other than the core Knockout library.