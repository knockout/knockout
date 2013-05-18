---
layout: documentation
title: The "css" binding
---

### Purpose
The `css` binding adds or removes one or more named CSS classes to the associated DOM element. This is useful, for example, to highlight some value in red if it becomes negative.

(Note: If you don't want to apply a CSS class but instead want to assign a `style` attribute value directly, see [the style binding](style-binding.html).)

### Example with static classes
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

### Example with dynamic classes
    <div data-bind="css: profitStatus">
       Profit Information
    </div>

    <script type="text/javascript">
        var viewModel = {
            currentProfit: ko.observable(150000)
        };

        // Evalutes to a positive value, so initially we apply the "profitPositive" class
        viewModel.profitStatus = ko.computed(function() {
            return this.currentProfit() < 0 ? "profitWarning" : "profitPositive";
        }, viewModel);

        // Causes the "profitPositive" class to be removed and "profitWarning" class to be added
        viewModel.currentProfit(-50);
    </script>

This will apply the CSS class `profitPositive` when the `currentProfit` value is positive, otherwise it will apply the `profitWarning` CSS class.

### Parameters

 * Main parameter
   
   If you are using static CSS class names, then you can pass a JavaScript object in which the property names are your CSS classes, and their values evaluate to `true` or `false` according to whether the class should currently be applied.
 
   You can set multiple CSS classes at once. For example, if your view model has a property called `isSevere`,
   
       <div data-bind="css: { profitWarning: currentProfit() < 0, majorHighlight: isSevere }">

   You can even set multiple CSS classes based on the same condition by wrapping the names in quotes like:

       <div data-bind="css: { profitWarning: currentProfit() < 0, 'major highlight': isSevere }">
   
   Non-boolean values are interpreted loosely as boolean. For example, `0` and `null` are treated as `false`, whereas `21` and non-`null` objects are treated as `true`.
   
   If your parameter references an observable value, the binding will add or remove the CSS class whenever the observable value changes. If the parameter doesn't reference an observable value, it will only add or remove the class once and will not do so again later.

   If you want to use dynamic CSS class names, then you can pass a string that corresponds to the CSS class or classes that you want to add to the element. If the parameter references an observable value, then the binding will remove any previously added classes and add the class or classes corresponding to the observable's new value.
   
   As usual, you can use arbitrary JavaScript expressions or functions as parameter values. KO will evaluate them and use the resulting values to determine the appropriate CSS classes to add or remove.
   
 * Additional parameters 

   * None

### Note: Applying CSS classes whose names aren't legal JavaScript variable names

If you want to apply the CSS class `my-class`, you *can't* write this:

    <div data-bind="css: { my-class: someValue }">...</div>

... because `my-class` isn't a legal identifier name at that point. The solution is simple: just wrap the identifier name in quotes so that it becomes a string literal, which is legal in a JavaScript object literal. For example,

    <div data-bind="css: { 'my-class': someValue }">...</div>

### Dependencies

None, other than the core Knockout library.