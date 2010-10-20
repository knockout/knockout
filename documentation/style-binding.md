---
layout: documentation
title: The "style" binding
---

### Purpose
The `style` binding adds or removes one or more style values to the associated DOM element. This is useful, for example, to highlight some value in red if it becomes negative, or to set the width of a bar to match a numerical value that changes.

(Note: If you don't want to apply an explicit style value but instead want to assign a CSS class, see [the css binding](css-binding.html).)

### Example
    <div data-bind="style: { color: currentProfit() < 0 ? 'red' : 'black' }">
       Profit Information
    </div>
    
    <script type="text/javascript">
        var viewModel = {
            currentProfit: ko.observable(150000) // Positive value, so initially black
        };
        viewModel.currentProfit(-50); // Causes the DIV's contents to go red
    </script>

This will set the element's `style.color` property to `red` whenever the `currentProfit` value dips below zero, and to `black` whenever it goes above zero.

### Parameters

 * Main parameter
   
   You should pass a JavaScript object in which the property names correspond to style names, and the values correspond to the style values you wish to apply.
 
   You can set multiple style values at once. For example, if your view model has a property called `isSevere`,
   
   `<div data-bind="style: { color: currentProfit() < 0 ? 'red' : 'black', fontWeight: isSevere() ? 'bold' : '' }">...</div>`
   
   If your parameter references an observable value, the binding will update the styles whenever the observable value changes. If the parameter doesn't reference an observable value, it will only set the styles once and will not update them later.
   
   As usual, you can use arbitrary JavaScript expressions or functions as parameter values. KO will evaluate them and use the resulting values to detemine the style values to apply.
   
 * Additional parameters 

   * None

### Note: Applying styles whose names aren't legal JavaScript variable names

If you want to apply a `font-weight` or `text-decoration` style, or any other style whose name isn't a legal JavaScript identifier (e.g., because it contains a hyphen), you must use the *JavaScript name* for that style. For example,

* Don't write `{ font-weight: someValue }`; do write `{ fontWeight: someValue }`
* Don't write `{ text-decoration: someValue }`; do write `{ textDecoration: someValue }`

See also: [a longer list of style names and their JavaScript equivalents](http://www.comptechdoc.org/independent/web/cgi/javamanual/javastyle.html)

### Dependencies

None, other than the core Knockout library.