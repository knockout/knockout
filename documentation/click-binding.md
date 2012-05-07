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

 * Additional parameters

   * None

### Note 1: Passing a "current item" as a parameter to your handler function

When calling your handler, Knockout will supply the current model value as the first parameter. This is particularly useful if you're rendering
some UI for each item in a collection, and you need to know which item's UI was clicked. For example,

    <ul data-bind="foreach: places">
        <li>
            <span data-bind="text: $data"></span>
            <button data-bind="click: $parent.removePlace">Remove</button>
        </li>
    </ul>

     <script type="text/javascript">
         function MyViewModel() {
             var self = this;
             self.places = ko.observableArray(['London', 'Paris', 'Tokyo']);

             // The current item will be passed as the first parameter, so we know which place to remove
             self.removePlace = function(place) {
                 self.places.remove(place)
             }
         }
         ko.applyBindings(new MyViewModel());
    </script>

Two points to note about this example:

 * If you're inside a nested [binding context](binding-context.html), for example if you're inside a `foreach` or a `with` block, but your handler function
   is on the root viewmodel or some other parent context, you'll need to use a prefix such as `$parent` or `$root` to locate the
   handler function.
 * In your viewmodel, it's often useful to declare `self` (or some other variable) as an alias for `this`. Doing so avoids any problems
   with `this` being redefined to mean something else in event handlers or Ajax request callbacks.

### Note 2: Accessing the event object, or passing more parameters

In some scenarios, you may need to access the DOM event object associated with your click event. Knockout will pass the event as the second parameter to your function, as in this example:

    <button data-bind="click: myFunction">
        Click me
    </button>

     <script type="text/javascript">
        var viewModel = {
            myFunction: function(data, event) {
                if (event.shiftKey) {
                    //do something different when user has shift key down
                } else {
                    //do normal action
                }
            }
        };
        ko.applyBindings(viewModel);
    </script>

If you need to pass more parameters, one way to do it is by wrapping your handler in a function literal that takes in a parameter, as in this example:

    <button data-bind="click: function(data, event) { myFunction('param1', 'param2', data, event) }">
        Click me
    </button>

Now, KO will pass the data and event objects to your function literal, which are then available to be passed to your handler.

Alternatively, if you prefer to avoid the function literal in your view, you can use the [bind](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind) function, which attaches specific parameter values to a function reference:

    <button data-bind="click: myFunction.bind($data, 'param1', 'param2')">
        Click me
    </button>

### Note 3: Allowing the default click action

By default, Knockout will prevent the click event from taking any default action. This means that if you use the `click` binding on an `a` tag (a link), for example, the browser will only call your handler function and will *not* navigate to the link's `href`. This is a useful default because when you use the `click` binding, it's normally because you're using the link as part of a UI that manipulates your view model, not as a regular hyperlink to another web page.

However, if you *do* want to let the default click action proceed, just return `true` from your `click` handler function.

### Note 4: Preventing the event from bubbling

By default, Knockout will allow the click event to continue to bubble up to any higher level event handlers.  For example, if your element and a parent of that element are both handling the `click` event, then the click handler for both elements will be triggered.  If necessary, you can prevent the event from bubbling by including an additional binding that is named `clickBubble` and passing false to it, as in this example:

        <div data-bind="click: myDivHandler">
            <button data-bind="click: myButtonHandler, clickBubble: false">
                Click me
            </button>
        </div>

Normally, in this case `myButtonHandler` would be called first, then the click event would bubble up to `myDivHandler`.  However, the `clickBubble` binding that we added with a value of `false` prevents the event from making it past `myButtonHandler`.

### Dependencies

None, other than the core Knockout library.