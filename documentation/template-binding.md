---
layout: documentation
title: The "template" binding
---

### Purpose
The `template` binding populates the associated DOM element with the results of rendering a template. Templates are a simple and convenient way to build sophisticated UI structures - possibly with repeating or nested blocks - as a function of your view model data.

By default, Knockout works with the [jquery.tmpl](http://api.jquery.com/jquery.tmpl/) template engine. Currently this template engine is a jQuery plugin, but it's expected to be integrated into the core of jQuery 1.5. To use it, download and reference both `jquery.tmpl` and jQuery itself as described on [the installation page](installation.html).

### Example
    <div data-bind='template: "personTemplate"'> </div>
    
	<script id='personTemplate' type='text/html'>
		${ name } is ${ age } years old
		<button data-bind='click: makeOlder'>Make older</button>
	</script>
	
	<script type='text/javascript'>
        var viewModel = {
            name: ko.observable('Bert'),
            age: ko.observable(78),
            makeOlder: function() {
                this.age(this.age() + 1);	
            }    	
        };	
        ko.applyBindings(viewModel);
	</script>
	
Knockout automatically re-renders templates when any observables (or dependent observables) that they reference change value. In this example, the template will be re-rendered each time you click the button to make the person older.

### Syntax

You can use any legal syntax that your template engine supports. For `jquery.tmpl`, this includes
 * `${ someValue }` --- [documentation](http://api.jquery.com/template-tag-equal)
 * `{{'{{'}}html someValue}}` --- [documentation](http://api.jquery.com/template-tag-html)
 * `{{'{{'}}if someCondition}}` --- [documentation](http://api.jquery.com/template-tag-if)
 * `{{'{{'}}else someCondition}}` --- [documentation](http://api.jquery.com/template-tag-else)
 * `{{'{{'}}each someArray}}` --- [documentation](http://api.jquery.com/template-tag-each). 

**Using `{{'{{'}}each}}` with an observable array**

When using `{{'{{'}}each someArray}}`, if your value is an [`observableArray`](observableArrays.html), you *must* pass the *underlying array* to `each` by writing `{{'{{'}}each myObservableArray()}}`, *not* just `{{'{{'}}each myObservableArray}}`.

### Parameters

 * Main parameter
 
   * Shorthand syntax: If you just supply a string value (as in the preceding example), KO will interpret this as the ID of a template to render. The data it supplies to the template will be your whole view model object (i.e., the object you originally passed to `ko.applyBindings`).
   
   * For more control, pass a JavaScript object with the following properties:
   
     * `name` (required) --- the ID of a template to render.
     * `data` (optional) --- an object to supply as the data for the template to render. If you omit this parameter, KO will look for a `foreach` parameter, or will fall back on using your whole view model object.
     * `foreach` (optional) --- instructs KO to render the template in "foreach" mode - see [Note 3](#note_3_using_the__option) for details.
     * `afterAdd` and/or `beforeRemove` (optional) --- used in conjunction with [`foreach` mode](#note_3_using_the__option).
     * `afterRender` (optional) --- a callback function with two parameters, the first of which is a list of all DOM nodes added by the template.
     
Example of passing multiple parameters:

    <div data-bind='template: { name: "personTemplate", data: someObject }'> </div>

### Note 1: Rendering nested templates

Since you can use `data-bind` attributes from within templates, it's trivial to set up nested templates -- just use `data-bind='template: ...'` again on an element inside your template.

This is better than using whatever native syntax your template engine has for nested templates (e.g., the `{{'{{'}}tmpl}}` syntax in `jquery.tmpl`). The advantage with Knockout's syntax is that it enables Knockout to track dependencies separately at each level of template rendering, so if a dependency changes, KO only re-renders the innermost templates affected by that change, and doesn't need to re-render everything. This significantly improves performance in demanding situations.

### Note 2: How `${ val }` differs from `<span data-bind='text: val'></span>`

When you use data binding attributes from inside a template, KO tracks the dependencies separately for that binding. When a model value changes, KO knows that it only needs to update the bound element and its children, and need not re-render the whole template. So, if you write `<span data-bind='text: someObservableValue'></span>` and then `someObservableValue` changes, KO will simply update the text on that `<span>` element and doesn't need to re-render the whole template. 

However, if you access observables inline in a template (e.g., using `${ someObservableValue }`) then when any such observable changes, KO needs to re-render that whole template.

In some cases this means `<span data-bind='text: someObservableValue'></span>` is better than `${ someObservableValue }` for performance and because it doesn't interfere with the state of other nearby elements when its value updates. However, `${ someObservableValue }` is a tidy and concise syntax so is often preferable if your template is small and won't update rapidly enough to cause a performance burden.

### Note 3: Using the `foreach` option

If you want to render a template once for each item in a collection, there are two main approaches:

 1. You can use your template engine's native 'each' support. For `jquery.tmpl`, this means using its `{{'{{'}}each}}` syntax to iterate over the array.
 1. Alternatively, you can use Knockout's `foreach` template rendering mode. 

Example:

    <div data-bind='template: { name: "personTemplate", 
                                foreach: someObservableArrayOfPeople }'> </div>

The benefits of the `foreach` template mode are:
 * when you add items to your collection, KO will only render the template for the new item and will insert it into the existing DOM
 * when you remove items from your collection, KO will simply delete the associated elements from your DOM without re-rendering any template
 * KO allows you to give `afterAdd` and/or `beforeRemove` callbacks to manipulate the added/removed DOM elements in a custom way. This makes animated transitions easy, as in [this example](../examples/animatedTransitions.html).
 
This differs from the template engine's native 'each' support: after any change, the template engine is forced to re-render everything because it isn't aware of KO's dependency tracking mechanism.

For examples of using `foreach` mode, see the [grid editor](../examples/gridEditor.html) and the [animated transitions example](../examples/animatedTransitions.html).

### Note: Using a different template engine

If you want to use a different JavaScript-based template engine (perhaps because you don't want to take a dependency on jQuery for some reason), it's possible to do so by writing a KO driver for the template engine. For an example, see `jqueryTmplTemplateEngine.js` in the KO source code, though bear in mind that this is complicated by having to support multiple versions of `jquery.tmpl`. Supporting a single version of another template engine could be much simpler.

### Dependencies

The `template` binding works only once you've referenced a suitable template engine, such as `jquery.tmpl` as described on [the installation page](installation.html).
