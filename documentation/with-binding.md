---
layout: documentation
title: The "with" and "using" bindings
---

### Purpose
The `with` and `using` bindings create a new [binding context](binding-context.html), so that descendant elements are bound in the context of a specified object. (The differences between these binding are described below under [Parameters](#parameters).)

Of course, you can arbitrarily nest `with` and `using` bindings along with the other control-flow bindings such as [`if`](if-binding.html) and [`foreach`](foreach-binding.html).

### Example 1

Here is a very basic example of switching the binding context to a child object. Notice that in the `data-bind` attributes, it is *not* necessary to prefix `latitude` or `longitude` with `coords.`, because the binding context is switched to `coords`.

    <h1 data-bind="text: city"> </h1>
    <p data-bind="using: coords">
        Latitude: <span data-bind="text: latitude"> </span>,
        Longitude: <span data-bind="text: longitude"> </span>
    </p>

    <script type="text/javascript">
        ko.applyBindings({
            city: "London",
            coords: {
                latitude:  51.5001524,
                longitude: -0.1262362
            }
        });
    </script>

### Example 2

This interactive example demonstrates that:

 * The `with` binding will dynamically add or remove descendant elements depending on whether the associated value is `null`/`undefined` or not
 * If you want to access data/functions from parent binding contexts, you can use [special context properties such as `$parent` and `$root`](binding-context.html).

Try it out:

{% capture live_example_view %}
<form data-bind="submit: getTweets">
    Twitter account:
    <input data-bind="value: twitterName" />
    <button type="submit">Get tweets</button>
</form>

<div data-bind="with: resultData">
    <h3>Recent tweets fetched at <span data-bind="text: retrievalDate"> </span></h3>
    <ol data-bind="foreach: topTweets">
        <li data-bind="text: text"></li>
    </ol>

    <button data-bind="click: $parent.clearResults">Clear tweets</button>
</div>
{% endcapture %}

{% capture live_example_viewmodel %}
function AppViewModel() {
    var self = this;
    self.twitterName = ko.observable('@example');
    self.resultData = ko.observable(); // No initial value

    self.getTweets = function() {
        var name = self.twitterName(),
            simulatedResults = [
                { text: name + ' What a nice day.' },
                { text: name + ' Building some cool apps.' },
                { text: name + ' Just saw a famous celebrity eating lard. Yum.' }
            ];

        self.resultData({ retrievalDate: new Date(), topTweets: simulatedResults });
    }

    self.clearResults = function() {
        self.resultData(undefined);
    }
}

ko.applyBindings(new AppViewModel());
{% endcapture %}

{% include live-example-minimal.html %}

### Parameters

  * Main parameter

    The object that you want to use as the context for binding descendant elements.

    These bindings differ in how they deal with a value of `null` or `undefined`:
    
    * For the `with` binding, descendant elements will *not* be bound at all, but will instead be removed from the document.
    * For the `using` binding, it is generally incorrect to supply a `null` or `undefined` value since it will try to use that value as the context for descendant elements.

    If the expression you supply involves any observable values, the expression will be re-evaluated whenever any of those observables change. These bindings differ in how they react when the bound value changes:
    
    * For the `with` binding, descendant elements will be cleared out, and **a new copy of the markup** will be added to your document and bound in the context of the new value.
    * For the `using` binding, descendant elements will remain in the document and their bindings re-evaluated with the new context value.

  * Additional parameters

      * `on`

        The `on` option allows you set an alias for the new context object. Although you can refer to the object using the `$data` [context variable](binding-context.html), it may be useful to give it a more descriptive name using the `as` option like:

            <div data-bind="with: currentPerson, as: 'person'"></div>

        Now any descendant binding will be able to refer to `person` to access this context object. This can be especially useful in scenarios where you have nested contexts and you need to refer to something declared at a higher level in the hierarchy.

      * `noChildContext`

        The default behavior of the `as` option is to set a name for the provided object while still also binding the contents to the object. But you may prefer to keep the context unchanged and only set the name of the object. This latter behavior will probably be the default in a future version of Knockout. To turn it on for a specific binding, set the `noChildContext` option to `true`. When this option is used along with `as`, all access to the object must be through the given name, and `$data` will remain set to the outer viewmodel.
        
        For the `using` binding, although you can use this option, it would generally be more efficient and descriptive to use the [`let` binding](let-binding.html) instead. Rather than `using: currentPerson, as: 'person', noChildContext: true`, you'd use `let: { person: currentPerson }`.
        
### Note 1: Using "with" or "using" without a container element

Just like other control flow bindings such as [`if`](if-binding.html) and [`foreach`](foreach-binding.html), you can use `with` and `using` without any container element to host it. This is useful if you need to use these bindings in a place where it would not be legal to introduce a new container element just to hold the binding. See the documentation for [`if`](if-binding.html) or [`foreach`](foreach-binding.html) for more details.

Example:

    <ul>
        <li>Header element</li>
        <!-- ko with: outboundFlight -->
            ...
        <!-- /ko -->
        <!-- ko with: inboundFlight -->
            ...
        <!-- /ko -->
    </ul>

The `<!-- ko -->` and `<!-- /ko -->` comments act as start/end markers, defining a "virtual element" that contains the markup inside. Knockout understands this virtual element syntax and binds as if you had a real container element.

### Note 2: Why are there two similar bindings?

The `using` binding was introduced in Knockout 3.5 as a replacement for `with` when re-rendering descendant elements isn't desired. Because `using` re-evaluates descendant bindings instead of re-rendering, each descendant binding will include an additional dependency on the `using` context.

### Dependencies

None, other than the core Knockout library.