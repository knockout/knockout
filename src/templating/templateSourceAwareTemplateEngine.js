// If you want to make a custom template engine that works with anonymous templates, inherit from 
// this class instead of inheriting from ko.templateEngine directly.
//
// This base class already knows how to work with both named and anonymous templates, plus it handles
// template rewriting automatically. All you have to do is override the "renderTemplateSource" function
// and possibly also "createJavaScriptEvaluatorBlock"
//
//   renderTemplateSource(templateSource, data, options) - renders the supplied templateSource (see templateSource.js)
//                                                         and returns an array of DOM elements
//
//   createJavaScriptEvaluatorBlock(script) - returns whatever markup your template engine uses to represent an executable
//                                            block of JavaScript code.
//                                            This is invoked by KO as part of template rewriting. So, if your template engine
//                                            allows template rewriting (i.e., if its allowTemplateRewriting property
//                                            is not strictly false), be sure to override this function.

ko.templateSourceAwareTemplateEngine = function() {
    this['makeTemplateSource'] = function(template) {
        // Named template
        if (typeof template == "string") {
            var elem = document.getElementById(template);
            if (!elem)
                throw new Error("Cannot find template with ID " + template);
            return new ko.templateSources.domElement(elem);
        } else if (template.nodeType == 1) {
            // Anonymous template
            return new ko.templateSources.anonymousTemplate(template);
        } else
            throw new Error("Unrecognised template type: " + template);
    }
    
    this['renderTemplate'] = function (template, bindingContext, options) {
        var templateSource = this['makeTemplateSource'](template);
        return this['renderTemplateSource'](templateSource, bindingContext, options);
    };
    this['isTemplateRewritten'] = function (template) {
        // Skip rewriting if requested
        if (this['allowTemplateRewriting'] === false)
            return true;
        
        // Perf optimisation - see below
        if (this.knownRewrittenTemplates && this.knownRewrittenTemplates[template])
            return true;
        
        return this['makeTemplateSource'](template)['data']("isRewritten");
    };
    this['rewriteTemplate'] = function (template, rewriterCallback) {
        var templateSource = this['makeTemplateSource'](template);	    	
        var rewritten = rewriterCallback(templateSource['text']());
        templateSource['text'](rewritten);
        templateSource['data']("isRewritten", true);
        
        // Perf optimisation - for named templates, track which ones have been rewritten so we can
        // answer 'isTemplateRewritten' *without* having to use getElementById (which is slow on IE < 8)
        if (typeof template == "string") {
            this.knownRewrittenTemplates = this.knownRewrittenTemplates || {};
            this.knownRewrittenTemplates[template] = true;            
        }
    };
    this['renderTemplateSource'] = function (templateSource, data, options) {
        throw "Override renderTemplateSource in your ko.templateSourceAwareTemplateEngine subclass";
    };    	
};

ko.templateSourceAwareTemplateEngine.prototype = new ko.templateEngine();
ko.exportSymbol('ko.templateSourceAwareTemplateEngine', ko.templateSourceAwareTemplateEngine);