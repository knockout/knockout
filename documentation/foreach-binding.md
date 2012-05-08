---
layout: documentation
title: The "foreach" binding
---

### Purpose
The `foreach` binding duplicates a section of markup for each entry in an array, and binds each copy of that markup to the corresponding array item. This is especially useful for rendering lists or tables.

Assuming your array is an [observable array](observableArrays.html), whenever you later add or remove array entries, the binding will efficiently update the UI to match - inserting or removing more copies of the markup, without affecting any other DOM elements.

Of course, you can arbitrarily nest any number of `foreach` bindings along with other control-flow bindings such as `if` and `with`.

### Example 1: Iterating over an array

This example uses `foreach` to produce a read-only table with a row for each array entry.

    <table>
        <thead>
            <tr><th>First name</th><th>Last name</th></tr>
        </thead>
        <tbody data-bind="foreach: people">
            <tr>
                <td data-bind="text: firstName"></td>
                <td data-bind="text: lastName"></td>
            </tr>
        </tbody>
    </table>

    <script type="text/javascript">
        ko.applyBindings({
            people: [
                { firstName: 'Bert', lastName: 'Bertington' },
                { firstName: 'Charles', lastName: 'Charlesforth' },
                { firstName: 'Denise', lastName: 'Dentiste' }
            ]
        });
    </script>

### Example 2: Live example with add/remove

The following example show that, if your array is observable, then the UI will be kept in sync with changes to that array.

{% capture live_example_view %}
<h4>People</h4>
<ul data-bind="foreach: people">
    <li>
        Name at position <span data-bind="text: $index"> </span>:
        <span data-bind="text: name"> </span>
        <a href="#" data-bind="click: $parent.removePerson">Remove</a>
    </li>
</ul>
<button data-bind="click: addPerson">Add</button>
{% endcapture %}

{% capture live_example_viewmodel %}
function AppViewModel() {
    var self = this;

    self.people = ko.observableArray([
        { name: 'Bert' },
        { name: 'Charles' },
        { name: 'Denise' }
    ]);

    self.addPerson = function() {
        self.people.push({ name: "New at " + new Date() });
    };

    self.removePerson = function() {
        self.people.remove(this);
    }
}

ko.applyBindings(new AppViewModel());
{% endcapture %}

{% include live-example-minimal.html %}

### Parameters

 * Main parameter

   Pass the array that you wish to iterate over. The binding will output a section of markup for each entry.

   Alternatively, pass a JavaScript object literal with a property called `data` which is the array you wish to iterate over. The object
   literal may also have other properties, such as `afterAdd` or `includeDestroyed` --- see below for details of these extra options and
   examples of their use.

   If the array you supply is observable, the `foreach` binding will respond to any future changes in the array's contents by adding or
   removing corresponding sections of markup in the DOM.

 * Additional parameters

   * None

### Note 1: Referring to each array entry using $data

