---
layout: documentation
title: The "component" binding
---

The `component` binding injects a specified [component](component-overview.html) into an element, and optionally passes parameters to it.

* [Table of contents injected here]
{:toc}

### Live example

<style type="text/css">
    .liveExample h4 { margin-bottom: 0.3em; }
    .liveExample h4:first-of-type { margin-top: 0; }
</style>

{% capture live_example_viewmodel %}
    ko.components.register('message-editor', {
        viewModel: function(params) {
            this.text = ko.observable(params && params.initialText || '');
        },
        template: 'Message: <input data-bind="value: text" /> '
                + '(length: <span data-bind="text: text().length"></span>)'
    });

    ko.applyBindings();
{% endcapture %}
{% capture live_example_view %}
    <h4>First instance, without parameters</h4>
    <div data-bind='component: "message-editor"'></div>

    <h4>Second instance, passing parameters</h4>
    <div data-bind='component: {
        name: "message-editor",
        params: { initialText: "Hello, world!" }
    }'></div>
{% endcapture %}
{% include live-example-minimal.html %}

Note: In more realistic cases, you would typically load component viewmodels and templates from external files, instead of hardcoding them into the registration. See [an example](component-overview.html#example-loading-the-likedislike-widget-from-external-files-on-demand) and [registration documentation](component-registration.html).

### API

There are two ways to use the `component` binding:

 * **Shorthand syntax**
   
   If you pass just a string, it is interpreted as a component name. The named component is then injected without supplying any parameters to it. Example:

         <div data-bind='component: "my-component"'></div>

     The shorthand value can also be observable. In this case, if it changes, the `component` binding will [dispose](#disposal-and-memory-management) the old component instance, and inject the newly-referenced component. Example:

         <div data-bind='component: observableWhoseValueIsAComponentName'></div>

 * **Full syntax**

   To supply parameters to the component, pass an object with the following properties:

   * `name` --- the name of the component to inject. Again, this can be observable.
   * `params` --- an object that will be passed on to the component. Typically this is a key-value object containing multiple parameters, and is typically received by the component's viewmodel constructor.

   Example:

         <div data-bind='component: {
             name: "shopping-cart",
             params: { mode: "detailed-list", items: productsList }
         }'></div>

Note that whenever a component is removed (either because the `name` observable changed, or because an enclosing control-flow binding removed the entire element), the removed component is [disposed](#disposal-and-memory-management)

### Component lifecycle

When a `component` binding injects a component,

 1. **Your component loaders are asked to supply the viewmodel factory and template**

    This is an *asynchronous* process (it may involve requests to the server), and hence components are always injected asynchronously.

      * Multiple component loaders may be consulted, until the first one recognises the component name and supplies a viewmodel/template. This process only takes place **once per component type**, since Knockout caches the resulting definitions in memory.
      * The default component loader supplies viewmodels/templates based on [what you have registered](component-registration.html). If applicable, this is the phase where it requests any specified AMD modules from your AMD loader.

 2. **The component template is cloned and injected into the container element**

    Any existing content is removed and discarded.

 3. **If the component has a viewmodel, it is instantiated**

    If the viewmodel is given as a constructor function, this means Knockout calls `new YourViewModel(params)`.

    If the viewmodel is given as a `createViewModel` factory function, Knockout calls `createViewModel(params, componentInfo)`, where `componentInfo.element` is the element into which the not-yet-bound template has already been injected.

    This phase always completes synchronously (constructors and factory functions are not allowed to be asynchronous), since it occurs *every time a component is instantiated* and performance would be unacceptable if it involved waiting for network requests.

 4. **The viewmodel is bound to the view**

    Or, if the component has no viewmodel, then the view is bound to any `params` you've supplied to the `component` binding.

 5. **The component is active**

    Now the component is operating, and can remain on-screen for as long as needed.

    If any of the parameters passed to the component is observable, then the component can of course observe any changes, or even write back modified values. This is how it can communicate cleanly with its parent, without tightly coupling the component code to any parent that uses it.

 6. **The component is torn down, and the viewmodel is disposed**

    If the `component` binding's `name` value changes observably, or if an enclosing control-flow binding causes the container element to be removed, then any `dispose` function on the viewmodel is called just before the container element is removed from the DOM. See also: [disposal and memory management](#disposal-and-memory-management).

    Note: If the user navigates to an entirely different web page, browsers do this without asking any code running in the page to clean up. So in this case no `dispose` functions will be invoked. This is OK because the browser will automatically release the memory used by all objects that were in use.

### Note: Template-only components

Components usually have viewmodels, but they don't necessarily have to. A component can specify just a template.

In this case, the object to which the component's view is bound is the `params` object that you passed to the `component` binding. Example:

    ko.components.register('special-offer', {
        template: '<div class="offer-box" data-bind="text: productName"></div>'
    });

... can be injected with:

    <div data-bind='component: {
         name: "special-offer-callout",
         params: { productName: someProduct.name }
    }'></div>

... or, more conveniently, as a [custom element](component-custom-elements.html):

    <special-offer params='productName: someProduct.name'></special-offer>

### Note: Using `component` without a container element

Sometimes you may want to inject a component into a view without using an extra container element. You can do this using *containerless control flow syntax*, which is based on comment tags. For example,

    <!-- ko component: "message-editor" -->
    <!-- /ko -->

... or passing parameters:

    <!-- ko component: {
        name: "message-editor",
        params: { initialText: "Hello, world!", otherParam: 123 }
    } -->
    <!-- /ko -->

The `<!-- ko -->` and `<!-- /ko -->` comments act as start/end markers, defining a "virtual element" that contains the markup inside. Knockout understands this virtual element syntax and binds as if you had a real container element.

### Disposal and memory management

Optionally, your viewmodel class may have a `dispose` function. If implemented, Knockout will call this whenever the component is being torn down and removed from the DOM (e.g., because the corresponding item was removed from a `foreach`, or an `if` binding has become `false`).

You must use `dispose` to release any resources that aren't inherently garbage-collectable. For example:

 * `setInterval` callbacks will continue to fire until explicitly cleared.
   * Use `clearInterval(handle)` to stop them, otherwise your viewmodel might be held in memory.
 * `ko.computed` properties continue to receive notifications from their dependencies until explicitly disposed.
   * If a dependency is on an external object, then be sure to use `.dispose()` on the computed property, otherwise it (and possibly also your viewmodel) will be held in memory. Alternatively, consider using a [*pure* computed](computed-pure.html) to avoid the need for manual disposal.
 * **Subscriptions** to observables continue to fire until explicitly disposed.
   * If you have subscribed to an external observable, be sure to use `.dispose()` on the subscription, otherwise the callback (and possibly also your viewmodel) will be held in memory.
 * Manually-created **event handlers** on external DOM elements, if created inside a `createViewModel` function (or even inside a regular component viewmodel, although to fit the MVVM pattern you shouldn't) must be removed.
   * Of course, you don't have to worry about releasing any event handlers created by standard Knockout bindings in your view, as KO automatically unregisters them when the elements are removed.

For example:

    var someExternalObservable = ko.observable(123);

    function SomeComponentViewModel() {
        this.myComputed = ko.computed(function() {
            return someExternalObservable() + 1;
        }, this);

        this.myPureComputed = ko.pureComputed(function() {
            return someExternalObservable() + 2;
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
        // this.myPureComputed doesn't need to be manually disposed.
    }

    ko.components.register('your-component-name', {
        viewModel: SomeComponentViewModel,
        template: 'some template'
    });

It isn't strictly necessary to dispose computeds and subscriptions that only depend on properties of the same viewmodel object, since this creates only a circular reference which JavaScript garbage collectors know how to release. However, to avoid having to remember which things need disposal, you may prefer to use `pureComputed` wherever possible, and explicitly dispose all other computeds/subscriptions whether technically necessary or not.
