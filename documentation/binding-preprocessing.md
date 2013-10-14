---
layout: documentation
title: Extending Knockout's binding syntax using preprocessing
---

*Note: This is an advanced technique, typically used only when creating libraries of reusable bindings or extended syntaxes. It's not something you'll normally need to do when building applications with Knockout.*

Starting with Knockout 3.0, developers can define custom syntaxes by providing callbacks that rewrite DOM nodes and binding strings during the binding process.

## Example 1: Setting a default value for a binding

If you leave off the value of a binding, it's bound to `undefined` by default. If you want to have a different default value for a binding, you can do so with a preprocessor. For example, you can allow `uniqueName` to be bound without a value by making its default value `true`:

    ko.bindingHandlers.uniqueName.preprocess = function(val) {
        return val || 'true';
    }

Now you can bind it like this:

    <input data-bind="value: someModelProperty, uniqueName" />
    
## Example 2: Binding expressions to events

If you'd like to be able to bind expressions to `click` events (rather than a function reference as Knockout expects), you can set up a preprocessor for the `click` handler to support this syntax:

    ko.bindingHandlers.click.preprocess = function(val) {
        return 'function($data,$event){ ' + val + ' }';
    }

Now you can bind `click` like this:

    <button type="button" data-bind="click: myCount(myCount()+1)">Increment</button>

## Example 3: Virtual template elements

If you commonly include template content using virtual elements, the normal syntax can feel a bit verbose. Using preprocessing, you can add a new template format that uses a single comment:

    ko.bindingProvider.instance.preprocessNode = function(node) {
        if (node.nodeType == 8) {
            var match = node.nodeValue.match(/^\s*(template\s*:[\s\S]+)/);
            if (match) {
                // Create a pair of comments to replace the single comment
                var c1 = document.createComment("ko " + match[1]),
                    c2 = document.createComment("/ko");
                node.parentNode.insertBefore(c1, node);
                node.parentNode.replaceChild(c2, node);
                return [c1, c2];
            }
        }
    }

Now you can include a template in your view like this:

    <!-- template: 'some-template' -->

# Preprocessing Reference

* `ko.bindingHandlers.<name>.preprocess( value, name, addBinding(name, value) )` --- If defined, this function will be called for each `<name>` binding before the binding is evaluated. `value` is the text of the binding value, `name` is the binding name, and `addBinding` is a callback function that allows the `preprocess` function to add another binding. The `preprocess` function should return the new text value of the binding, or return `undefined` to remove the binding.

* `ko.bindingProvider.instance.preprocessNode( node )` --- If defined, this function will be called for each DOM node before bindings are processed. The function can modify, remove, or replace the given node. Any modifications must be made to the DOM tree, and if any nodes were added or the given node was removed, the function must return an array of the new nodes.
