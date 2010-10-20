---
layout: documentation
title: The "css" binding
---

### Purpose
The `css` binding adds or removes one or more named CSS classes to the associated DOM element. This is useful, for example, to highlight some value in red if it becomes negative.

(Note: If you don't want to apply a CSS class but instead want to assign a `style` attribute value directly, see [the style binding](style-binding.html).)

### Example
    <div data-bind="css: { profitWarning: currentProfit() < 0 }">
       Profit Information
    </div>
    
    <script type="text/javascript">
        var viewModel = {
            currentProfit: ko.observable(150000) // Positive value, so initially we don't apply the "profitWarning" class
        };
        viewModel.currentProfit(-50); // Causes the "profitWarning" class to be applied
    </script>

This will apply the CSS class `profitWarning` whenever the `currentProfit` value dips below zero, and remove that class whenever it goes above zero.

### Parameters

 * Main parameter
   
   You should pass a JavaScript object in which the property names are your CSS classes, and their values evaluate to `true` or `false` according to whether the class should currently be applied.
 
   You can set multiple CSS classes at once. For example, if your view model has a property called `isSevere`,
   
       <div data-bind="css: { profitWarning: currentProfit() < 0, majorHighlight: isSevere }">
   
   Non-boolean values are interpreted loosely as boolean. For example, `0` and `null` are treated as `false`, whereas `21` and non-`null` objects are treated as `true`.
   
   If your parameter references an observable value, the binding will add or remove the CSS class whenever the observable value changes. If the parameter doesn't reference an observable value, it will only add or remove the class once and will not do so again later.
   
   As usual, you can use arbitrary JavaScript expressions or functions as parameter values. KO will evaluate them and use the resulting values to detemine whether to apply the CSS class or remove it.
   
 * Additional parameters 

   * None

### Note: Applying CSS classes whose names aren't legal JavaScript variable names

If you want to apply the CSS class `my-class`, you *can't* write this:

    <div data-bind="css: { my-class: someValue }">...</div>

... because `my-class` isn't a legal identifier name at that point. The solution is simple: just wrap the identifier name in quotes so that it becomes a string literal. This is legal in a JavaScript object literal (technically, according to the JSON spec, you should always do this anyway, though in practice you don't have to). For example,

    <div data-bind="css: { 'my-class': someValue }">...</div>

### Dependencies

None, other than the core Knockout library.