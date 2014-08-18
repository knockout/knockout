---
layout: documentation
title: Components and Custom Elements - Overview
---

**Components** are a powerful, clean way of organizing your UI code into self-contained, reusable chunks. They:

 * ...can represent individual controls/widgets, or entire sections of your application
 * ...contain their own view, and usually (but optionally) their own viewmodel
 * ...can either be preloaded, or loaded asynchronously (on demand) via AMD or other module systems
 * ...can receive parameters, and optionally write back changes to them or invoke callbacks
 * ...can be composed together (nested) or inherited from other components
 * ...can easily be packaged for reuse across projects
 * ...let you define your own conventions/logic for configuration and loading

This pattern is beneficial for large applications, because it **simplifies development** through clear organization and encapsulation, and helps to **improve runtime performance** by incrementally loading your application code and templates as needed.

**Custom elements** are an optional but convenient syntax for consuming components. Instead of needing placeholder `<div>`s into which components are injected with bindings, you can use more self-descriptive markup with custom element names (e.g., `<voting-button>` or `<product-editor>`). Knockout takes care to ensure compatibility even with old browsers such as IE 6.

### Example: A like/dislike widget

To get started, you can register a component using `ko.components.register` (technically, registration is optional, but it's the easiest way to get started). A component definition specifies a `viewModel` and `template`. For example:

{% capture like_dislike_registration %}
    ko.components.register('like-widget', {
        viewModel: function(params) {
            // Data: value is either null, 'like', or 'dislike'
            this.chosenValue = params.value;
            
            // Behaviors
            this.like = function() { this.chosenValue('like'); }.bind(this);
            this.dislike = function() { this.chosenValue('dislike'); }.bind(this);
        },
        template:
            '<div class="like-or-dislike" data-bind="visible: !chosenValue()">\
                <button data-bind="click: like">Like it</button>\
                <button data-bind="click: dislike">Dislike it</button>\
            </div>\
            <div class="result" data-bind="visible: chosenValue">\
                You <strong data-bind="text: chosenValue"></strong> it\
            </div>'
    });
{% endcapture %}
{{ like_dislike_registration }}

**Normally, you'd load the view model and template from external files** instead of declaring them inline like this. We'll get to that later.

Now, to use this component, you can reference it from any other view in your application, either using the [`component` binding](component-binding.html) or using a [custom element](component-custom-element.html). Here's a live example that uses it as a custom element:

<style type="text/css">
    .liveExample ul { margin: 0; }
    .liveExample .product {
        list-style-type: none;
        background-color: rgba(0,0,0,0.1);
        padding: 1em; border-radius: 1em;
        min-height: 3.5em;
    }
    .liveExample .product + .product { margin-top: 1em;  }
    .liveExample > button { margin: 0.5em 0; }
</style>
<script>{{ like_dislike_registration }}</script>

{% capture live_example_id %}component-inline{% endcapture %}
{% capture live_example_view %}
    <ul data-bind="foreach: products">
        <li class="product">
            <strong data-bind="text: name"></strong>
            <like-widget params="value: userRating"></like-widget>
        </li>
    </ul>
{% endcapture %}
{% capture live_example_viewmodel %}
    function Product(name, rating) {
        this.name = name;
        this.userRating = ko.observable(rating || null);
    }

    function MyViewModel() {
        this.products = [
            new Product('Garlic bread'),
            new Product('Pain au chocolat'),
            new Product('Seagull spaghetti', 'like') // This one was already 'liked'
        ];
    }

    ko.applyBindings(new MyViewModel());
{% endcapture %}
{% include live-example-minimal.html %}

In this example, the component both displays and edits an observable property called `userRating` on the `Product` view model class.

### Example: Loading the like/dislike widget from external files, on demand

In most applications, you'll want to keep component view models and templates in external files. If you configure Knockout to fetch them via an AMD module loader such as [require.js](http://requirejs.org/), then they can either be preloaded (possibly bundled/minified), or incrementally loaded as needed.

Here's an example configuration:

{% capture like_dislike_amd_registration %}
    ko.components.register('like-or-dislike', {
        viewModel: { require: 'files/component-like-widget' },
        template: { require: 'text!files/component-like-widget.html' }
    });
{% endcapture %}
{{ like_dislike_amd_registration }}

**Requirements**

For this to work, the files [`files/component-like-widget.js`](files/component-like-widget.js) and [`files/component-like-widget.html`](files/component-like-widget.html) need to exist. Check them out (and *view source* on the .html one) - as you'll see, this is cleaner and more convenient that including the code inline in the definition.

Also, you need to have referenced a suitable module loader library (such as [require.js](http://requirejs.org/)) or implemented a [custom component loader](component-loaders.html) that knows how to grab your files.

**Using the component**

Now `like-or-dislike` can be consumed in the same way as before, using either a [`component` binding](component-binding.html) or a [custom element](component-custom-element.html):

<script>{{ like_dislike_amd_registration }}</script>

{% capture live_example_id %}component-amd{% endcapture %}
{% capture live_example_view %}
    <ul data-bind="foreach: products">
        <li class="product">
            <strong data-bind="text: name"></strong>
            <like-or-dislike params="value: userRating"></like-or-dislike>
        </li>
    </ul>
    <button data-bind="click: addProduct">Add a product</button>
{% endcapture %}
{% capture live_example_viewmodel %}
    function Product(name, rating) {
        this.name = name;
        this.userRating = ko.observable(rating || null);
    }

    function MyViewModel() {
        this.products = ko.observableArray(); // Start empty
    }

    MyViewModel.prototype.addProduct = function() {
        var name = 'Product ' + (this.products().length + 1);
        this.products.push(new Product(name));
    };

    ko.applyBindings(new MyViewModel());
{% endcapture %}
{% include live-example-minimal.html %}

If you open your browser developer tools' **Network** inspector before your first click on *Add product*, you'll see that the component's `.js`/`.html` files are fetched on demand when first required, and thereafter retained for reuse.

### Learn more

More more detailed information, see:

 * [Defining and registering components](component-registration.html)
 * [Using the `component` binding](component-binding.html)
 * [Using custom elements](component-custom-elements.html)
 * [Advanced: Custom component loaders](component-loaders.html)
