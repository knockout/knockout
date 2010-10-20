---
layout: documentation
title: The "click" binding
---

### Purpose
The `click` binding adds an event handler so that your chosen JavaScript function will be invoked when the associated DOM element is clicked. This is most commonly used with elements like `button`, `input`, and `a`, but actually works with any visible DOM element.

### Example
    <div>
        You've clicked <span data-bind="text: numberOfClicks"></span> times
        <button data-bind="click: incrementClickCounter">Click me</button>
    </div>
    
    <script type="text/javascript">
        var viewModel = {
            numberOfClicks : ko.observable(0),
            incrementClickCounter : function() {
                var previousCount = this.numberOfClicks();
                this.numberOfClicks(previousCount + 1);
            }
        };
    </script>

Each time you click the button, this will invoke `incrementClickCounter()` on the view model, which in turn changes the view model state, which causes the UI to update.

### Parameters

 * Main parameter
   
   The function you want to bind to the element's `click` event. 
   
   You can reference any JavaScript function - it doesn't have to be a function on your view model. You can reference a function on any object by writing `click: someObject.someFunction`. 
   
   Functions on your view model are slightly special because you can reference them by name, i.e., you can write `click: incrementClickCounter` and *don't* have to write `click: viewModel.incrementClickCounter` (though technically that's also valid).
   
 * Additional parameters 

   * None

### Note 1: Passing parameters to your click handler function

The easiest way to pass parameters is to wrap up the handler in a function literal, as in this example:

    <button data-bind="click: function() { viewModel.myFunction('param1', 'param2') }">
        Click me
    </button>

Now, KO will call your function literal without passing any parameters (because it doesn't have any parameters to pass to you...), and then your function literal will call `viewModel.myFunction()`, passing parameters `'param1'` and `'param2'`.

### Note 2: Allowing the default click action

By default, Knockout will prevent the click event from taking any default action. This means that if you use the `click` binding on an `a` tag (a link), for example, the browser will only call your handler function and will *not* navigate to the link's `href`. This is a useful default because when you use the `click` binding, it's normally because you're using the link as part of a UI that manipulates your view model, not as a regular hyperlink to another web page.

However, if you *do* want to let the default click action proceed, just return `true` from your `click` handler function. 

### Note 3: Controlling the `this` handle

*Beginners may wish to ignore this section, as it's rarely something you'll need to care about. Advanced KO users may want to know about it, though.*

When KO invokes your click handler function, it sets `this` to be your view model (i.e., the view model you passed when activating KO by calling `ko.applyBindings`). This is convenient if you're calling a function on your view model, because then your function can reference other view model properties by referring to `this.someOtherViewModelProperty` as in the first example on this page.

If you want `this` to refer to some other object (usually because you're calling a function on some other model object), there are two straightforward options. Either works fine:

1. If you use the function literal syntax as in Note 1 above, you don't have to worry about `this` because your function literal can use arbitrary JavaScript code to invoke any other function using JavaScript's normal calling conventions.

2. If you don't use the function literal syntax but instead simply reference a function object directly, as in the `incrementClickCount` example at the top of this page, you can use `bind` to make the callback set `this` to any object of your choice. For example

         <button data-bind="click: someObject.someFunction.bind(someObject)">
             Click me
         </button> 

If you're a C# or Java developer, you might wonder why with option 2 it's necessary to `bind` the function to a particular object, especially when you're already referencing it as `someObject.someFunction`. The reason is that, in JavaScript, functions themselves aren't part of classes - they're standalone objects in their own right. More than one object might hold a reference to the exact same `someFunction` function object, so when that function object is invoked, which object gets to be `this`? The runtime doesn't know unless you bind the function object to a specified object. KO by default sets it to be your view model, but you can override that using `bind`.

There's no requirement to use `bind` if you use the function literal syntax as in option 1, because the JavaScript code `someObject.someFunction()` means "invoke `someFunction`, setting `this` to be `someObject`".

### Dependencies

None, other than the core Knockout library.