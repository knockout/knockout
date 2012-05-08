---
layout: documentation
title: Creating custom bindings that support virtual elements
---

*Note: This is an advanced technique, typically used only when creating libraries of reusable bindings. It's not something you'll normally need to do when building applications with Knockout.*

Knockout's *control flow bindings* (e.g., [`if`](if-binding.html) and [`foreach`](foreach-binding.html)) can be applied not only to regular DOM elements, but also to "virtual" DOM elements defined by a special comment-based syntax. For example:

    <ul>
        <li class="heading">My heading</li>
        <!-- ko foreach: items -->
            <li data-bind="text: $data"></li>
        <!-- /ko -->
    </ul>

Custom bindings can work with virtual elements too, but to enable this, you must explicitly tell Knockout that your binding understands virtual elements, by using the `ko.virtualElements.allowedBindings` API.

### Example

To get started, here's a custom binding that randomises the order of DOM nodes:

    ko.bindingHandlers.randomOrder = {
        init: function(elem, valueAccessor) {
            // Pull out each of the child elements into an array
            var childElems = [];
            while(elem.firstChild)
                childElems.push(elem.removeChild(elem.firstChild));

            // Put them back in a random order
            while(childElems.length) {
                var randomIndex = Math.floor(Math.random() * childElems.length),
                    chosenChild = childElems.splice(randomIndex, 1);
                elem.appendChild(chosenChild[0]);
            }
        }
    };

This works nicely with regular DOM elements. The following elements will be shuffled into a random order:

    <div data-bind="randomOrder: true">
        <div>First</div>
        <div>Second</div>
        <div>Third</div>
    </div>

However, it does *not* work with virtual elements. If you try the following:

    <!-- ko randomOrder: true -->
        <div>First</div>
        <div>Second</div>
        <div>Third</div>
    <!-- /ko -->

... then you'll get the error `The binding 'randomOrder' cannot be used with virtual elements`. Let's fix this. To make `randomOrder` usable with virtual elements, start by telling Knockout to allow it. Add the following:

    ko.virtualElements.allowedBindings.randomOrder = true;

Now there won't be an error. However, it still won't work properly, because our `randomOrder` binding is coded using normal DOM API calls (`firstChild`, `appendChild`, etc.) which don't understand virtual elements. This is the reason why KO requires you to explicitly opt in to virtual element support: unless your custom binding is coded using virtual element APIs, it's not going to work properly!

Let's update the code for `randomOrder`, this time using KO's virtual element APIs:

    ko.bindingHandlers.randomOrder = {
        init: function(elem, valueAccessor) {
            // Build an array of child elements
            var child = ko.virtualElements.firstChild(elem),
                childElems = [];
            while (child) {
                childElems.push(child);
                child = ko.virtualElements.nextSibling(child);
            }

            // Remove them all, then put them back in a random order
            ko.virtualElements.emptyNode(elem);
            while(childElems.length) {
                var randomIndex = Math.floor(Math.random() * childElems.length),
                    chosenChild = childElems.splice(randomIndex, 1);
                ko.virtualElements.prepend(elem, chosenChild[0]);
            }
        }
    };

Notice how, instead of using APIs like `domElement.firstChild`, we're now using `ko.virtualElements.firstChild(domOrVirtualElement)`. The `randomOrder` binding will now correctly work with virtual elements, e.g., `<!-- ko randomOrder: true -->...<!-- /ko -->`. 

Also, `randomOrder` will still work with regular DOM elements, because all of the `ko.virtualElements` APIs are backwardly compatible with regular DOM elements.

### Virtual Element APIs

Knockout provides the following functions for working with virtual elements.

* `ko.virtualElements.allowedBindings`

  An object whose keys determine which bindings are usable with virtual elements. Set `ko.virtualElements.allowedBindings.mySuperBinding = true` to allow `mySuperBinding` to be used with virtual elements. 

* `ko.virtualElements.emptyNode(containerElem)`

  Removes all child nodes from the real or virtual element `containerElem` (cleaning away any data associated with them to avoid memory leaks).

* `ko.virtualElements.firstChild(containerElem)`

  Returns the first child of the real or virtual element `containerElem`, or `null` if there are no children.

* `ko.virtualElements.insertAfter(containerElem, nodeToInsert, insertAfter)`

  Inserts `nodeToInsert` as a child of the real or virtual element `containerElem`, positioned immediately after `insertAfter` (where `insertAfter` must be a child of `containerElem`).

* `ko.virtualElements.nextSibling(node)`

  Returns the sibling node that follows `node` in its real or virtual parent element, or `null` if there is no following sibling.

* `ko.virtualElements.prepend(containerElem, nodeToPrepend)`

  Inserts `nodeToPrepend` as the first child of the real or virtual element `containerElem`.

* `ko.virtualElements.setDomNodeChildren(containerElem, arrayOfNodes)`

  Removes all child nodes from the real or virtual element `containerElem` (in the process, cleaning away any data associated with them to avoid memory leaks), and then inserts all of the nodes from `arrayOfNodes` as its new children.

Notice that this is *not* intended to be a complete replacement to the full set of regular DOM APIs. Knockout provides only a minimal set of virtual element APIs to make it possible to perform the kinds of transformations needed when implementing control flow bindings.