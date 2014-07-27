---
layout: documentation
title: Computed Observable Reference
---

The following documentation describes how to construct and work with computed observables.

## Constructing a computed observable

A computed observable can be constructed using one of the following forms:

1. `ko.computed( evaluator [, targetObject, options] )` --- This form supports the most common case of creating a computed observable.
  * `evaluator` --- A function that is used to evaluate the computed observable's current value.
  * `targetObject` --- If given, defines the value of `this` whenever KO invokes your callback functions. See the section on [managing `this`](computedObservables.html#managing-this) for more information.
  * `options` --- An object with further properties for the computed observable. See the full list below.

1. `ko.computed( options )` --- This single parameter form for creating a computed observable accepts a JavaScript object with any of the following properties.
  * `read` --- Required. A function that is used to evaluate the computed observable's current value.
  * `write` --- Optional. If given, makes the computed observable writable. This is a function that receives values that other code is trying to write to your computed observable. It's up to you to supply custom logic to handle the incoming values, typically by writing the values to some underlying observable(s).
  * `owner` --- Optional. If given, defines the value of `this` whenever KO invokes your `read` or `write` callbacks.
  * `pure` --- Optional. If this option is `true`, the computed observable will be set up as a [*pure* computed observable](computed-pure.html). This option is an alternative to the `ko.pureComputed` constructor.
  * `deferEvaluation` --- Optional. If this option is `true`, then the value of the computed observable will not be evaluated until something actually attempts to access its value or manually subscribes to it. By default, a computed observable has its value determined immediately during creation.
  * `disposeWhen` --- Optional. If given, this function is executed on each re-evaluation to determine if the computed observable should be disposed. A `true`-ish result will trigger disposal of the computed observable.
  * `disposeWhenNodeIsRemoved` --- Optional. If given, disposal of the computed observable will be triggered when the specified DOM node is removed by KO. This feature is used to dispose computed observables used in bindings when nodes are removed by the `template` and control-flow bindings.
  
1. `ko.pureComputed( evaluator [, targetObject] )` --- Constructs a [*pure* computed observable](computed-pure.html) using the given evaluator function and optional object to use for `this`. Unlike `ko.computed`, this method doesn't accept an `options` parameter.

1. `ko.pureComputed( options )` --- Constructs a *pure* computed observable using an `options` object. This accepts the `read`, `write`, and `owner` options described above.

## Using a computed observable

A computed observable provides the following functions:

* `dispose()` --- Manually disposes the computed observable, clearing all subscriptions to dependencies. This function is useful if you want to stop a computed observable from being updated or want to clean up memory for a computed observable that has dependencies on observables that won't be cleaned.
* `extend(extenders)` --- Applies the given [extenders](extenders.html) to the computed observable.
* `getDependenciesCount()` --- Returns the current number of dependencies of the computed observable.
* `getSubscriptionsCount()` --- Returns the current number of subscriptions (either from other computed observables or manual subscriptions) of the computed observable.
* `isActive()` --- Returns whether the computed observable may be updated in the future. A computed observable is inactive if it has no dependencies.
* `peek()` --- Returns the current value of the computed observable without creating a dependency (see the section above on [`peek`](computed-dependency-tracking.html#controlling-dependencies-using-peek)).
* `subscribe( callback [,callbackTarget, event] )` --- Registers a [manual subscription](observables.html#explicitly-subscribing-to-observables) to be notified of changes to the computed observable.

## Using the computed context

During the execution of a computed observable's evaluator function, you can access `ko.computedContext` to get information about the current computed property. It provides the following functions:

* `isInitial()` --- A function that returns `true` if called during the first ever evaluation of the current computed observable, or `false` otherwise. For *pure* computed observables, `isInitial()` is always `undefined`.

* `getDependenciesCount()` --- Returns the number of dependencies of the computed observable detected so far during the current evaluation.
  * Note: `ko.computedContext.getDependenciesCount()` is equivalent to calling `getDependenciesCount()` on the computed observable itself. The reason that it also exists on `ko.computedContext` is to provide a way of counting the dependencies during the first ever evaluation, before the computed observable has even finished being constructed.

Example:

    var myComputed = ko.computed(function() {
        // ... Omitted: read some data that might be observable ...

        // Now let's inspect ko.computedContext
        var isFirstEvaluation = ko.computedContext.isInitial(),
            dependencyCount = ko.computedContext.getDependenciesCount(),
        console.log("Evaluating " + (isFirstEvaluation ? "for the first time" : "again"));
        console.log("By now, this computed has " + dependencyCount + " dependencies");

        // ... Omitted: return the result ...
    });

These facilities are typically useful only in advanced scenarios, for example when your computed observable's primary purpose is to trigger some side-effect during its evaluator, and you want to perform some setup logic only during the first run, or only if it has at least one dependency (and hence might re-evaluate in the future). Most computed properties do not need to care whether they have been evaluated before, or how many dependencies they have.