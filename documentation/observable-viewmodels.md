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

### Other considerations

The observable viewmodel technique is now fully supported in Knockout 3.0 and will work with all of the built-in bindings. But if you are using any external or custom bindings in your UI, you will need to check that they are compatible. If not, you may be better off using the [`template`](template-binding.html) or [`with`](with-binding.html) bindings instead to handle swapping your viewmodel.

If you want your custom bindings to be compatible with observable view models, you'll need to make sure that they update correctly when the viewmodel changes. Here are some specific items to check for and change:

1. Don't use the `viewModel` parameter to access the viewmodel in the `init` method, because it will only ever point to the initial viewmodel. Instead, get the viewmodel object from the binding context parameter, using `$data` or the new `$rawData`.
2. Don't subscribe directly to observable values in the `init` method. Instead, use a computed observable that will also have a dependency on the observable view model, for example, by calling the `valueAccessor` function. Or just use your handler's `update` method to perform updates.
3. Don't create or apply bindings using values extracted from the viewmodel. Instead, supply a function when creating or applying bindings that returns the values using `valueAccessor` or `bindingContext.$rawData`.
4. Don't have code that uses the viewmodel or the binding value directly in the `init` method, unless you are sure that the code only needs to ever run once. Instead, use the `update` method or wrap the code in a computed observable.
