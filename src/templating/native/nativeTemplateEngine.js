ko.nativeTemplateEngine = function () {
    this['allowTemplateRewriting'] = false;
}

ko.nativeTemplateEngine.prototype = new ko.templateEngine();
ko.nativeTemplateEngine.prototype.constructor = ko.nativeTemplateEngine;
ko.nativeTemplateEngine.prototype['templateCache'] = {};
ko.nativeTemplateEngine.prototype['renderTemplateSource'] = function (templateSource, bindingContext, options) {
    var useNodesIfAvailable = !(ko.utils.ieVersion < 9), // IE<9 cloneNode doesn't work properly
        templateNodesFunc = useNodesIfAvailable ? templateSource['nodes'] : null,
        templateNodes = templateNodesFunc ? templateSource['nodes']() : null;

    if (templateNodes) {
        return ko.utils.makeArray(templateNodes.cloneNode(true).childNodes);
    } else {
        var id = templateSource.domElement.id;
        var cache = ko.nativeTemplateEngine.prototype.templateCache || {};

        // If the template is not cached, parse it
        if (!cache[id]) {
            var templateText = templateSource['text']();
            cache[id] = ko.utils.parseHtmlFragment(templateText);

            // Keep the template cached for 5s, to optimize batch template use, such as templatized foreach
            setTimeout(function() {
                cache[id] = null;
            }, 5000);
        }

        // Clone the template nodes
        var templateNodes = [];
        for (var i = 0; i < cache[id].length; ++i) {
            templateNodes.push(cache[id][i].cloneNode(true));
        }

        return templateNodes;
    }
};

ko.nativeTemplateEngine.instance = new ko.nativeTemplateEngine();
ko.setTemplateEngine(ko.nativeTemplateEngine.instance);

ko.exportSymbol('nativeTemplateEngine', ko.nativeTemplateEngine);
