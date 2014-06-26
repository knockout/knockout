---
layout: documentation
title: The "component" binding
---

TODO

### Disposal and memory management

Optionally, your viewmodel class may have a `dispose` function. If implemented, Knockout will call this whenever the component is being torn down and removed from the DOM (e.g., because the corresponding item was removed from a `foreach`, or an `if` binding has become `false`).

You must use `dispose` to release any resources that aren't inherently garbage-collectable. For example:

 * `setInterval` callbacks will continue to fire until explicitly cleared.
   * Use `clearInterval(handle)` to stop them, otherwise your viewmodel might be held in memory.
 * `ko.computed` properties continue to receive notifications from their dependencies until explicitly disposed.
   * If a dependency is on an external object, then be sure to use `.dispose()` on the computed property, otherwise it (and possibly also your viewmodel) will be held in memory. Alternatively, consider using a `pureComputed` to avoid the need for manual disposal.
 * **Subscriptions** to observables continue to fire until explicitly disposed.
   * If you have subscribed to an external observable, be sure to use `.dispose()` on the subscription, otherwise the callback (and possibly also your viewmodel) will be held in memory.
 * Manually-created **event handlers** on external DOM elements, if created inside a `createViewModel` function (or even inside a regular component viewmodel, although to fit the MVVM pattern you shouldn't) must be removed.
   * Of course, you don't have to worry about releasing any event handlers created by standard Knockout bindings in your view, as KO automatically unregisters them when the elements are removed.

For example:

    function SomeComponentViewModel() {
        this.myComputed = ko.computed(function() {
            return someExternalObservable() + 1;
        }, this);

        this.mySubscription = someExternalObservable.subscribe(function(val) {
            console.log('The external observable changed to ' + val);
        }, this);

        this.myIntervalHandle = window.setInterval(function() {
            console.log('Another second passed, and the component is still alive.');
        }, 1000);
    }

    SomeComponentViewModel.prototype.dispose = function() {
        this.myComputed.dispose();
        this.mySubscription.dispose();
        window.clearInterval(this.myIntervalHandle);
    }

    ko.components.register('your-component-name', {
        viewModel: SomeComponentViewModel,
        template: 'some template'
    });

It isn't strictly necessary to dispose computeds and subscriptions that only depend on properties of the same viewmodel object, since this creates only a circular reference which JavaScript garbage collectors know how to release. However, to avoid having to remember which things need disposal, you may prefer to use `pureComputed` wherever possible, and explicitly dispose all other computeds/subscriptions whether technically necessary or not.
