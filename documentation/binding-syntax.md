---
layout: documentation
title: The data-bind syntax
---

Knockout's declarative binding system provides a concise and powerful way to link data to the UI. It's generally easy and obvious to bind to simple data properties or to use a single binding. For more complex bindings, it helps to better understand the behavior and syntax of Knockout's binding system.

### Binding syntax

A binding consists of two items, the binding *name* and *value*, separated by a colon. Here is an example of a single, simple binding:

    Today's message is: <span data-bind="text: myMessage"></span>

An element can include multiple bindings (related or unrelated), with each binding separated by a comma. Here are some examples:

    <!-- related bindings: valueUpdate is a parameter for value -->
    Your value: <input data-bind="value: someValue, valueUpdate: 'afterkeydown'" />

    <!-- unrelated bindings -->
    Cellphone: <input data-bind="value: cellphoneNumber, enable: hasCellphone" />

The binding *name* should generally match a registered binding handler (either built-in or [custom](custom-bindings.html)) or be a parameter for another binding. If the name matches neither of those, Knockout will ignore it (without any error or warning). So if a binding doesn't appear to work, first check that the name is correct.

#### Binding values

The binding *value* can be a single [value, variable, or literal](https://developer.mozilla.org/en-US/docs/JavaScript/Guide/Values,_variables,_and_literals) or almost any valid [JavaScript expression](https://developer.mozilla.org/en-US/docs/JavaScript/Guide/Expressions_and_Operators). Here are examples of various binding values:

    <!-- variable (usually a property of the current view model -->
    <div data-bind="visible: shouldShowMessage">...</div>

    <!-- comparison and conditional -->
    The item is <span data-bind="text: price() > 50 ? 'expensive' : 'cheap'"></span>.

    <!-- function call and comparison -->
    <button data-bind="enable: parseAreaCode(cellphoneNumber()) != '555'">...</button>

    <!-- function expression -->
    <div data-bind="click: function (data) { myFunction('param1', data) }">...</div>

    <!-- object literal (with unquoted and quoted property names) -->
    <div data-bind="with: {emotion: 'happy', 'facial-expression': 'smile'}">...</div>

These examples show that the value can be just about any JavaScript expression. Even the comma is fine when it's enclosed in braces, brackets, or parentheses. When the value is an object literal, the object's property names must be valid JavaScript identifiers or be enclosed in quotes. If the binding value is an invalid expression or references an unknown variable, Knockout will output an error and stop processing bindings.

#### Whitespace

Bindings can include any amount of *whitespace* (spaces, tab, and newlines), so you're free to use it to arrange your bindings as you like. The following examples are all equivalent:

    <!-- no spaces -->
    <select data-bind="options:availableCountries,optionsText:'countryName',value:selectedCountry,optionsCaption:'Choose...'"></select>

    <!-- some spaces -->
    <select data-bind="options : availableCountries, optionsText : 'countryName', value : selectedCountry, optionsCaption : 'Choose...'"></select>

    <!-- spaces and newlines -->
    <select data-bind="
        options: availableCountries,
        optionsText: 'countryName',
        value: selectedCountry,
        optionsCaption: 'Choose...'"></select>

#### Skipping the binding value

Starting with Knockout 3.0, you can specify bindings without a value, which will give the binding an `undefined` value. For example:

    <span data-bind="text">Text that will be cleared when bindings are applied.</span>
   
This ability is especially useful when paired with [binding preprocessing](binding-preprocessing.html), which can assign a default value for a binding.
