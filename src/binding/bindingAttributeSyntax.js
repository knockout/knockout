/// <reference path="../subscribables/dependentObservable.js" />

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

    ko.applyBindingsToNode = function (node, bindings, viewModel) {
        var isFirstEvaluation = true;
        new ko.dependentObservable(
            function () {
                var evaluatedBindings = (typeof bindings == "function") ? bindings() : bindings;
                var parsedBindings = evaluatedBindings || parseBindingAttribute(node.getAttribute(bindingAttributeName), viewModel);
                for (var bindingKey in parsedBindings) {
                    if (ko.bindingHandlers[bindingKey]) {
                        if (isFirstEvaluation && typeof ko.bindingHandlers[bindingKey].init == "function")
                            invokeBindingHandler(ko.bindingHandlers[bindingKey].init, node, parsedBindings[bindingKey], parsedBindings, viewModel);
                        if (typeof ko.bindingHandlers[bindingKey].update == "function")
                            invokeBindingHandler(ko.bindingHandlers[bindingKey].update, node, parsedBindings[bindingKey], parsedBindings, viewModel);
                    }
                }
            },
            null,
            { disposeWhen: function () { return !ko.utils.domNodeIsAttachedToDocument(node); } }
        );
        isFirstEvaluation = false;
    };

    ko.applyBindings = function (rootNode, viewModel) {
        var elemsWithBindingAttribute = ko.utils.getElementsHavingAttribute(rootNode, bindingAttributeName);
        ko.utils.arrayForEach(elemsWithBindingAttribute, function (element) {
            ko.applyBindingsToNode(element, null, viewModel);
        });
    };
})();