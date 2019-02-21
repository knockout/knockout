---
layout: documentation
title: The "class" and "css" bindings
redirect_from:
  - /documentation/class-binding.html
---

### Purpose
The `class` and `css` bindings add or remove one or more named CSS classes to the associated DOM element. This is useful, for example, to highlight some value in red if it becomes negative.

(Note: If you don't want to apply a CSS class but instead want to assign a `style` attribute value directly, see [the `style` binding](style-binding.html).)

### "class" binding example
    <div data-bind="class: profitStatus">
       Profit Information
    </div>

    <script type="text/javascript">
        var viewModel = {
            currentProfit: ko.observable(150000)
        };

        // Evalutes to a positive value, so initially we apply the "profitPositive" class
        viewModel.profitStatus = ko.pureComputed(function() {
            return this.currentProfit() < 0 ? "profitWarning" : "profitPositive";
        }, viewModel);

        // Causes the "profitPositive" class to be removed and "profitWarning" class to be added
        viewModel.currentProfit(-50);
    </script>

This will apply the CSS class `profitPositive` when the `currentProfit` value is positive; otherwise it will apply the `profitWarning` CSS class.

### "css" binding example
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

### "class" parameters

  * Main parameter

    The parameter value should be a string that corresponds to the CSS class or classes that you want to add to the element. If the parameter references an observable value, the binding will update the classes whenever the value changes, removing any previously added classes and adding the class or classes from new value.

    As usual, you can use arbitrary JavaScript expressions or functions as parameter values. Knockout will evaluate them and use the resulting value to determine the appropriate CSS classes to add or remove.

  * Additional parameters 

      * None

### "css" parameters

  * Main parameter

    You should pass a JavaScript object in which the property names are your CSS classes and their values evaluate to `true` or `false` according to whether the class should currently be applied.

    You can set multiple CSS classes at once. For example, if your view model has a property called `isSevere`,

        <div data-bind="css: { profitWarning: currentProfit() < 0, majorHighlight: isSevere }">

    You can even set multiple CSS classes based on the same condition by wrapping the names in quotes like:

        <div data-bind="css: { profitWarning: currentProfit() < 0, 'major highlight': isSevere }">

    Logically, `'major highlight': isSevere` is equivalent to `major: isSevere, highlight: isSevere`. It's merely a shortcut syntax if you want two or more CSS classes to be set and unset together.

    Non-boolean values are interpreted loosely as boolean. For example, `0` and `null` are treated as `false`, whereas `21` and non-`null` objects are treated as `true`. If your parameter references an observable value, the binding will add or remove the CSS class whenever the observable value changes. If the parameter doesn't reference an observable value, it will only add or remove the class once and will not do so again later. As usual, you can use arbitrary JavaScript expressions or functions as parameter values. Knockout will evaluate them and use the resulting values to determine the appropriate CSS classes to add or remove.

    For backward compatibility, you can also use the `css` binding with a string value like the `class` binding.

  * Additional parameters 

      * None

### Note: Using the "class" and "css" bindings at the same time

As long as they reference different CSS class names, you can include both `class` and `css` bindings on the same element. Thus you can have some classes that are set based on a `true/false` value and others that are calculated dynamically. For example:

    <div data-bind="css: { highlight: isSelected }, class: profitStatus">...</div>

### Note: Applying CSS classes whose names aren't legal JavaScript variable names

If you want to apply the CSS class `my-class`, you *can't* write this:

    <div data-bind="css: { my-class: someValue }">...</div>

... because `my-class` isn't a legal identifier name at that point. The solution is simple: just wrap the identifier name in quotes so that it becomes a string literal, which is legal in a JavaScript object literal. For example,

    <div data-bind="css: { 'my-class': someValue }">...</div>

### Dependencies

None, other than the core Knockout library.
