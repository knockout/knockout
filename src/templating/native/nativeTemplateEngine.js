ko.nativeTemplateEngine = function () {
    function getTemplateText(templateSource) {
        // If it's a string, we assume it's the ID of a DOM element whose innerHTML defines the template
        if (typeof templateSource == "string") {
            var foundElem = document.getElementById(templateSource);
            if (!foundElem)
                throw new Error("Cannot find template with ID " + templateSource);
            return foundElem.innerHTML;
        }
    }
    
    this['renderTemplate'] = function (templateSource, data, options) {
        var templateText = getTemplateText(templateSource);
        var parsedElems = ko.utils.parseHtmlFragment(templateText);
        
        for (var i = 0, j = parsedElems.length; i < j; i++) {
            if (parsedElems[i].nodeType === 1)
                ko.applyBindings(data, parsedElems[i]);
        }
        
        return parsedElems;
    },
    this['isTemplateRewritten'] = function (templateSource) {
        return true;
    },
    this['rewriteTemplate'] = function (templateSource, rewriterCallback) {
        // Native template engine requires no rewriting, so do nothing
    },
    this['createJavaScriptEvaluatorBlock'] = function (script) {
        throw new Error("Native template engine doesn't support JavaScript evaluator blocks.")
    }	
}

ko.nativeTemplateEngine.prototype = new ko.templateEngine();
ko.setTemplateEngine(new ko.nativeTemplateEngine());

ko.exportSymbol('ko.nativeTemplateEngine', ko.nativeTemplateEngine);