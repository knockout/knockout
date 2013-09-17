---
layout: example
title: Paged grid
---

The `data-bind="..."` bindings like `text`, `visible`, and `click` are not fixed - you can easily add custom ones. If your custom binding merely adds event handlers or updates properties of a DOM element, you can implement it in just a few lines.

However, you can also use custom bindings as a way to create reusable components (or *plugins*) such as the `simpleGrid` binding demonstrated on this page.

If a plugin provides its own standard view model class (e.g., `ko.simpleGrid.viewModel` in this example), this provides both a way to configure how an instance of the plugin should work (in this example: page size, column definitions) and if properties on the view model are observable (in this example: current page index), it also makes it easy for external code to write to those properties and cause the UI to be updated. For example, see how the "Jump to first page" button works.

Take a look at the HTML source code - it's pretty easy to use and interact with this simple grid.

<script src="resources/knockout.simpleGrid.3.0.js" type="text/javascript"> </script>
<style type="text/css">
    .ko-grid { margin-bottom: 1em; width: 25em; border: 1px solid silver; background-color:White; }
    .ko-grid th { text-align:left; background-color: Black; color:White; }
    .ko-grid td, th { padding: 0.4em; }
    .ko-grid tr:nth-child(odd) { background-color: #DDD; }
    .ko-grid-pageLinks { margin-bottom: 1em; }
    .ko-grid-pageLinks a { padding: 0.5em; }
    .ko-grid-pageLinks a.selected { background-color: Black; color: White; }
    .liveExample { height:20em; overflow:auto } /* Mobile Safari reflows pages slowly, so fix the height to avoid the need for reflows */
</style>        

{% capture live_example_view %} 
<div data-bind='simpleGrid: gridViewModel'> </div>

<button data-bind='click: addItem'>
    Add item
</button>

<button data-bind='click: sortByName'>
    Sort by name
</button>

<button data-bind='click: jumpToFirstPage, enable: gridViewModel.currentPageIndex'>
    Jump to first page
</button> 
{% endcapture %}

{% capture live_example_viewmodel %}
    var initialData = [
        { name: "Well-Travelled Kitten", sales: 352, price: 75.95 },
        { name: "Speedy Coyote", sales: 89, price: 190.00 },
        { name: "Furious Lizard", sales: 152, price: 25.00 },
        { name: "Indifferent Monkey", sales: 1, price: 99.95 },
        { name: "Brooding Dragon", sales: 0, price: 6350 },
        { name: "Ingenious Tadpole", sales: 39450, price: 0.35 },
        { name: "Optimistic Snail", sales: 420, price: 1.50 }
    ];

    var PagedGridModel = function(items) {
        this.items = ko.observableArray(items);

        this.addItem = function() {
            this.items.push({ name: "New item", sales: 0, price: 100 });
        };

        this.sortByName = function() {
            this.items.sort(function(a, b) {
                return a.name < b.name ? -1 : 1;
            });
        };

        this.jumpToFirstPage = function() {
            this.gridViewModel.currentPageIndex(0);
        };

        this.gridViewModel = new ko.simpleGrid.viewModel({
            data: this.items,
            columns: [
                { headerText: "Item Name", rowText: "name" },
                { headerText: "Sales Count", rowText: "sales" },
                { headerText: "Price", rowText: function (item) { return "$" + item.price.toFixed(2) } }
            ],
            pageSize: 4
        });
    };

    ko.applyBindings(new PagedGridModel(initialData));
{% endcapture %}
{% include live-example-tabs.html %}

[Try it in jsFiddle](http://jsfiddle.net/rniemeyer/QSRBR/)