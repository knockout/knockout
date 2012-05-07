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
        ko.applyBindings(viewModel);
    </script>

Now, moving your mouse pointer on or off of the first element will invoke methods on the view model to toggle the `detailsEnabled` observable.  The second element reacts to changes to the value of `detailsEnabled` by either showing or hiding itself.

### Parameters

 * Main parameter

   You should pass a JavaScript object in which the property names correspond to event names, and the values correspond to the function that you want to bind to the event.

   You can reference any JavaScript function - it doesn't have to be a function on your view model. You can reference a function on any object by writing `event { mouseover: someObject.someFunction }`.

 * Additional parameters

   * None

### Note 1: Passing a "current item" as a parameter to your handler function

When calling your handler, Knockout will supply the current model value as the first parameter. This is particularly useful if you're rendering
some UI for each item in a collection, and you need to know which item the event refers to. For example,

    <ul data-bind="foreach: places">
        <li data-bind="text: $data, event: { mouseover: $parent.logMouseOver }"> </li>
    </ul>
    <p>You seem to be interested in: <span data-bind="text: lastInterest"> </span></p>

     <script type="text/javascript">
         function MyViewModel() {
             var self = this;
             self.lastInterest = ko.observable();
             self.places = ko.observableArray(['London', 'Paris', 'Tokyo']);

             // The current item will be passed as the first parameter, so we know which place was hovered over
             self.logMouseOver = function(place) {
                 self.lastInterest(place);
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

In some scenarios, you may need to access the DOM event object associated with your event. Knockout will pass the event as the second parameter to your function, as in this example:

    <div data-bind="event: { mouseover: myFunction }">
        Mouse over me
    </div>

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

    <div data-bind="event: { mouseover: function(data, event) { myFunction('param1', 'param2', data, event) } }">
        Mouse over me
    </div>

Now, KO will pass the event to your function literal, which is then available to be passed to your handler.

Alternatively, if you prefer to avoid the function literal in your view, you can use the [bind](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind) function, which attaches specific parameter values to a function reference:

    <button data-bind="event: { mouseover: myFunction.bind($data, 'param1', 'param2') }">
        Click me
    </button>

### Note 3: Allowing the default action

By default, Knockout will prevent the event from taking any default action. For example if you use the `event` binding to capture the `keypress` event of an `input` tag, the browser will only call your handler function and will *not* add the value of the key to the `input` element's value. A more common example is using [the click binding](click-binding.html), which internally uses this binding, where your handler function will be called, but the browser will *not* navigate to the link's `href`. This is a useful default because when you use the `click` binding, it's normally because you're using the link as part of a UI that manipulates your view model, not as a regular hyperlink to another web page.

However, if you *do* want to let the default action proceed, just return `true` from your `event` handler function.

### Note 4: Preventing the event from bubbling

By default, Knockout will allow the event to continue to bubble up to any higher level event handlers.  For example, if your element is handling a `mouseover` event and a parent of the element also handles that same event, then the event handler for both elements will be triggered.  If necessary, you can prevent the event from bubbling by including an additional binding that is named `youreventBubble` and passing false to it, as in this example:

        <div data-bind="event: { mouseover: myDivHandler }">
            <button data-bind="event: { mouseover: myButtonHandler }, mouseoverBubble: false">
                Click me
            </button>
        </div>

Normally, in this case `myButtonHandler` would be called first, then the event would bubble up to `myDivHandler`.  However, the `mouseoverBubble` binding that we added with a value of `false` prevents the event from making it past `myButtonHandler`.

### Dependencies

None, other than the core Knockout library.