---
layout: documentation
title: The "text" binding
---

### Purpose
The `text` binding causes the associated DOM element to display the text value of your parameter.

Typically this is useful with elements like `<span>` or `<em>` that traditionally display text, but technically you can use it with any element.

### Example
    Today's message is: <span data-bind="text: myMessage"></span>

    <script type="text/javascript">
        var viewModel = {
            myMessage: ko.observable() // Initially blank
        };
        viewModel.myMessage("Hello, world!"); // Text appears
    </script>

### Parameters

 * Main parameter

   Knockout sets the element's content to a text node with your parameter value. Any previous content will be overwritten.

   If this parameter is an observable value, the binding will update the element's text whenever the value changes. If the parameter isn't observable, it will only set the element's text once and will not update it again later.

   If you supply something other than a number or a string (e.g., you pass an object or an array), the displayed text will be equivalent to `yourParameter.toString()`

 * Additional parameters

   * None

### Note 1: Using functions and expressions to detemine text values

If you want to detemine text programmatically, one option is to create a [computed observable](computedObservables.html), and use its evaluator function as a place for your code that works out what text to display.

For example,

    The item is <span data-bind="text: priceRating"></span> today.

    <script type="text/javascript">
        var viewModel = {
            price: ko.observable(24.95)
        };
        viewModel.priceRating = ko.computed(function() {
            return this.price() > 50 ? "expensive" : "affordable";
        }, viewModel);
    </script>

Now, the text will switch between "expensive" and "affordable" as needed whenever `price` changes.

Alternatively, you don't need to create a computed observable if you're doing something simple like this. You can pass an arbitrary JavaScript expression to the `text` binding. For example,

    The item is <span data-bind="text: price() > 50 ? 'expensive' : 'affordable'"></span> today.

This has exactly the same result, without requiring the `priceRating` computed observable.

### Note 2: About HTML encoding

Since this binding sets your text value using a text node, it's safe to set any string value without risking HTML or script injection. For example, if you wrote:

    viewModel.myMessage("<i>Hello, world!</i>");

... this would *not* render as italic text, but would render as literal text with visible angle brackets.

If you need to set HTML content in this manner, see [the html binding](html-binding.html).

### Note 3: Using "text" without a container element

Sometimes you may want to set text using Knockout without including an extra element for the `text` binding. For example, you're not allowed to include other elements within an `option` element, so the following will not work.

    <select data-bind="foreach: items">
        <option>Item <span data-bind="text: name"></span></option>
    </select>

To handle this, you can use the *containerless syntax*, which is based on comment tags.

    <select data-bind="foreach: items">
        <option>Item <!--ko text: name--><!--/ko--></option>
    </select>

The `<!--ko-->` and `<!--/ko-->` comments act as start/end markers, defining a "virtual element" that contains the markup inside. Knockout understands this virtual element syntax and binds as if you had a real container element.

### Note 4: About an IE 6 whitespace quirk

IE 6 has a strange quirk whereby it sometimes ignores whitespace that immediately follows an empty span. This has nothing directly to do with Knockout, but in case you do want to write:

    Welcome, <span data-bind="text: userName"></span> to our web site.

... and IE 6 renders no whitespace before the words `to our web site`, you can avoid the problem by putting any text into the `<span>`, e.g.:

    Welcome, <span data-bind="text: userName">&nbsp;</span> to our web site.

Other browsers, and newer versions of IE, don't have this quirk.

### Dependencies

None, other than the core Knockout library.