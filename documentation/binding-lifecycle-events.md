---
layout: documentation
title: Binding lifecycle events
---

*Note: This feature, introduced in Knockout 3.5.0, is experimental, and may change in future versions.*

Sometimes you might want to run custom post-processing logic on the DOM elements processed by Knockout. For example, if you're using a JavaScript widgets library such as jQuery UI, you might want to know when a certain section of the DOM is finished binding so that you can run jQuery UI commands on it to transform some of the rendered elements into date pickers, sliders, or anything else.

Knockout provides two similar events that you can use to be notified when the contents of a node have been bound.

1. `childrenComplete` — This event is notified **synchronously** once the child nodes (and all synchronously loaded descendants) have been bound.

2. `descendantsComplete` — This event is notified after all descendant nodes have been bound, even if those nodes were loaded and bound **asynchronously**. If all descendant nodes are bound synchronously, this event is notified right after `childrenComplete`.

These events will generally be notified even if a node is empty. If the node's contents are re-rendered, such as by a control-flow binding like [`with`](with-binding.html), these events will be notified again.

## Subscribing to lifecycle events

There are a few different methods to subscribe to these events depending on how and in which context you want to be notified.

### Bindings

To be notified in your view model, bind your callback function to the event through the node's `data-bind`. Pass a function reference (either a function literal or the name of a function on your view model), and Knockout will invoke it when that event is notified. For example,

    <div data-bind="childrenComplete: myPostProcessingLogic">...</div>

... and define a corresponding function on your view model:

    viewModel.myPostProcessingLogic = function (nodes) {
        // You can add custom post-processing logic here
    }

The provided callback will be run whenever the event is notified, *except if the node is empty*. For the `childrenComplete` event, the function is called with two parameters, an array of child nodes and the child view model. The `descendantsComplete` callback function is called with just the parent node.

### Components

To be notified in a [component](component-overview.html), you can register a callback function within the component's `createViewModel` method. Be sure to dispose the subscription within your component's `dispose` function as well, since a component may be disposed and re-created on the same element.

    ko.components.register('my-component', {
        viewModel: {
            createViewModel: function(params, componentInfo) {
                var sub = ko.bindingEvent.subscribe(componentInfo.element, 'descendantsComplete', function (node) {
                    // You can add custom post-processing logic here
                });
                
                var vm = new MyViewModel(params);
                vm.dispose = function () {
                    sub.dispose();
                }
            }
        },
        template: ...
    });

You can bind either event using `ko.bindingEvent.subscribe`, but importantly for components, which are asynchronous by default, the `descendantsComplete` event will wait for all child components to complete.

Alternatively, components also support a direct method to receive a `descendantsComplete` notification. If your component view model has a `koDescendantsComplete` function, Knockout will call it with the component's node once all descendants are bound. For example.

    function SomeComponentViewModel(params) { }

    SomeComponentViewModel.prototype.koDescendantsComplete = function (node) {
        // You can add custom post-processing logic here
    }

### Custom bindings

Like components, [custom bindings that control descendant bindings](custom-bindings-controlling-descendant-bindings.html) can use `ko.bindingEvent.subscribe` to run post-processing logic. However, in order to subscribe to the `descendantsComplete` event, you also need to tell Knockout that your binding is involved in asynchronous notifications.

    ko.bindingHandlers.myWidget = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            ko.bindingEvent.subscribe(element, 'descendantsComplete', function () {
                // Initialize the widget here
            });

            // startPossiblyAsyncContentBinding is necessary for descendant bindings to notify us of their completion
            var innerBindingContext = ko.bindingEvent.startPossiblyAsyncContentBinding(element, bindingContext);

            ko.applyBindingsToDescendants(innerBindingContext, element);

            return { controlsDescendantBindings: true };
        }
    };

Generally, there would be little reason to subscribe to the `childrenComplete` event in such a binding since it would be the same as just running your post-processing code after `ko.applyBindingsToDescendants`. 

## Indicating that a control-flow binding "completes" asynchronously

Normally, the [`with`](with-binding.html) and [`if`](if-binding.html) bindings notify "completeness" even if they are bound to a `null` or `false` value and therefore clear the node's contents instead of binding them. But if you use such a control-flow binding to delay binding until part of your viewmodel is finished initializing, it may be more appropriate to also delay the binding notifications. This could be important to delay an outer node's `descendantsComplete` event. To do so, include the `completeOn: "render"` option with the binding. For example:

    <div data-bind="descendantsComplete: myPostProcessingLogic">
        ...
        <div data-bind="with: resultData, completeOn: 'render'">
            <h3>Recent tweets fetched at <span data-bind="text: retrievalDate"></span></h3>
            <ol data-bind="foreach: topTweets">
                <li data-bind="text: text"></li>
            </ol>
        </div>
        ...
    </div>
    
Without the `completeOn` option, `myPostProcessingLogic` will be called even if `resultData` is not set intitially. With the option set as above, `myPostProcessingLogic` will only be called once `resultData` is set to a `true`-like value, and the contents of that node are rendered and bound.