As shown in the above examples, bindings within the `foreach` block can refer to properties on the array entries. For example, [Example 1](#example_1_iterating_over_an_array) referenced the `firstName` and `lastName` properties on each array entry.

But what if you want to refer to the array entry itself (not just one of its properties)? In that case, you can use the [special context property](binding-context.html) `$data`. Within a `foreach` block, it means "the current item". For example,

    <ul data-bind="foreach: months">
        <li>
            The current item is: <b data-bind="text: $data"></b>
        </li>
    </ul>

    <script type="text/javascript">
        ko.applyBindings({
            months: [ 'Jan', 'Feb', 'Mar', 'etc' ]
        });
    </script>

If you wanted, you could use `$data` as a prefix when referencing properties on each entry. For example, you could rewrite part of [Example 1](#example_1_iterating_over_an_array) as follows:

    <td data-bind="text: $data.firstName"></td>

... but you don't have to, because `firstName` will be evaluated within the context of `$data` by default anyway.


### Note 2: Using $index, $parent, and other context properties

As you can see from Example 2 above, it's possible to use `$index` to refer to the zero-based index of the current array item. `$index` is an observable and is updated whenever the index of the item changes (e.g., if items are added to or removed from the array).

Similarly, you can use `$parent` to refer to data from outside the `foreach`, e.g.:

    <h1 data-bind="text: blogPostTitle"></h1>
    <ul data-bind="foreach: likes">
        <li>
            <b data-bind="text: name"></b> likes the blog post <b data-bind="text: $parent.blogPostTitle"></b>
        </li>
    </ul>

For more information about `$index` and other context properties such as `$parent`, see documentation for [binding context properties](binding-context.html).

### Note 3: Using foreach without a container element

In some cases, you might want to duplicate a section of markup, but you don't have any container element on which to put a `foreach` binding. For example, you might want to generate the following:

    <ul>
        <li class="header">Header item</li>
        <!-- The following are generated dynamically from an array -->
        <li>Item A</li>
        <li>Item B</li>
        <li>Item C</li>
    </ul>

In this example, there isn't anywhere to put a normal `foreach` binding. You can't put it on the `<ul>` (because then you'd be duplicating the header item), nor can you put a further container inside the `<ul>` (because only `<li>` elements are allowed inside `<ul>`s).

To handle this, you can use the *containerless control flow syntax*, which is based on comment tags. For example,

    <ul>
        <li class="header">Header item</li>
        <!-- ko foreach: myItems -->
            <li>Item <span data-bind="text: $data"></span></li>
        <!-- /ko -->
    </ul>

    <script type="text/javascript">
        ko.applyBindings({
            myItems: [ 'A', 'B', 'C' ]
        });
    </script>

The `<!-- ko -->` and `<!-- /ko -->` comments act as start/end markers, defining a "virtual element" that contains the markup inside. Knockout understands this virtual element syntax and binds as if you had a real container element.


### Note 4: Destroyed entries are hidden by default

Sometimes you may want to mark an array entry as deleted, but without actually losing record of its existence. This is known as a *non-destructive delete*. For details of how to do this, see [the destroy function on `observableArray`](observableArrays.html#destroy_and_destroyall_note_usually_relevant_to_ruby_on_rails_developers_only).

By default, the `foreach` binding will skip over (i.e., hide) any array entries that are marked as destroyed. If you want to show destroyed entries, use the `includeDestroyed` option. For example,

    <div data-bind='foreach: { data: myArray, includeDestroyed: true }'>
        ...
    </div>


### Note 5: Post-processing or animating the generated DOM elements

If you need to run some further custom logic on the generated DOM elements, you can use any of the following callbacks:

 * `afterRender` --- is invoked each time the `foreach` block is duplicated and inserted into the document, both when `foreach` first initializes, and when new entries are added to the associated array later. Knockout will supply the following parameters to your callback:

   1. An array of the inserted DOM elements
   2. The data item against which they are being bound

 * `afterAdd` --- is like `afterRender`, except it is invoked only when new entries are added to your array (and *not* when `foreach` first iterates over your array's initial contents). A common use for `afterAdd` is to call a method such as jQuery's `$(domNode).fadeIn()` so that you get animated transitions whenever items are added. Knockout will supply the following parameters to your callback:

   1. A DOM node being added to the document
   2. The index of the added array element
   3. The added array element

 * `beforeRemove` --- is invoked when an array item has been removed, but before the corresponding DOM nodes have been removed. If you specify a `beforeRemove` callback, then *it becomes your responsibility to remove the DOM nodes*. The obvious use case here is calling something like jQuery's `$(domNode).fadeOut()` to animate the removal of the corresponding DOM nodes --- in this case, Knockout cannot know how soon it is allowed to physically remove the DOM nodes (who knows how long your animation will take?), so it is up to you to remove them. Knockout will supply the following parameters to your callback:

   1. A DOM node that you should remove
   2. The index of the removed array element
   3. The removed array element

Here's a trivial example that uses `afterRender`. It simply uses jQuery's `$.css` to make the rendered element turn red:

    <ul data-bind="foreach: { data: myItems, afterRender: handleAfterRender }">
        <li data-bind="text: $data"></li>
    </ul>

    <script type="text/javascript">
        ko.applyBindings({
            myItems: ko.observableArray([ 'A', 'B', 'C' ]),
            handleAfterRender: function(elements, data) {
                $(elements).css({ color: 'red' });
            }
        });
    </script>

For examples of `afterAdd` and `beforeRemove` see [animated transitions](/examples/animatedTransitions.html).

### Dependencies

None, other than the core Knockout library.