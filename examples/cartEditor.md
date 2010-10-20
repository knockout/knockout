---
layout: example
title: Cart editor example
---

<script type="text/javascript" src="resources/sampleProductCategories.js"> </script>
<style type="text/css">        	
    .liveExample th { text-align: left }
    .liveExample .price { text-align: right; padding-right: 2em; }
    .liveExample .grandTotal { border-top: 1px solid silver; padding-top: 0.5em; font-size: 1.2em; }
    .liveExample .grandTotal SPAN { font-weight: bold; }
    
    .liveExample table, .liveExample td, .liveExample th { padding: 0.2em; border-width: 0; margin: 0; vertical-align: top; }
    .liveExample td input, .liveExample td select { width: 8em; }
    .liveExample td.quantity input { width: 4em; }
    .liveExample td select { height: 1.8em; white-space: nowrap; }
</style>

This example shows how dependent observables can be chained together. Each cart line has a `dependentObservable` to compute its own subtotal, and these in turn are combined in a further `dependentObservable` that computes the grand total. When you change the data, your changes ripple out through this chain of dependent observables, and all associated UI is updated.

This example also demonstrates a simple way to create cascading dropdowns.

{% capture live_example_view %}
<div id="cartEditor">
    <table width="100%">
        <thead>
            <tr>
                <th width="25%">Category</th>
                <th width="25%">Product</th>
                <th width="15%" class='price'>Price</th>
                <th width="10%" class='quantity'>Quantity</th>
                <th width="15%" class='price'>Subtotal</th>
                <th width="10%"> </th>
            </tr>
        </thead>
        <tbody data-bind='template: {name: "cartRowTemplate", foreach: lines}'> </tbody>
    </table>
    <p class="grandTotal">
        Total value: <span data-bind="text: formatCurrency(grandTotal())"> </span>            	
    </p>
    <button data-bind="click: addLine">Add product</button>
    <button data-bind="click: save">Submit order</button>
</div>
        
<script type="text/html" id="cartRowTemplate">
    <tr>
        <td><select data-bind='options: sampleProductCategories, optionsText: "name", optionsCaption: "Select...", value: category'></select></td>
        <td><select data-bind='visible: category, options: category() ? category().products : null, optionsText: "name", optionsCaption: "Select...", value: product'></select></td>
        <td class='price'><span data-bind='text: product() ? formatCurrency(product().price) : ""'></span></td>
        <td class='quantity'><input data-bind='visible: product, value: quantity, valueUpdate: "afterkeydown"' /></td>
        <td class='price'><span data-bind='visible: product, text: formatCurrency(subtotal())'></span></td>
        <td><a href="#" data-bind='click: function() { cartViewModel.removeLine($data) }'>Remove</a></td>
    </tr>
</script>

{% endcapture %}

{% capture live_example_viewmodel %}
    function formatCurrency(value) { return "$" + value.toFixed(2); }
    
    var cartLine = function() {
        this.category = ko.observable();
        this.product = ko.observable();
        this.quantity = ko.observable(1);        		
        this.subtotal = ko.dependentObservable(function() {
            return this.product() ? this.product().price * parseInt("0"+this.quantity(), 10) : 0;
        }.bind(this));
        
        // Whenever the category changes, reset the product selection
        this.category.subscribe(function() { this.product(undefined); }.bind(this));
    };
    var cart = function() {
        // Stores an array of lines, and from these, can work out the grandTotal
        this.lines = ko.observableArray([new cartLine()]);   // Put one line in by default     		
        this.grandTotal = ko.dependentObservable(function() {
            var total = 0;
            for (var i = 0; i < this.lines().length; i++)
                total += this.lines()[i].subtotal();
            return total;
        }.bind(this));
        
        // Operations
        this.addLine = function() { this.lines.push(new cartLine()) };
        this.removeLine = function(line) { this.lines.remove(line) };
        this.save = function() {
            var dataToSave = $.map(this.lines(), function(line) { 
                return line.product() ? { productName: line.product().name, quantity: line.quantity() } : undefined     				
            });
            alert("Could now send this to server: " + JSON.stringify(dataToSave));
        };
    };

    var cartViewModel = new cart();
    ko.applyBindings(cartViewModel, document.getElementById("cartEditor"));
{% endcapture %}
{% include live-example-tabs.html %}