
(function () {
    var bindingAttributeName = "data-bind";
    ko.bindingHandlers = {};

    function parseBindingAttribute(attributeText, viewModel) {
        try {
            var json = " { " + ko.jsonExpressionRewriting.insertPropertyAccessorsIntoJson(attributeText) + " } ";
            return ko.utils.evalWithinScope(json, viewModel === null ? window : viewModel);
        } catch (ex) {
            throw new Error("Unable to parse binding attribute.\nMessage: " + ex + ";\nAttribute value: " + attributeText);
        }
    }

    function invokeBindingHandler(handler, element, dataValue, allBindings, viewModel) {
        handler(element, dataValue, allBindings, viewModel);
    }

    ko.applyBindingsToNode = function (node, bindings, viewModel, bindingAttribute) {
        var isFirstEvaluation = true;
        
        bindingAttribute = bindingAttribute || bindingAttributeName;
        
        // Each time the dependentObservable is evaluated (after data changes),
        // the binding attribute is reparsed so that it can pick out the correct
        // model properties in the context of the changed data.
        // DOM event callbacks need to be able to access this changed data,
        // so we need a single parsedBindings variable (shared by all callbacks
        // associated with this node's bindings) that all the closures can access.
        var parsedBindings;
        function makeValueAccessor(bindingKey) {
            return function () { return parsedBindings[bindingKey] }
        }
        function parsedBindingsAccessor() {
            return parsedBindings;
        }

        new ko.dependentObservable(
            function () {
                var evaluatedBindings = (typeof bindings == "function") ? bindings() : bindings;
                parsedBindings = evaluatedBindings || parseBindingAttribute(node.getAttribute(bindingAttribute), viewModel);

                // First run all the inits, so bindings can register for notification on changes
                if (isFirstEvaluation) {
                    for (var bindingKey in parsedBindings) {
                        if (ko.bindingHandlers[bindingKey] && typeof ko.bindingHandlers[bindingKey]["init"] == "function")
                            invokeBindingHandler(ko.bindingHandlers[bindingKey]["init"], node, makeValueAccessor(bindingKey), parsedBindingsAccessor, viewModel);
                    }
                }

                // ... then run all the updates, which might trigger changes even on the first evaluation
                for (var bindingKey in parsedBindings) {
                    if (ko.bindingHandlers[bindingKey] && typeof ko.bindingHandlers[bindingKey]["update"] == "function")
                        invokeBindingHandler(ko.bindingHandlers[bindingKey]["update"], node, makeValueAccessor(bindingKey), parsedBindingsAccessor, viewModel);
                }
            },
            null,
            { 'disposeWhenNodeIsRemoved' : node }
        );
        isFirstEvaluation = false;
    };

    /*  ko.applyBindings
     *
     *  4 method signatures:
     *  applyBindings(viewModel)                      <-- best practice, simple global ViewModels
     *  applyBindings(viewModel, rootNode)            <-- legacy support
     *  applyBindings(viewModel, namespace)           <-- best practice, complex multi-ViewModel pages
     *  applyBindings(viewModel, namespace, rootNode) <-- if you really must
     */
     
    ko.applyBindings = function (viewModel, namespace, rootNode) {
        if (namespace && (namespace.nodeType !== undefined)) {
          rootNode = namespace;
          namespace = '';
        }
        else {
          namespace = (namespace && namespace.length > 0) ? ('-' + namespace) : '';  // Prefix -namespace
          rootNode = rootNode || window.document.body;                  // Make "rootNode" parameter optional
        }
        var bindingAttributeNameNs = bindingAttributeName + namespace,
            elemsWithBindingAttribute = ko.utils.getElementsHavingAttribute(rootNode, bindingAttributeNameNs);
        ko.utils.arrayForEach(elemsWithBindingAttribute, function (element) {
            ko.applyBindingsToNode(element, null, viewModel, bindingAttributeNameNs);
        });
    };

    ko.exportSymbol('ko.bindingHandlers', ko.bindingHandlers);
    ko.exportSymbol('ko.applyBindings', ko.applyBindings);
    ko.exportSymbol('ko.applyBindingsNs', ko.applyBindingsNs);
})();