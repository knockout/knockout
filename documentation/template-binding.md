---
layout: documentation
title: The "template" binding
---

### Purpose
The `template` binding populates the associated DOM element with the results of rendering a template. Templates are a simple and convenient way to build sophisticated UI structures - possibly with repeating or nested blocks - as a function of your view model data.

By default, Knockout works with the [jquery.tmpl](http://api.jquery.com/jquery.tmpl/) template engine, a popular jQuery plugin. To use it, download and reference both `jquery.tmpl` and jQuery itself as described on [the installation page](installation.html). Or if you prefer, it's possible to integrate with a different template engine, though that is a more advanced task requiring some understanding of Knockout internals.

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
   
     * `name` (required) --- the ID of a template to render - see [Note 5](#note_5_dynamically_choosing_which_template_is_used) for how to use a function to determine the ID.
     * `data` (optional) --- an object to supply as the data for the template to render. If you omit this parameter, KO will look for a `foreach` parameter, or will fall back on using your whole view model object.
     * `foreach` (optional) --- instructs KO to render the template in "foreach" mode - see [Note 3](#note_3_using_the__option) for details.
     * `afterAdd` and/or `beforeRemove` (optional) --- used in conjunction with [`foreach` mode](#note_3_using_the__option).
     * `templateOptions` (optional) --- allows you to pass additional data that is accessible during template rendering. See [Note 6](#note_6_passing_additional_data_to_your_template_using_) for details.
     
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

### Note 4: Using the `afterRender` option

Sometimes you might want to run custom post-processing logic on the DOM elements generated by your templates. For example, if you're using a JavaScript widgets library such as jQuery UI, you might want to intercept your templates' output so that you can run jQuery UI commands on it to transform some of the rendered elements into date pickers, sliders, or anything else.

You can do this using the `afterRender` option. Simply pass a function reference (either a function literal, or give the name of a function on your view model), and Knockout will invoke it immediately after rendering or re-rendering your template. If you're using `foreach`, Knockout will invoke your `afterRender` callback for each item added to your observable array. For example,

    <div data-bind='template: { name: "personTemplate", 
                                data: myData,
                                afterRender: myPostProcessingLogic }'> </div>

... and define a corresponding function on your view model (i.e., the object that contains `myData`):

    viewModel.myPostProcessingLogic = function(elements) {
    	// "elements" is an array of DOM nodes just rendered by the template
    	// You can add custom post-processing logic here
    }

### Note 5: Dynamically choosing which template is used

In some scenarios, it may be useful to programmatically determine the template ID based on the state of your data. This can be accomplished by supplying a function for the `name` option that returns the ID. If you are using the `foreach` template mode, Knockout will evaluate the function for each item in your array passing that item's value as the only argument. Otherwise, the function will be given the `data` option's value or fall back to providing your whole view model.

For example,
 
    <ul data-bind='template: { name: displayMode,
                               foreach: employees }'> </ul>

    var viewModel = {
        employees: ko.observableArray([
            { name: "Kari", active: ko.observable(true) },
            { name: "Brynn", active: ko.observable(false) },
            { name: "Nora", active: ko.observable(false) }
        ]),
        displayMode: function(employee) {
            return employee.active() ? "active" : "inactive";  // Initially "Kari" uses the "active" template, while the others use "inactive"
        }
    };

    // ... then later ...
    viewModel.employees()[1].active(true); // Now "Brynn" is also rendered using the "active" template.

If your function references observable values, then the binding will update whenever any of those values change.  This will cause the data to be re-rendered using the appropriate template.
    
### Note 6: Passing additional data to your template using `templateOptions`

If you need to make additional information available during template rendering besides the data that you are binding against, an easy way to do this is through the `templateOptions` object. This can help you create reusable templates that vary based on filtering criteria or string values that don't necessarily belong in your view model. This is also useful in cases where scope is a concern, as it is a way to include data that would be otherwise inaccessible from within your template.

For example,

    <ul data-bind='template: { name: "personTemplate",
                               foreach: employees,
                               templateOptions: { label: "Employee:",
                                                  selectedPerson: selectedEmployee } }'> </ul>

    <script id='personTemplate' type='text/html'>
		<div data-bind="css: { selected: $data === $item.selectedPerson()" }">
            ${ $item.label } <input data-bind="value: name" />
        </div>
	</script>
                               
In this case, we have a `personTemplate` that is perhaps being used for both employee and customer objects. Through `templateOptions`, we supply an appropriate string for the field's label and also include the currently selected employee as `selectedPerson` to aid in styling. In `jquery.tmpl` templates, these values are accessible as properties of the $item object.  

### Note 7: Templates are precompiled and cached

To maximise performance, Knockout's built-in `jquery.tmpl` provider automatically uses `jquery.tmpl`'s ability to precompile your templates into runnable JavaScript code, and caches the output from this compilation process. This makes templates significantly faster to execute, and that's well worthwhile in case you're executing the same templates over and over in a `foreach` loop.

Typically you won't notice that this is happening, so in most cases you can forget about it. However, it does mean that if for some reason you programmatically overwrite a template's `<script>` element, and that template has already been used at least once, your changes to the template `<script>` element won't actually make any difference because the existing precompiled template will keep being used. (If this turns out to be problematic, we will consider adding a mechanism to disable or reset template caches in a future version of KO, however it's unlikely that you will have a good reason to modify template `<script>` elements programmatically, since the whole point of templates is that they **contain** the programmatic logic to produce the different outputs that you need!)

### Note 8: Using a different template engine

If you want to use a different JavaScript-based template engine (perhaps because you don't want to take a dependency on jQuery for some reason), it's possible to do so by writing a KO driver for the template engine. For an example, see `jqueryTmplTemplateEngine.js` in the KO source code, though bear in mind that this is complicated by having to support multiple versions of `jquery.tmpl`. Supporting a single version of another template engine could be much simpler.

### Dependencies

The `template` binding works only once you've referenced a suitable template engine, such as `jquery.tmpl` as described on [the installation page](installation.html).