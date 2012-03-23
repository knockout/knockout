// If you want to make a custom template engine,
// 
// [1] Inherit from this class (like ko.nativeTemplateEngine does)
// [2] Override 'renderTemplateSource', supplying a function with this signature:
//
//        function (templateSource, bindingContext, options) {
//            // - templateSource.text() is the text of the template you should render
//            // - bindingContext.$data is the data you should pass into the template
//            //   - you might also want to make bindingContext.$parent, bindingContext.$parents, 
//            //     and bindingContext.$root available in the template too
//            // - options gives you access to any other properties set on "data-bind: { template: options }"
//            //
//            // Return value: an array of DOM nodes
//        }
//
// [3] Override 'createJavaScriptEvaluatorBlock', supplying a function with this signature:
//
//        function (script) {
//            // Return value: Whatever syntax means "Evaluate the JavaScript statement 'script' and output the result"
//            //               For example, the jquery.tmpl template engine converts 'someScript' to '${ someScript }' 
//        }
//
//     This is only necessary if you want to allow data-bind attributes to reference arbitrary template variables.
//     If you don't want to allow that, you can set the property 'allowTemplateRewriting' to false (like ko.nativeTemplateEngine does)
//     and then you don't need to override 'createJavaScriptEvaluatorBlock'.

ko.templateEngine = function () { };

ko.templateEngine.prototype['renderTemplateSource'] = function (templateSource, bindingContext, options) {
    throw new Error("Override renderTemplateSource");
};

ko.templateEngine.prototype['createJavaScriptEvaluatorBlock'] = function (script) {
    throw new Error("Override createJavaScriptEvaluatorBlock");
};

ko.templateEngine.prototype['makeTemplateSource'] = function(template, options) {
    // Named template
    if (typeof template == "string") {
        var doc = (options && options['document']) || document;
        var elem = doc.getElementById(template);
        if (!elem)
            throw new Error("Cannot find template with ID " + template);
        return new ko.templateSources.domElement(elem);
    } else if ((template.nodeType == 1) || (template.nodeType == 8)) {
        // Anonymous template
        return new ko.templateSources.anonymousTemplate(template);
    } else
        throw new Error("Unknown template type: " + template);
};

ko.templateEngine.prototype['renderTemplate'] = function (template, bindingContext, options) {
    var templateSource = this['makeTemplateSource'](template, options);
    return this['renderTemplateSource'](templateSource, bindingContext, options);
};

ko.templateEngine.prototype['isTemplateRewritten'] = function (template, options) {
    // Skip rewriting if requested
    if (this['allowTemplateRewriting'] === false)
        return true;
    
    // Perf optimisation - see below
    if (isKnownRewrittenTemplate(this, template, options && options['document']))
        return true;
    
    return this['makeTemplateSource'](template, options)['data']("isRewritten");
};

ko.templateEngine.prototype['rewriteTemplate'] = function (template, rewriterCallback, options) {
    var templateSource = this['makeTemplateSource'](template, options);
    var rewritten = rewriterCallback(templateSource['text']());
    templateSource['text'](rewritten);
    templateSource['data']("isRewritten", true);
    
    // Perf optimisation - for named templates, track which ones have been rewritten so we can
    // answer 'isTemplateRewritten' *without* having to use getElementById (which is slow on IE < 8)
    if (typeof template == "string")
        isKnownRewrittenTemplate(this, template, options && options['document'], true);
};

// Records which templates, in each document, are rewritten
// Underlying storage is on the doc, to avoid leaking memory by holding references to docs
var isKnownRewrittenDomDataKey = "__ko_knownrewritten__";
function isKnownRewrittenTemplate(templateEngine, templateName, doc, value) { // Call with 2 args to read, 3 args to write
    doc = doc || document;
    var knownRewrittenCacheForDoc = ko.utils.domData.get(doc, isKnownRewrittenDomDataKey);
    if (!knownRewrittenCacheForDoc) {
        knownRewrittenCacheForDoc = {};
        ko.utils.domData.set(doc, isKnownRewrittenDomDataKey, knownRewrittenCacheForDoc);
    }
    knownRewrittenCacheForDoc[templateEngine] = knownRewrittenCacheForDoc[templateEngine] || {};

    if (arguments.length > 2)
        knownRewrittenCacheForDoc[templateEngine][templateName] = value;
    return knownRewrittenCacheForDoc[templateEngine][templateName];
}

ko.exportSymbol('templateEngine', ko.templateEngine);
