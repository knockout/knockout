---
layout: documentation
title: The "event" binding
---

### Purpose
The `event` binding allows you to add an event handler for a specified event so that your chosen JavaScript function will be invoked when that event is triggered for the associated DOM element. This can be used to bind to any event, such as `keypress`, `mouseover` or `mouseout`.

### Example
    <div>
        <div data-bind="event: { mouseover: enableDetails, mouseout: disableDetails }">
            Mouse over me
        </div>
        <div data-bind="visible: detailsEnabled">
            Details
        </div>
    </div>
    
    <script type="text/javascript">
        var viewModel = {
            detailsEnabled: ko.observable(false),
            enableDetails: function() {
                this.detailsEnabled(true);
            },
            disableDetails: function() {
                this.detailsEnabled(false);
            }
        };
    </script>

Now, moving your mouse pointer on or off of the first element will invoke methods on the view model to toggle the `detailsEnabled` observable.  The second element reacts to changes to the value of `detailsEnabled` by either showing or hiding itself. 

### Parameters

 * Main parameter
   
   You should pass a JavaScript object in which the property names correspond to event names, and the values correspond to the function that you want to bind to the event.
   
   You can reference any JavaScript function - it doesn't have to be a function on your view model. You can reference a function on any object by writing `event { mouseover: someObject.someFunction }`. 
   
   Functions on your view model are slightly special because you can reference them by name, i.e., you can write `event { mouseover: incrementClickCounter }` and *don't* have to write `event { mouseover: viewModel.incrementClickCounter }` (though technically that's also valid).
   
 * Additional parameters 

   * None

### Note 1: Passing parameters to your event handler function

The easiest way to pass parameters is to wrap up the handler in a function literal, as in this example:

    <button data-bind="event: { mouseover: function() { viewModel.myFunction('param1', 'param2') } }">
        Click me
    </button>

Now, KO will call your function literal, which will call `viewModel.myFunction()`, passing parameters `'param1'` and `'param2'`.

### Note 2: Accessing the event object

In some scenarios, you may need to access the event object associated with your event. Knockout will pass the event as the first parameter to your function, as in this example:

    <div data-bind="event: { mouseover: myFunction }">
        Mouse over me
    </div>
    
     <script type="text/javascript">
        var viewModel = {
            myFunction: function(event) {
                if (event.shiftKey) {
                    //do something different when user has shift key down
                } else {
                    //do normal action
                }
            }
        };
    </script>   

If you also need to pass parameters, you can accomplish this by wrapping your handler in a function literal that takes in a parameter, as in this example:

    <div data-bind="event: { mouseover: function(event) { viewModel.myFunction(event, 'param1', 'param2') } }">
        Mouse over me
    </div>

Now, KO will pass the event to your function literal, which is then available to be passed to your handler.    
    
### Note 3: Allowing the default action

By default, Knockout will prevent the event from taking any default action. For example if you use the `event` binding to capture the `keypress` event of an `input` tag, the browser will only call your handler function and will *not* add the value of the key to the `input` element's value. A more common example is using [the click binding](click-binding.html), which internally uses this binding, where your handler function will be called, but the browser will *not* navigate to the link's `href`. This is a useful default because when you use the `click` binding, it's normally because you're using the link as part of a UI that manipulates your view model, not as a regular hyperlink to another web page.

However, if you *do* want to let the default action proceed, just return `true` from your `event` handler function. 

### Note 4: Controlling the `this` handle

*Beginners may wish to ignore this section, as it's rarely something you'll need to care about. Advanced KO users may want to know about it, though.*

When KO invokes your event handler function, it sets `this` to be your view model (i.e., the view model you passed when activating KO by calling `ko.applyBindings`). This is convenient if you're calling a function on your view model, because then your function can reference other view model properties by referring to `this.someOtherViewModelProperty` as in the first example on this page.

If you want `this` to refer to some other object (usually because you're calling a function on some other model object), there are two straightforward options. Either works fine:

1. If you use the function literal syntax as in Note 1 above, you don't have to worry about `this` because your function literal can use arbitrary JavaScript code to invoke any other function using JavaScript's normal calling conventions.

2. If you don't use the function literal syntax but instead simply reference a function object directly, as in the `enableDetails` example at the top of this page, you can use `bind` to make the callback set `this` to any object of your choice. For example

        <div data-bind="event: { mouseover: someObject.someFunction.bind(someObject) }">
            Mouse over me
        </div>

If you're a C# or Java developer, you might wonder why with option 2 it's necessary to `bind` the function to a particular object, especially when you're already referencing it as `someObject.someFunction`. The reason is that, in JavaScript, functions themselves aren't part of classes - they're standalone objects in their own right. More than one object might hold a reference to the exact same `someFunction` function object, so when that function object is invoked, which object gets to be `this`? The runtime doesn't know unless you bind the function object to a specified object. KO by default sets it to be your view model, but you can override that using `bind`.

There's no requirement to use `bind` if you use the function literal syntax as in option 1, because the JavaScript code `someObject.someFunction()` means "invoke `someFunction`, setting `this` to be `someObject`".

### Note 5: Preventing the event from bubbling

By default, Knockout will allow the event to continue to bubble up to any higher level event handlers.  For example, if your element is handling a `mouseover` event and a parent of the element also handles that same event, then the event handler for both elements will be triggered.  If necessary, you can prevent the event from bubbling by including an additional binding that is named `youreventBubble` and passing false to it, as in this example:

        <div data-bind="event: { mouseover: myDivHandler }">
            <button data-bind="event: { mouseover: myButtonHandler }, mouseoverBubble: false">
                Click me
            </button>
        </div>

Normally, in this case `myButtonHandler` would be called first, then the event would bubble up to `myDivHandler`.  However, the `mouseoverBubble` binding that we added with a value of `false` prevents the event from making it past `myButtonHandler`.

### Dependencies

None, other than the core Knockout library.