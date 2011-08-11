ko.nativeTemplateEngine = function () {
    this['allowTemplateRewriting'] = false;
    
    this['renderTemplateSource'] = function (templateSource, data, options) {
        var templateText = templateSource.text();
        var parsedElems = ko.utils.parseHtmlFragment(templateText);
        
        for (var i = 0, j = parsedElems.length; i < j; i++) {
            if (parsedElems[i].nodeType === 1)
                ko.applyBindings(data, parsedElems[i]);
        }
        
        return parsedElems;
    }
}

ko.nativeTemplateEngine.prototype = new ko.templateSourceAwareTemplateEngine();
ko.nativeTemplateEngine.instance = new ko.nativeTemplateEngine();
ko.setTemplateEngine(ko.nativeTemplateEngine.instance);

ko.exportSymbol('ko.nativeTemplateEngine', ko.nativeTemplateEngine);