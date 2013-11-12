ko.nativeTemplateEngine = function () {
    this['allowTemplateRewriting'] = false;

    // Maps a element id to the parsed HTML for that template
    this.namedTemplateCache = {}
}

ko.nativeTemplateEngine.prototype = new ko.templateEngine();
ko.nativeTemplateEngine.prototype.constructor = ko.nativeTemplateEngine;
ko.nativeTemplateEngine.prototype['renderTemplateSource'] = function (templateSource, bindingContext, options) {
    var useNodesIfAvailable = !(ko.utils.ieVersion < 9), // IE<9 cloneNode doesn't work properly
        templateNodesFunc = useNodesIfAvailable ? templateSource['nodes'] : null,
        templateNodes = templateNodesFunc ? templateSource['nodes']() : null;

    if (templateNodes) {
        var nodes;
        if (templateNodes instanceof Array) {
            nodes = [];
            for (var i = 0; i < templateNodes.length; ++i) {
                nodes.push(templateNodes[i].cloneNode(true));
            }
        } else {
            nodes = ko.utils.makeArray(templateNodes.cloneNode(true).childNodes);
        }
        return nodes;
    } else {
        var templateText = templateSource['text']();
        return ko.utils.parseHtmlFragment(templateText);
    }
};

ko.nativeTemplateEngine.instance = new ko.nativeTemplateEngine();
ko.setTemplateEngine(ko.nativeTemplateEngine.instance);

ko.exportSymbol('nativeTemplateEngine', ko.nativeTemplateEngine);
