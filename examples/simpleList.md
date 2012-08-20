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
    var SimpleListModel = function(items) {
        this.items = ko.observableArray(items);
        this.itemToAdd = ko.observable("");
        this.addItem = function() {
            if (this.itemToAdd() != "") {
                this.items.push(this.itemToAdd()); // Adds the item. Writing to the "items" observableArray causes any associated UI to update.
                this.itemToAdd(""); // Clears the text box, because it's bound to the "itemToAdd" observable
            }
        }.bind(this);  // Ensure that "this" is always this view model
    };

    ko.applyBindings(new SimpleListModel(["Alpha", "Beta", "Gamma"]));
{% endcapture %}
{% include live-example-tabs.html %}

[Try it in jsFiddle](http://jsfiddle.net/rniemeyer/bxfXd/)