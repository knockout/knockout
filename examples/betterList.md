---
layout: example
title: Better list example
---

This example builds on the earlier [simple list example](simpleList.html) by making it possible to remove items (with multi-selection) and to sort the list. The "remove" and "sort" buttons become disabled if they are not applicable (e.g., if there aren't enough items to sort).

Check out the HTML source code to see how little code all this takes. This example also shows how you can use function literals in bindings (see the binding for 'sort').
            
{% capture live_example_view %}        
<form data-bind="submit:addItem">
    Add item: <input type="text" data-bind='value:itemToAdd, valueUpdate: "afterkeydown"' />
    <button type="submit" data-bind="enable: itemToAdd().length > 0">Add</button>
</form>

<p>Your values:</p>
<select multiple="multiple" height="5" data-bind="options:allItems, selectedOptions:selectedItems"> </select>

<div>
    <button data-bind="click: removeSelected, enable: selectedItems().length > 0">Remove</button>
    <button data-bind="click: function() { allItems.sort() }, enable: allItems().length > 1">Sort</button>
</div>
{% endcapture %}

{% capture live_example_viewmodel %}
    // In this example, betterListModel is a class, and the view model is an instance of it.
    // See simpleList.html for an example of how to construct a view model without defining a class for it. Either technique works fine.
    var betterListModel = function () {
        this.itemToAdd = new ko.observable("");
        this.allItems = new ko.observableArray(["Fries", "Eggs Benedict", "Ham", "Cheese"]); // Initial items
        this.selectedItems = new ko.observableArray(["Ham"]);                                // Initial selection

        this.addItem = function () {
            if ((this.itemToAdd() != "") && (this.allItems.indexOf(this.itemToAdd()) < 0)) // Prevent blanks and duplicates
                this.allItems.push(this.itemToAdd());
            this.itemToAdd(""); // Clear the text box
        }

        this.removeSelected = function () {
            this.allItems.removeAll(this.selectedItems());
            this.selectedItems([]); // Clear selection
        }
    };

    ko.applyBindings(new betterListModel());
{% endcapture %}
{% include live-example-tabs.html %}