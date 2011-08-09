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
    
    this['renderTemplate'] = function (template, data, options) {
        var templateSource = this['makeTemplateSource'](template);
        return this['renderTemplateSource'](templateSource, data, options);
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