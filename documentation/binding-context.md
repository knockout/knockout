---
layout: documentation
title: Binding context
---

### What is binding context?

Context refers to the view model properties and methods available to bindings. The root view model is specified as the first parameter to `ko.applyBindings`. Control flow bindings such as [`with`](with-binding.html) and [`foreach`](foreach-binding.html) change the binding context to a new, usually nested, view model.

### How does Knockout keep track of binding context?

Knockout creates a `bindingContext` object to keep track of the context. The properties of this object are also available to bindings and can be used to refer to properties of a parent context or to the view model object itself.

### bindingContext properties

* `$root`

    This is the main view model object in the root context.

* `$data`

    This is the view model object in the current context. In the root context, `$data` and `$root` are equivalent.

* `$parent`

    This is the view model object in the parent context, the one immeditely outside the current context. In the root context, this is undefined.

* `$parents`

    This is an array representing all of the parent view models:
        * `$parents[0]` is the view model from the parent context (i.e., it's the same as `$parent`)
        * `$parents[1]` is the view model from the grandparent context
        * `$parents[2]` is the view model from the great-grandparent context
        * ... and so on

* `$parentContext`

    This refers to the `bindingContext` object from the parent context. This is useful, for example, if you need to access the index value of an outer `foreach` item from an inner context (usage: `$parentContext.$index`). This is undefined in the root context.

* `$index`

    This is the zero-based index of the current item in the array within the context of the `foreach` binding. Unlike the other properties, `$index` is an observable and is updated whenever the index of the item changes (if items are added to or removed from the array).

### Controlling or modifying the binding context in custom bindings

Just like the built-in bindings `with` and `foreach`, custom bindings can change the binding context for their descendant elements, or provide special properties by extending the `bindingConext` object. This is described in detail under [creating custom bindings that control descendant bindings](custom-bindings-controlling-descendant-bindings.html).
