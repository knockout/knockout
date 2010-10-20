---
layout: example
title: Simple list example
---

This example demonstrates binding to an array of values.

Notice how the "Add" button is enabled only when you have entered some text - check the HTML source code to see how to use the "enable" binding.

{% capture live_example_view %}
<form data-bind="submit: addItem">
    New item:
    <input data-bind='value: itemToAdd, valueUpdate: "afterkeydown"' />
    <button type="submit" data-bind="enable: itemToAdd().length > 0">Add</button>
    <p>Your items:</p>
    <select multiple="multiple" width="50" data-bind="options: items"> </select>
</form>

{% endcapture %}

{% capture live_example_viewmodel %}
    var viewModel = {};
    viewModel.items = ko.observableArray(["Alpha", "Beta", "Gamma"]);
    viewModel.itemToAdd = ko.observable("");
    viewModel.addItem = function () {
        if (viewModel.itemToAdd() != "") {
            viewModel.items.push(viewModel.itemToAdd()); // Adds the item. Writing to the "items" observableArray causes any associated UI to update.
            viewModel.itemToAdd("");                     // Clears the text box, because it's bound to the "itemToAdd" observable
        }
    }

    ko.applyBindings(viewModel);
{% endcapture %}
{% include live-example-tabs.html %}