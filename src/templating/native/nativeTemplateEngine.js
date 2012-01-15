ko.nativeTemplateEngine = function () {
    this['allowTemplateRewriting'] = false;
}

ko.nativeTemplateEngine.prototype = new ko.templateEngine();
ko.nativeTemplateEngine.prototype['renderTemplateSource'] = function (templateSource, bindingContext, options) {
    var node = 'fragment' in templateSource && templateSource['fragment'](), templateText;
    if (node) {
        if (ko.utils.ieVersion < 9) {
            // IE<9 cloneNode doesn't work properly; extract HTML and use that instead
            var dummyContainer = document.createElement("div");
            dummyContainer.appendChild(node);
            templateSource['fragment'](undefined);
            templateSource['text'](templateText = dummyContainer.innerHTML);
        } else {
            return node.cloneNode(true);
        }
    } else {
        templateText = templateSource['text']();
    }
    return ko.utils.parseHtmlFragment(templateText);
};

ko.nativeTemplateEngine.instance = new ko.nativeTemplateEngine();
ko.setTemplateEngine(ko.nativeTemplateEngine.instance);

ko.exportSymbol('nativeTemplateEngine', ko.nativeTemplateEngine);