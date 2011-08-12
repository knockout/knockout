
ko.templateRewriting = (function () {
    var memoizeBindingAttributeSyntaxRegex = /(<[a-z]+\d*(\s+(?!data-bind=)[a-z0-9\-]+(=(\"[^\"]*\"|\'[^\']*\'))?)*\s+)data-bind=(["'])([\s\S]*?)\5/gi;

    return {
        ensureTemplateIsRewritten: function (template, templateEngine) {
            if (!templateEngine['isTemplateRewritten'](template))
                templateEngine['rewriteTemplate'](template, function (htmlString) {
                    return ko.templateRewriting.memoizeBindingAttributeSyntax(htmlString, templateEngine);
                });
        },

        memoizeBindingAttributeSyntax: function (htmlString, templateEngine) {
            return htmlString.replace(memoizeBindingAttributeSyntaxRegex, function () {
                var tagToRetain = arguments[1];
                var dataBindAttributeValue = arguments[6];

                dataBindAttributeValue = ko.jsonExpressionRewriting.insertPropertyAccessorsIntoJson(dataBindAttributeValue);

                // For no obvious reason, Opera fails to evaluate dataBindAttributeValue unless it's wrapped in an additional anonymous function,
                // even though Opera's built-in debugger can evaluate it anyway. No other browser requires this extra indirection.
                var applyBindingsToNextSiblingScript = "ko.templateRewriting.applyMemoizedBindingsToNextSibling(function() { \
                    return (function() { return { " + dataBindAttributeValue + " } })() \
                })";
                return templateEngine['createJavaScriptEvaluatorBlock'](applyBindingsToNextSiblingScript) + tagToRetain;
            });
        },

        applyMemoizedBindingsToNextSibling: function (bindings) {
            return ko.memoization.memoize(function (domNode, bindingContext) {
                if (domNode.nextSibling)
                    ko.applyBindingsToNode(domNode.nextSibling, bindings, bindingContext);
            });
        }
    }
})();

ko.exportSymbol('ko.templateRewriting', ko.templateRewriting);
ko.exportSymbol('ko.templateRewriting.applyMemoizedBindingsToNextSibling', ko.templateRewriting.applyMemoizedBindingsToNextSibling); // Exported only because it has to be referenced by string lookup from within rewritten template
