---
layout: documentation
title: Creating custom bindings that control descendant bindings
---

*Note: This is an advanced technique, typically used only when creating libraries of reusable bindings. It's not something you'll normally need to do when building applications with Knockout.*

By default, bindings only affect the element to which they are applied. But what if you want to affect all descendant elements too? This is possible. Your binding can tell Knockout *not* to bind descendants at all, and then your custom binding can do whatever it likes to bind them in a different way.

To do this, simply return `{ controlsDescendantBindings: true }` from your binding's `init` function.

### Example: Controlling whether or not descendant bindings are applied

For a very simple example, here's a custom binding called `allowBindings` that allows descendant bindings to be applied only if its value is `true`. If the value is `false`, then `allowBindings` tells Knockout that it is responsible for descendant bindings so they won't be bound as usual.

    ko.bindingHandlers.allowBindings = {
        init: function(elem, valueAccessor) {
            // Let bindings proceed as normal *only if* my value is false
            var shouldAllowBindings = ko.unwrap(valueAccessor());
            return { controlsDescendantBindings: !shouldAllowBindings };
        }
    };

To see this take effect, here's a sample usage:

    <div data-bind="allowBindings: true">
        <!-- This will display Replacement, because bindings are applied -->
        <div data-bind="text: 'Replacement'">Original</div>
    </div>

    <div data-bind="allowBindings: false">
        <!-- This will display Original, because bindings are not applied -->
        <div data-bind="text: 'Replacement'">Original</div>
    </div>

### Example: Supplying additional values to descendant bindings

Normally, bindings that use `controlsDescendantBindings` will also call `ko.applyBindingsToDescendants(someBindingContext, element)` to apply the descendant bindings against some modified [binding context](binding-context.html). For example, you could have a binding called `withProperties` that attaches some extra properties to the binding context that will then be available to all descendant bindings:

    ko.bindingHandlers.withProperties = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            // Make a modified binding context, with a extra properties, and apply it to descendant elements
            var innerBindingContext = bindingContext.extend(valueAccessor);
            ko.applyBindingsToDescendants(innerBindingContext, element);

            // Also tell KO *not* to bind the descendants itself, otherwise they will be bound twice
            return { controlsDescendantBindings: true };
        }
    };

As you can see, binding contexts have an `extend` function that produces a clone with extra properties. The `extend` function accepts either an object with the properties to copy or a function that returns such an object. The function syntax is preferred so that future changes in the binding value are always updated in the binding context. This process doesn't affect the original binding context, so there is no danger of affecting sibling-level elements - it will only affect descendants.

Here's an example of using the above custom binding:

    <div data-bind="withProperties: { emotion: 'happy' }">
        Today I feel <span data-bind="text: emotion"></span>. <!-- Displays: happy -->
    </div>
    <div data-bind="withProperties: { emotion: 'whimsical' }">
        Today I feel <span data-bind="text: emotion"></span>. <!-- Displays: whimsical -->
    </div>

### Example: Adding extra levels in the binding context hierarchy

Bindings such as [`with`](with-binding.html) and [`foreach`](foreach-binding.html) create extra levels in the binding context hierarchy. This means that their descendants can access data at outer levels by using `$parent`, `$parents`, `$root`, or `$parentContext`.

If you want to do this in custom bindings, then instead of using `bindingContext.extend()`, use `bindingContext.createChildContext(someData)`. This returns a new binding context whose viewmodel is `someData` and whose `$parentContext` is `bindingContext`. If you want, you can then extend the child context with extra properties using `ko.utils.extend`. For example,

    ko.bindingHandlers.withProperties = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            // Make a modified binding context, with a extra properties, and apply it to descendant elements
            var childBindingContext = bindingContext.createChildContext(
                bindingContext.$rawData, 
                null, // Optionally, pass a string here as an alias for the data item in descendant contexts
                function(context) {
                    ko.utils.extend(context, valueAccessor());
                });
            ko.applyBindingsToDescendants(childBindingContext, element);

            // Also tell KO *not* to bind the descendants itself, otherwise they will be bound twice
            return { controlsDescendantBindings: true };
        }
    };

This updated `withProperties` binding could now be used in a nested way, with each level of nesting able to access the parent level via `$parentContext`:

    <div data-bind="withProperties: { displayMode: 'twoColumn' }">
        The outer display mode is <span data-bind="text: displayMode"></span>.
        <div data-bind="withProperties: { displayMode: 'doubleWidth' }">
            The inner display mode is <span data-bind="text: displayMode"></span>, but I haven't forgotten
            that the outer display mode is <span data-bind="text: $parentContext.displayMode"></span>.
        </div>
    </div>

By modifying binding contexts and controlling descendant bindings, you have a powerful and advanced tool to create custom binding mechanisms of your own.