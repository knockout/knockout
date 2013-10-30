---
layout: documentation
title: The "template" binding
---

### Purpose
The `template` binding populates the associated DOM element with the results of rendering a template. Templates are a simple and convenient way to build sophisticated UI structures - possibly with repeating or nested blocks - as a function of your view model data.

There are two main ways of using templates:

 * *Native templating* is the mechanism that underpins `foreach`, `if`, `with`, and other control flow bindings. Internally, those control
   flow bindings capture the HTML markup contained in your element, and use it as a template to render against an arbitrary data item.
   This feature is built into Knockout and doesn't require any external library.
 * *String-based templating* is a way to connect Knockout to a third-party template engine. Knockout will pass your model values to
   the external template engine and inject the resulting markup string into your document. See below for examples that use the *jquery.tmpl*
   and *Underscore* template engines.

### Parameters

 * Main parameter

   * Shorthand syntax: If you just supply a string value, KO will interpret this as the ID of a template to render. The data it supplies to the template will be your current model object.

   * For more control, pass a JavaScript object with some combination of the following properties:

     * `name` --- the ID of an element that contains the template you wish to render - see [Note 5](#note_5_dynamically_choosing_which_template_is_used) for how to vary this programmatically.
     * `data` --- an object to supply as the data for the template to render. If you omit this parameter, KO will look for a `foreach` parameter, or will fall back on using your current model object.
     * `if` --- if this parameter is provided, the template will only be rendered if the specified expression evaluates to `true` (or a `true`-ish value). This can be useful for preventing a null observable from being bound against a template before it is populated.
     * `foreach` --- instructs KO to render the template in "foreach" mode - see [Note 2](#note_2_using_the_foreach_option_with_a_named_template) for details.
     * `as` --- when used in conjunction with `foreach`, defines an alias for each item being rendered - see [Note 3](#note_3_using_as_to_give_an_alias_to_foreach_items) for details.
     * `afterRender`, `afterAdd`, or `beforeRemove` --- callback functions to be invoked against the rendered DOM elements - see [Note 4](#note_4_using_afterrender_afteradd_and_beforeremove)

### Note 1: Rendering a named template

Normally, when you're using control flow bindings (`foreach`, `with`, `if`, etc.), there's no need to give names to your templates: they are defined implicitly
and anonymously by the markup inside your DOM element. But if you want to, you can factor out templates into a separate element and then reference them by name:

    <h2>Participants</h2>
    Here are the participants:
    <div data-bind="template: { name: 'person-template', data: buyer }"></div>
    <div data-bind="template: { name: 'person-template', data: seller }"></div>

    <script type="text/html" id="person-template">
        <h3 data-bind="text: name"></h3>
        <p>Credits: <span data-bind="text: credits"></span></p>
    </script>

    <script type="text/javascript">
         function MyViewModel() {
             this.buyer = { name: 'Franklin', credits: 250 };
             this.seller = { name: 'Mario', credits: 5800 };
         }
         ko.applyBindings(new MyViewModel());
    </script>

In this example, the `person-template` markup is used twice: once for `buyer`, and once for `seller`. Notice that the template markup is wrapped in a `<script type="text/html">` ---
the dummy `type` attribute is necessary to ensure that the markup is not executed as JavaScript, and Knockout does not attempt to apply
bindings to that markup except when it is being used as a template.

It's not very often that you'll need to use named templates, but on occasion it can help to minimise duplication of markup.

### Note 2: Using the "foreach" option with a named template

If you want the equivalent of a `foreach` binding, but using a named template, you can do so in the natural way:

    <h2>Participants</h2>
    Here are the participants:
    <div data-bind="template: { name: 'person-template', foreach: people }"></div>

    <script type="text/html" id="person-template">
        <h3 data-bind="text: name"></h3>
        <p>Credits: <span data-bind="text: credits"></span></p>
    </script>

     function MyViewModel() {
         this.people = [
             { name: 'Franklin', credits: 250 },
             { name: 'Mario', credits: 5800 }
         ]
     }
     ko.applyBindings(new MyViewModel());

This gives the same result as embedding an anonymous template directly inside the element to which you use `foreach`, i.e.:

    <div data-bind="foreach: people">
        <h3 data-bind="text: name"></h3>
        <p>Credits: <span data-bind="text: credits"></span></p>
    </div>

### Note 3: Using "as" to give an alias to "foreach" items

When nesting `foreach` templates, it's often useful to refer to items at higher levels in the hierarchy. One way to do this is to refer to `$parent` or other [binding context](binding-context.html) variables in your bindings.

A simpler and more elegant option, however, is to use `as` to declare a name for your iteration variables. For example:

    <ul data-bind="template: { name: 'employeeTemplate',
                                      foreach: employees,
                                      as: 'employee' }"></ul>

Notice the string value `'employee'` associated with `as`. Now anywhere inside this `foreach` loop, bindings in your child templates will be able to refer to `employee` to access the employee object being rendered.

This is mainly useful if you have multiple levels of nested `foreach` blocks, because it gives you an unambiguous way to refer to any named item declared at a higher level in the hierarchy. Here's a complete example, showing how `season` can be referenced while rendering a `month`:

    <ul data-bind="template: { name: 'seasonTemplate', foreach: seasons, as: 'season' }"></ul>

    <script type="text/html" id="seasonTemplate">
        <li>
            <strong data-bind="text: name"></strong>
            <ul data-bind="template: { name: 'monthTemplate', foreach: months, as: 'month' }"></ul>
        </li>
    </script>

    <script type="text/html" id="monthTemplate">
        <li>
            <span data-bind="text: month"></span>
            is in
            <span data-bind="text: season.name"></span>
        </li>
    </script>

    <script>
        var viewModel = {
            seasons: ko.observableArray([
                { name: 'Spring', months: [ 'March', 'April', 'May' ] },
                { name: 'Summer', months: [ 'June', 'July', 'August' ] },
                { name: 'Autumn', months: [ 'September', 'October', 'November' ] },
                { name: 'Winter', months: [ 'December', 'January', 'February' ] }
            ])
        };
        ko.applyBindings(viewModel);
    </script>

Tip: Remember to pass a *string literal value* to as (e.g., `as: 'season'`, *not* `as: season`), because you are giving a name for a new variable, not reading the value of a variable that already exists.

### Note 4: Using "afterRender", "afterAdd", and "beforeRemove"

Sometimes you might want to run custom post-processing logic on the DOM elements generated by your templates. For example, if you're using a JavaScript widgets library such as jQuery UI, you might want to intercept your templates' output so that you can run jQuery UI commands on it to transform some of the rendered elements into date pickers, sliders, or anything else.

Generally, the best way to perform such post-processing on DOM elements is to write a [custom binding](custom-bindings.html), but if you really just want to access the raw DOM elements emitted by a template, you can use `afterRender`.

Pass a function reference (either a function literal, or give the name of a function on your view model), and Knockout will invoke it immediately after rendering or re-rendering your template. If you're using `foreach`, Knockout will invoke your `afterRender` callback for each item added to your observable array. For example,

    <div data-bind='template: { name: "personTemplate",
                                data: myData,
                                afterRender: myPostProcessingLogic }'> </div>

... and define a corresponding function on your view model (i.e., the object that contains `myData`):

    viewModel.myPostProcessingLogic = function(elements) {
        // "elements" is an array of DOM nodes just rendered by the template
        // You can add custom post-processing logic here
    }

If you are using `foreach` and only want to be notified about elements that are specifically being added or are being removed, you can use `afterAdd` and `beforeRemove` instead. For details, see documentation for the [`foreach` binding](foreach-binding.html).

### Note 5: Dynamically choosing which template is used

If you have multiple named templates, you can pass an observable for the `name` option. As the observable's value is updated, the element's contents will be re-rendered using the appropriate template. Alternatively, you can pass a callback function to determine which template to use. If you are using the `foreach` template mode, Knockout will evaluate the function for each item in your array, passing that item's value as the only argument. Otherwise, the function will be given the `data` option's value or fall back to providing your whole current model object.

For example,

    <ul data-bind='template: { name: displayMode,
                               foreach: employees }'> </ul>

    <script>
        var viewModel = {
            employees: ko.observableArray([
                { name: "Kari", active: ko.observable(true) },
                { name: "Brynn", active: ko.observable(false) },
                { name: "Nora", active: ko.observable(false) }
            ]),
            displayMode: function(employee) {
                // Initially "Kari" uses the "active" template, while the others use "inactive"
                return employee.active() ? "active" : "inactive";
            }
        };

        // ... then later ...
        viewModel.employees()[1].active(true); // Now "Brynn" is also rendered using the "active" template.
    </script>

If your function references observable values, then the binding will update whenever any of those values change.  This will cause the data to be re-rendered using the appropriate template.

If your function accepts a second parameter, then it will receive the entire [binding context](binding-context.html). You can then access `$parent` or any other [binding context](binding-context.html) variable when dynamically choosing a template. For example, you could amend the preceding code snippet as follows:

    displayMode: function(employee, bindingContext) {
        // Now return a template name string based on properties of employee or bindingContext
    }

### Note 6: Using jQuery.tmpl, an external string-based template engine

In the vast majority of cases, Knockout's native templating and the `foreach`, `if`, `with` and other control flow bindings will be all you need to construct an arbitrarily sophisticated UI. But in case you wish to integrate with an external templating library, such as the [Underscore template engine](http://documentcloud.github.com/underscore/#template) or [jquery.tmpl](http://api.jquery.com/jquery.tmpl/), Knockout offers a way to do it.

By default, Knockout comes with support for [jquery.tmpl](http://api.jquery.com/jquery.tmpl/). To use it, you need to reference the following libraries, in this order:

    <!-- First jQuery -->     <script src="http://code.jquery.com/jquery-1.7.1.min.js"></script>
    <!-- Then jQuery.tmpl --> <script src="jquery.tmpl.js"></script>
    <!-- Then Knockout -->    <script src="knockout-x.y.z.js"></script>

Then, you can use jQuery.tmpl syntax in your templates. For example,

    <h1>People</h1>
    <div data-bind="template: 'peopleList'"></div>

    <script type="text/html" id="peopleList">
        {{'{{'}}each people}}
            <p>
                <b>${name}</b> is ${age} years old
            </p>
        {{'{{'}}/each}}
    </script>

    <script type="text/javascript">
        var viewModel = {
            people: ko.observableArray([
                { name: 'Rod', age: 123 },
                { name: 'Jane', age: 125 },
            ])
        }
        ko.applyBindings(viewModel);
    </script>

