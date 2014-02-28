---
layout: documentation
title: Custom disposal logic
---

- In a typical Knockout application, content is dynamically added and removed from the page. This normally happens through the [`template`](template-binding.html) binding or as part of the control-flow bindings ([`if`](if-binding.html), [`ifnot`](ifnot-binding.html), [`with`](with-binding.html), and [`foreach`](foreach-binding.html)).
- When creating a custom binding, it is often desirable to add clean-up logic that runs when the element containing the binding is removed by Knockout.
- Many widgets and third-party plugins, that might be initiated through a custom binding, include "dispose" or "destroy" functionality that should be called when the element is removed.

### Registering a callback on the disposal of an element

To register a function to run when a node is removed, you can call `ko.utils.domNodeDisposal.addDisposeCallback(node, callback)`. As an example, suppose you create a custom binding to instantiate a widget. When the element with the binding is removed, you may want to call the `destroy` method of the widget:

    ko.bindingHandlers.myWidget = {
        init: function(element, valueAccessor) {
            var options = ko.unwrap(valueAccessor()),
                $el = $(element);

            $el.myWidget(options);

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                $el.myWidget("destroy");
            });
        }
    };

### Overriding the clean-up of external data

When removing an element, Knockout runs logic to clean-up any data associated with the element. As part of this logic, jQuery's `cleanData` method is called, if jQuery is available. In advanced scenarios, you may want to prevent or customize how this data is removed in your application. Knockout exposes a function, `ko.utils.domNodeDisposal.cleanExternalData(node)`, that can be overridden to support custom logic. For example, to prevent `cleanData` from being called, an empty function could be used to replace the standard `cleanExternalData` implementation:

    ko.utils.domNodeDisposal.cleanExternalData = function() {
      //do nothing
    };
