---
layout: documentation
title: Swapping entire viewmodels dynamically
---

As you will know, when an observable property on your viewmodel changes, Knockout automatically reacts by updating any affected computed properties and refreshing any affected UI. But what if you want to change the *entire viewmodel instance* instead of just some property inside it?

This is easy to achieve, because you can wrap your entire viewmodel inside a `ko.observable`, and pass this observable value to `ko.applyBindings`. Then, if the viewmodel inside that observable changes, Knockout will refresh all affected parts of the UI as you'd expect.

### Example: Swapping an entire viewmodel

In this example, the top-level viewmodel changes every few seconds:

{% capture live_example_view %}
<fieldset>
    <legend>Featured menu item</legend>
    <h3 data-bind="text: title"> </h3>
    <p data-bind="text: description"> </p>
    <strong>$<span data-bind="text: price.toFixed(2)"> </span></strong>
</fieldset>
{% endcapture %}

{% capture live_example_viewmodel %}
var product1 = { title: "Custard tart", description: "Delicious Portuguese delicacy. Perfect with a latte.", price: 1.5 },
    product2 = { title: "Multigrain muffin", description: "It's basically a cake, but you can pretend it's healthy.", price: 2.49 },
    observableViewModel = ko.observable(product1);

ko.applyBindings(observableViewModel);

// Swap the top-level viewmodel
window.setInterval(function() {
    // Figure out which one is next
    var newProduct = observableViewModel() === product1 ? product2 : product1;

    // Now perform the swap
    observableViewModel(newProduct);
}, 3000);

{% endcapture %}

{% include live-example-minimal.html %}

#### Don't forget the "with" binding

Of course, there are much easier and more flexible ways of swapping sections of your viewmodel and view, for example using a [`with` binding](with-binding.html), so you should only use the observable viewmodel technique if you have a strong and specific reason.
