---
layout: documentation
title: Extending Knockout's binding syntax using preprocessing
---

*Note: This is an advanced technique, typically used only when creating libraries of reusable bindings or extended syntaxes. It's not something you'll normally need to do when building applications with Knockout.*

Starting with Knockout 3.0, developers can define custom syntaxes by providing callbacks that rewrite DOM nodes and binding strings, or dynamically create binding handlers, during the binding process.

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

## Example 4: Including binding data in the binding name

If you'd like to be able to use a shorthand syntax for `foreach: {data: products, as: 'product'}` that includes the item name in the binding name, you can do so by overriding the `ko.getBindingHandler` function:

    function makeNamedForeachBinding(itemName, bindingKey) {
        return ko.bindingHandlers[bindingKey] = {
            init: function(element, valueAccessor, allBindings, vm, bindingContext) {
                ko.applyBindingAccessorsToNode(element, {foreach: function() {
                    return {
                        data: valueAccessor(),
                        as: itemName
                    };
                }}, bindingContext);
                return { controlsDescendantBindings: true };
            }
        };
    }
    var underlyingGetHandler = ko.getBindingHandler;
    ko.getBindingHandler = function(bindingKey) {
        return underlyingGetHandler(bindingKey) || (function() {
            var match = bindingKey.match(/foreach-(.+)/);
            if (match) 
                return makeNamedForeachBinding(match[1], bindingKey);
        })();
    };

Now you can bind to `products` like this:

    <div data-bind="foreach-product: products">
        <span data-bind="text: product.name"></span>
    </div>

