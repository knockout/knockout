(function (undefined) {
    // Overridable API for determining which component name applies to a given node. By overriding this,
    // you can for example map specific tagNames to components that are not preregistered.
    ko.components['getComponentNameForNode'] = function(node) {
        var tagNameLower = ko.utils.tagNameLower(node);
        return ko.components.isRegistered(tagNameLower) && tagNameLower;
    };

    ko.components.addBindingsForCustomElement = function(allBindings, node, bindingContext, valueAccessors) {
        // Determine if it's really a custom element matching a component
        if (node.nodeType === 1) {
            var componentName = ko.components['getComponentNameForNode'](node);
            if (componentName) {
                // It does represent a component, so add a component binding for it
                allBindings = allBindings || {};

                if (allBindings['component']) {
                    // Avoid silently overwriting some other 'component' binding that may already be on the element
                    throw new Error('Cannot use the "component" binding on a custom element matching a component');
                }

                var componentBindingValue = { 'name': componentName, 'params': getComponentParamsFromCustomElement(node, bindingContext) };

                allBindings['component'] = valueAccessors
                    ? function() { return componentBindingValue; }
                    : componentBindingValue;
            }
        }

        return allBindings;
    }

    var nativeBindingProviderInstance = new ko.bindingProvider();

    function getComponentParamsFromCustomElement(elem, bindingContext) {
        var paramsAttribute = elem.getAttribute('params');

        if (paramsAttribute) {
            var params = nativeBindingProviderInstance['parseBindingsString'](paramsAttribute, bindingContext, elem, { 'valueAccessors': true });
            return ko.utils.objectMap(params, function(paramValue, paramName) {
                // Does the evaluation of the parameter value unwrap any observables?
                var computed = ko.computed(paramValue, null, { 'disposeWhenNodeIsRemoved': elem }),
                    computedValue = computed.peek();
                if (!computed.isActive()) {
                    // No it doesn't, so there's no need for any computed wrapper. Just pass through the supplied value directly.
                    // Example: "someVal: firstName, age: 123" (whether or not firstName is an observable/computed)
                    return computedValue;
                } else {
                    // Yes it does. Is the resulting value itself observable?
                    if (!ko.isObservable(computedValue)) {
                        // No it isn't, so supply a computed property whose value is the result of the binding expression.
                        // Example: "someVal: firstName().length"
                        return computed;
                    } else {
                        // Yes it is, so create a further wrapper that supplies the inner unwrapped value (otherwise
                        // the component would have to double-unwrap this parameter to get the intended value).
                        // Example: "someVal: manager().firstName" (where firstName is observable)
                        return ko.computed(function() { return ko.utils.unwrapObservable(computed()); }, null, { 'disposeWhenNodeIsRemoved': elem });
                    }
                }
            });
        } else {
            return null;
        }
    }
})();