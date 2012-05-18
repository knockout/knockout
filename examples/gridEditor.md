---
layout: example
title: Grid editor example
---

An example of using the 'foreach' binding to render content for each item in an array. When you add or remove items, Knockout doesn't need to re-render everything - it only renders the appropriate elements for the new item. The means the state of other rich UI controls (e.g., validators) isn't wiped out.

For a detailed step-by-step tutorial about building this example and integrating it with ASP.NET MVC, see [this blog post](http://blog.stevensanderson.com/2010/07/12/editing-a-variable-length-list-knockout-style/).

<style type="text/css">
    .liveExample table, .liveExample td, .liveExample th { padding: 0.2em; border-width: 0; }
    .liveExample td input { width: 13em; }
    tr { vertical-align: top; }
    .liveExample input.error { border: 1px solid red; background-color: #FDC; }
    .liveExample label.error { display: block; color: Red; font-size: 0.8em; }    
</style>
<script type="text/javascript" src="../js/jquery.validate.js"> </script>

{% capture live_example_view %}
<form action='/someServerSideHandler'>
    <p>You have asked for <span data-bind='text: gifts().length'>&nbsp;</span> gift(s)</p>
    <table data-bind='visible: gifts().length > 0'>
        <thead>
            <tr>
                <th>Gift name</th>
                <th>Price</th>
                <th />
            </tr>
        </thead>
        <tbody data-bind='foreach: gifts'>
            <tr>
                <td><input class='required' data-bind='value: name, uniqueName: true' /></td>
                <td><input class='required number' data-bind='value: price, uniqueName: true' /></td>
                <td><a href='#' data-bind='click: $root.removeGift'>Delete</a></td>
            </tr>
        </tbody>
    </table>

    <button data-bind='click: addGift'>Add Gift</button>
    <button data-bind='enable: gifts().length > 0' type='submit'>Submit</button>
</form>
{% endcapture %}

{% capture live_example_viewmodel %}
var GiftModel = function(gifts) {
    var self = this;
    self.gifts = ko.observableArray(gifts);

    self.addGift = function() {
        self.gifts.push({
            name: "",
            price: ""
        });
    };

    self.removeGift = function(gift) {
        self.gifts.remove(gift);
    };

    self.save = function(form) {
        alert("Could now transmit to server: " + ko.utils.stringifyJson(self.gifts));
        // To actually transmit to server as a regular form post, write this: ko.utils.postJson($("form")[0], self.gifts);
    };
};

var viewModel = new GiftModel([
    { name: "Tall Hat", price: "39.95"},
    { name: "Long Cloak", price: "120.00"}
]);
ko.applyBindings(viewModel);

// Activate jQuery Validation
$("form").validate({ submitHandler: viewModel.save });
{% endcapture %}
{% include live-example-tabs.html %}

[Try it in jsFiddle](http://jsfiddle.net/rniemeyer/7RDc3/)