This works because `{{'{{'}}each ...}}` and `${ ... }` are jQuery.tmpl syntaxes. What's more, it's trivial to nest templates: because you can use data-bind attributes from inside a template, you can simply put a `data-bind="template: ..."` inside a template to render a nested one.

Please note that, as of December 2011, jQuery.tmpl is no longer under active development. We recommend the use of Knockout's native DOM-based templating (i.e., the `foreach`, `if`, `with`, etc. bindings) instead of jQuery.tmpl or any other string-based template engine.

### Note 7: Using the Underscore.js template engine

The [Underscore.js template engine](http://documentcloud.github.com/underscore/#template) by default uses ERB-style delimiters (`<%= ... %>`). Here's how the preceding example's template might look with Underscore:

    <script type="text/html" id="peopleList">
        <% _.each(people(), function(person) { %>
            <li>
                <b><%= person.name %></b> is <%= person.age %> years old
            </li>
        <% }) %>
    </script>

Here's [a simple implementation of integrating Underscore templates with Knockout](http://jsfiddle.net/rniemeyer/NW5Vn/). The integration code is just 16 lines long, but it's enough to support Knockout `data-bind` attributes (and hence nested templates) and Knockout [binding context](binding-context.html) variables (`$parent`, `$root`, etc.).

If you're not a fan of the `<%= ... %>` delimiters, you can configure the Underscore template engine to use any other delimiter characters of your choice.

### Dependencies

 * **Native templating** does not require any library other than Knockout itself
 * **String-based templating** works only once you've referenced a suitable template engine, such as jQuery.tmpl or the Underscore template engine.
