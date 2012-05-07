---
layout: documentation
title: Using unobtrusive event handlers
---

In most cases, data-bind attributes provide a clean and succinct way to bind to a view model. However, event handling is one area that can often result in verbose data-bind attributes, as anonymous functions were typically the recommended techinique to pass arguments.  For example:

    <a href="#" data-bind="click: function() { viewModel.items.remove($data); }">
        remove
    </a>

As an alternative, Knockout provides two helper functions that allow you to identify the data associated with a DOM element:

 * `ko.dataFor(element)` - returns the data that was available for binding against the element
 * `ko.contextFor(element)` - returns the entire [binding context](binding-context.html) that was available to the DOM element.

These helper functions can be used in event handlers that are attached unobtrusively using something like jQuery's `bind` or `click`. The above function could be attached to each link with a `remove` class like:

    $(".remove").click(function () {
        viewModel.items.remove(ko.dataFor(this));
    });

Better yet, this techinique could be used to support event delegation.  jQuery's `live/delegate/on` functions are an easy way to make this happen:

    $(".remove").live("click", function() {
        viewModel.items.remove(ko.dataFor(this));
    });

Now, a single event handler is attached at a higher level and handles clicks against any links with the `remove` class. This method has the added benefit of automatically handling additional links that are dynamically added to the document (perhaps as the result of an item being added to an observableArray).

### Live example: nested children

This example shows "add" and "remove" links on multiple levels of parents and children with a single handler attached unobtrusively for each type of link.
<style type="text/css">
   .liveExample a.add { font-size: .7em; color: #aaa; }
   .liveExample a.remove { font-size: .9em; }
</style>

{% capture live_example_view %}
<ul id="people" data-bind='template: { name: "personTmpl", foreach: people }'>
</ul>

<script id="personTmpl" type="text/html">
    <li>
        <a class="remove" href="#"> x </a>
        <span data-bind='text: name'></span>
        <a class="add" href="#"> add child </a>
        <ul data-bind='template: { name: "personTmpl", foreach: children }'></ul>
    </li>
</script>
{% endcapture %}

{% capture live_example_viewmodel %}
var Person = function(name, children) {
    this.name = ko.observable(name);
    this.children = ko.observableArray(children || []);
};

var PeopleModel = function() {
    this.people = ko.observableArray([
        new Person("Bob", [
            new Person("Jan"),
            new Person("Don", [
                new Person("Ted"),
                new Person("Ben", [
                    new Person("Joe", [
                        new Person("Ali"),
                        new Person("Ken")
                    ])
                ]),
                new Person("Doug")
            ])
        ]),
        new Person("Ann", [
            new Person("Eve"),
            new Person("Hal")
        ])
    ]);

    this.addChild = function(name, parentArray) {
        parentArray.push(new Person(name));
    };
};

ko.applyBindings(new PeopleModel());

//attach event handlers
$("#people").delegate(".remove", "click", function() {
    //retrieve the context
    var context = ko.contextFor(this),
        parentArray = context.$parent.people || context.$parent.children;

    //remove the data (context.$data) from the appropriate array on its parent (context.$parent)
    parentArray.remove(context.$data);

    return false;
});

$("#people").delegate(".add", "click", function() {
    //retrieve the context
    var context = ko.contextFor(this),
        childName = context.$data.name() + " child",
        parentArray = context.$data.people || context.$data.children;

    //add a child to the appropriate parent, calling a method off of the main view model (context.$root)
    context.$root.addChild(childName, parentArray);

    return false;
});

{% endcapture %}
{% include live-example-minimal.html %}

No matter how nested the links become, the handler is always able to identify and operate on the appropriate data. Using this techinique, we can avoid the overhead of attaching handlers to each individual link and can keep the markup clean and concise.