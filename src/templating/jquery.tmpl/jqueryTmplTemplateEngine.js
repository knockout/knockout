
ko.jqueryTmplTemplateEngine = function () {
    // Detect which version of jquery-tmpl you're using. Unfortunately jquery-tmpl 
    // doesn't expose a version number, so we have to infer it.
    // Note that as of Knockout 1.3, we only support jQuery.tmpl 1.0.0pre and later,
    // which KO internally refers to as version "2", so older versions are no longer detected.
    var jQueryTmplVersion = (function() {      
        if ((typeof(jQuery) == "undefined") || !jQuery['tmpl'])
            return 0;
        // Since it exposes no official version number, we use our own numbering system. To be updated as jquery-tmpl evolves.
        try {
            if (jQuery['tmpl']['tag']['tmpl']['open'].toString().indexOf('__') >= 0) {
                return 2; // Since 1.0.0pre, custom tags should append markup to an array called "__"
            }        	
        } catch(ex) { /* Apparently not the version we were looking for */ }
        
        return 1; // Any older version that we don't support
    })();
    
    function ensureHasReferencedJQueryTemplates() {
        var errorMessage = jQueryTmplVersion == 0 ? "jquery.tmpl not detected.\nTo use KO's default template engine, reference jQuery and jquery.tmpl. See Knockout installation documentation for more details."
                         : jQueryTmplVersion == 1 ? "Your version of jQuery.tmpl is too old. Please upgrade to jQuery.tmpl 1.0.0pre or later."
                         : null;
        if (errorMessage)
            throw new Error(errorMessage);
    }

    this['getTemplateNode'] = function (template) {
        var templateNode = document.getElementById(template);
        if (!templateNode)
            throw new Error("Cannot find template with ID=" + template);
        return templateNode;
    }
    
    this['renderTemplate'] = function (templateId, data, options) {
        options = options || {};
        ensureHasReferencedJQueryTemplates();
        
        if (!(templateId in jQuery['template'])) {
            // Precache a precompiled version of this template (don't want to reparse on every render)
            var templateText = this['getTemplateNode'](templateId).text;
            jQuery['template'](templateId, templateText);
        }        
        data = [data]; // Prewrap the data in an array to stop jquery.tmpl from trying to unwrap any arrays
        
        var resultNodes = jQuery['tmpl'](templateId, data, options['templateOptions']);
        resultNodes['appendTo'](document.createElement("div")); // Using "appendTo" forces jQuery/jQuery.tmpl to perform necessary cleanup work
        jQuery['fragments'] = {}; // Clear jQuery's fragment cache to avoid a memory leak after a large number of template renders
        return resultNodes; 
    },

    this['isTemplateRewritten'] = function (templateId) {
        ensureHasReferencedJQueryTemplates.call(this);
        
        // It must already be rewritten if we've already got a cached version of it
        // (this optimisation helps on IE < 9, because it greatly reduces the number of getElementById calls)
        if (templateId in jQuery['template'])
            return true;
        
        return this['getTemplateNode'](templateId).isRewritten === true;
    },

    this['rewriteTemplate'] = function (template, rewriterCallback) {
        var templateNode = this['getTemplateNode'](template);
        templateNode.text = rewriterCallback(templateNode.text);
        templateNode.isRewritten = true;
    },

    this['createJavaScriptEvaluatorBlock'] = function (script) {
        return "{{ko_code ((function() { return " + script + " })()) }}";
    },

    this.addTemplate = function (templateName, templateMarkup) {
        document.write("<script type='text/html' id='" + templateName + "'>" + templateMarkup + "</script>");
    }
    ko.exportProperty(this, 'addTemplate', this.addTemplate);
    
    if (jQueryTmplVersion >= 2) {
        jQuery['tmpl']['tag']['ko_code'] = {
            open: "__.push($1 || '');"
        };
    }
};

ko.jqueryTmplTemplateEngine.prototype = new ko.templateEngine();

// Use this one by default
ko.setTemplateEngine(new ko.jqueryTmplTemplateEngine());

ko.exportSymbol('ko.jqueryTmplTemplateEngine', ko.jqueryTmplTemplateEngine);