---
layout: documentation
title: Component registration
---

For Knockout to be able to load and instantiate your components, you must register them using `ko.components.register`, providing a configuration as described here.

*Note: As an alternative, it's possible to implement a [custom component loader](component-loader.html) that fetches components by your own conventions instead of explicit configuration.*

* [Table of contents injected here]
{:toc}

## Registering components as a viewmodel/template pair

You can register a component as follows:

    ko.components.register('some-component-name', {
        viewModel: <see below>,
        template: <see below>
    });

 * The component **name** can be any nonempty string. It's recommended, but not mandatory, to use lowercase dash-separated strings (such as `your-component-name`) so that the component name is valid to use as a [custom element](component-custom-elements.html) (such as `<your-component-name>`).
 * `viewModel` is optional, and can take any of [the `viewModel` formats described below](#specifying-a-viewmodel).
 * `template` is required, and can take any of [the `template` formats described below](#specifying-a-template).

If no viewmodel is given, the component is treated as a simple block of HTML that will be bound to any parameters passed to the component.

### Specifying a viewmodel

Viewmodels can be specified in any of the following forms:

#### A constructor function

    function SomeComponentViewModel(params) {
        // 'params' is an object whose key/value pairs are the parameters
        // passed from the component binding or custom element.
        this.someProperty = params.something;
    }

    SomeComponentViewModel.prototype.doSomething = function() { ... };

    ko.components.register('my-component', {
        viewModel: SomeComponentViewModel,
        template: ...
    });

Knockout will invoke your constructor once for each instance of the component, producing a separate viewmodel object for each. Properties on the resulting object or its prototype chain (e.g., `someProperty` and `doSomething` in the example above) are available for binding in the component's view.

#### A shared object instance

If you want all instances of your component to share the same viewmodel object instance (which is not usually desirable):

    var sharedViewModelInstance = { ... };

    ko.components.register('my-component', {
        viewModel: { instance: sharedViewModelInstance },
        template: ...
    });

Note that it's necessary to specify `viewModel: { instance: object }`, and not just `viewModel: object`. This differentiates from the other cases below.

#### A `createViewModel` factory function

If you want to run any setup logic on the associated element before it is bound to the viewmodel, or use arbitrary logic to decide which viewmodel class to instantiate:

    ko.components.register('my-component', {
        viewModel: {
            createViewModel: function(params, componentInfo) {
                // - 'params' is an object whose key/value pairs are the parameters
                //   passed from the component binding or custom element
                // - 'componentInfo.element' is the element the component is being
                //   injected into. When createViewModel is called, the template has
                //   already been injected into this element, but isn't yet bound.

                // Return the desired view model instance, e.g.:
                return new MyViewModel(params);
            }
        },
        template: ...
    });

Note that, typically, it's best to perform direct DOM manipulation only through [custom bindings](custom-bindings.html) rather than acting on `componentInfo.element` from inside `createViewModel`. This leads to more modular, reusable code.

#### An AMD module whose value describes a viewmodel

If you have an AMD loader (such as [require.js](http://requirejs.org/)) already in your page, then you can use it to fetch a viewmodel. For more details about how this works, see [how Knockout loads components via AMD](#how-knockout-loads-components-via-amd) below. Example:

    ko.components.register('my-component', {
        viewModel: { require: 'some/module/name' },
        template: ...
    });

The returned AMD module object can be in any of the forms allowed for viewmodels. So, it can be a constructor function, e.g.:

    // AMD module whose value is a component viewmodel constructor
    define(['knockout'], function(ko) {
        function MyViewModel() {
            // ...
        }

        return MyViewModel;
    });

... or a shared object instance, e.g.:

    // AMD module whose value is a shared component viewmodel instance
    define(['knockout'], function(ko) {
        function MyViewModel() {
            // ...
        }

        return { instance: new MyViewModel() };
    });

... or a `createViewModel` function, e.g.:

    // AMD module whose value is a 'createViewModel' function
    define(['knockout'], function(ko) {
        function myViewModelFactory(params, componentInfo) {
            // return something
        }
        
        return { createViewModel: myViewModelFactory };
    });

... or even, though it's unlikely you'd want to do this, a reference to a different AMD module, e.g.:

    // AMD module whose value is a reference to a different AMD module,
    // which in turn can be in any of these formats
    define(['knockout'], function(ko) {
        return { module: 'some/other/module' };
    });

### Specifying a template

Templates can be specified in any of the following forms. The most commonly useful are [existing element IDs](#an-existing-element-id) and [AMD modules](#an-amd-module-whose-value-describes-a-template).

#### An existing element ID

For example, the following element:

    <template id='my-component-template'>
        <h1 data-bind='text: title'></h1>
        <button data-bind='click: doSomething'>Click me right now</button>
    </template>

... can be used as the template for a component by specifying its ID:

    ko.components.register('my-component', {
        template: { element: 'my-component-template' },
        viewModel: ...
    });

Note that only the nodes *inside* the specified element will be cloned into each instance of the component. The container element (in this example, the `<template>` element), will *not* be treated as part of the component template.

You're not limited to using `<template>` elements, but these are convenient (on browsers that support them) since they don't get rendered on their own. Any other element type works too.

#### An existing element instance

If you have a reference to a DOM element in your code, you can use it as a container for template markup:

    var elemInstance = document.getElementById('my-component-template');

    ko.components.register('my-component', {
        template: { element: elemInstance },
        viewModel: ...
    });

Again, only the nodes *inside* the specified element will be cloned for use as the component's template.

#### A string of markup

    ko.components.register('my-component', {
        template: '<h1 data-bind="text: title"></h1>\
                   <button data-bind="click: doSomething">Clickety</button>',
        viewModel: ...
    });

This is mainly useful when you're fetching the markup from somewhere programmatically (e.g., [AMD - see below](#a-recommended-amd-module-pattern)), or as a build system output that packages components for distribution, since it's not very convenient to manually edit HTML as a JavaScript string literal.

#### An array of DOM nodes

If you're building configurations programmatically and you have an array of DOM nodes, you can use them as a component template:

    var myNodes = [
        document.getElementById('first-node'),
        document.getElementById('second-node'),
        document.getElementById('third-node')
    ];

    ko.components.register('my-component', {
        template: myNodes,
        viewModel: ...
    });

In this case, all the specified nodes (and their descendants) will be cloned and concatenated into each copy of the component that gets instantiated.

#### A document fragment

If you're building configurations programmatically and you have a `DocumentFragment` object, you can use it as a component template:

    ko.components.register('my-component', {
        template: someDocumentFragmentInstance,
        viewModel: ...
    });

Since document fragments can have multiple top-level nodes, the *entire* document fragment (not just descendants of top-level nodes) is treated as the component template.

#### An AMD module whose value describes a template

If you have an AMD loader (such as [require.js](http://requirejs.org/)) already in your page, then you can use it to fetch a template. For more details about how this works, see [how Knockout loads components via AMD](#how-knockout-loads-components-via-amd) below. Example:

    ko.components.register('my-component', {
        template: { require: 'some/template' },
        viewModel: ...
    });

The returned AMD module object can be in any of the forms allowed for viewmodels. So, it can be a string of markup, e.g. fetched using [require.js's text plugin](http://requirejs.org/docs/api.html#text):

    ko.components.register('my-component', {
        template: { require: 'text!path/my-html-file.html' },
        viewModel: ...
    });

... or any of the other forms described here, though it would be unusual for the others to be useful when fetching templates via AMD.

## How Knockout loads components via AMD

When you load a viewmodel or template via `require` declarations, e.g.,

    ko.components.register('my-component', {
        viewModel: { require: 'some/module/name' },
        template: { require: 'text!some-template.html' }
    });

...all Knockout does is call `require('some/module/name', callback)` and `require('text!some-template.html', callback)`, and uses the asynchronously-returned objects as the viewmodel and template definitions. So,

 * **This does not take a strict dependency on [require.js](http://requirejs.org/)** or any other particular module loader. *Any* module loader that provides an AMD-style `require` API will do. If you want to integrate with a module loader whose API is different, you can implement a [custom component loader](component-loader.html).
 * **Knockout does not interpret the module name** in any way - it merely passes it through to `require()`. So of course Knockout does not know or care about where your module files are loaded from. That's up to your AMD loader and how you've configured it.
 * **Knockout doesn't know or care whether your AMD modules are anonymous or not**. Typically we find it's most convenient for components to be defined as anonymous modules, but that concern is entirely separate from KO.

#### AMD modules are loaded only on demand

Knockout does not call `require(moduleName, ...)` until your component is being instantiated. This is how components get loaded on demand, not up front.

For example, if your component is inside some other element with an [`if` binding](if-binding.html) (or another control flow binding), then it will not cause the AMD module to be loaded until the `if` condition is true. Of course, if the AMD module was already loaded (e.g., in a preloaded bundle) then the `require` call will not trigger any additional HTTP requests, so you can control what is preloaded and what is loaded on demand.


## Registering components as a single AMD module

For even better encapsulation, you can package a component into a single self-describing AMD module. Then you can reference a component as simply as:

    ko.components.register('my-component', { require: 'some/module' );

Notice that no viewmodel/template pair is specified. The AMD module itself can provide a viewmodel/template pair, using any of the definition formats listed above. For example, the file `some/module.js` could be declared as:

    // AMD module 'some/module.js' encapsulating the configuration for a component
    define(['knockout'], function(ko) {
        function MyComponentViewModel(params) {
            this.personName = ko.observable(params.name);
        }

        return {
            viewModel: MyComponentViewModel,
            template: 'The name is <strong data-bind="text: personName"></strong>'
        };
    });

### A recommended AMD module pattern

What tends to be most useful in practice is creating AMD modules that have inline viewmodel classes, and explicitly take AMD dependencies on external template files.

For example, if the following is in a file at `path/my-component.js`,

    // Recommended AMD module pattern for a Knockout component that:
    //  - Can be referenced with a single 'require' declaration and no extra config
    //  - Can be included in a bundle using the r.js optimizer
    define(['knockout', 'text!./my-component.html'], function(ko, templateMarkup) {
        function MyComponentViewModel(params) {
            // Set up properties, etc.
        }

        // Use prototype to declare any public methods
        MyComponentViewModel.prototype.doSomething = function() { ... };

        // Return component definition
        return { viewModel: MyComponentViewModel, template: templateMarkup };
    });

... and the template markup is in the file `path/my-component.html`, then you have these benefits:

 * Applications can reference this trivially, i.e., `ko.components.register('my-component', { require: 'path/my-component' );`
 * You only need two files for the component - a viewmodel (`path/my-component.js`) and a template (`path/my-component.html`) - which is a very natural arrangement during development.
 * Since the dependency on the template is explicitly stated in the `define` call, this automatically works with the [`r.js` optimizer](http://requirejs.org/docs/optimization.html) or similar bundling tools. The entire component - viewmodel plus template - can therefore trivially be included in a bundle file during a build step.
   * Note: Since the r.js optimizer is very flexible, it has a lot of options and can take some time to set up. You may want to start from a ready-made example of Knockout components being optimized through r.js, in which case see [Yeoman](http://yeoman.io/) and the [generator-ko](https://www.npmjs.org/package/generator-ko) generator. Blog post coming soon.

## Default loader utility functions

TODO: Document these on the "custom component loader" page.