/// <reference path="../templating.js" />

ko.jqueryTmplTemplateEngine = function () {
    // Detect which version of jquery-tmpl you're using. Unfortunately jquery-tmpl 
    // doesn't expose a version number, so we have to infer it.
    this.jQueryTmplVersion = (function() {
        var missingDependenciesError = "To use KO's default template engine, reference jQuery and jquery-tmpl. See Knockout installation documentation for more details.";
        if (typeof(jQuery) == "undefined")
            return 0; //throw new Error("jQuery not detected.\n" + missingDependenciesError);
        if (!jQuery.tmpl)
            return 0; //throw new Error("jquery.tmpl not detected.\n" + missingDependenciesError);
        if (jQuery.tmpl.tag)
            return 2; // Since it exposes no official version number, we use our own numbering system. To be updated as jquery-tmpl evolves.
        return 1;
    })();

    function getTemplateNode(template) {
        var templateNode = document.getElementById(template);
        if (templateNode == null)
            throw new Error("Cannot find template with ID=" + template);
        return templateNode;
    }

    // These two only needed for jquery-tmpl v1
    var aposMarker = "__ko_apos__";
    var aposRegex = new RegExp(aposMarker, "g");
    
    this['renderTemplate'] = function (template, data, options) {
        if (this.jQueryTmplVersion == 1) {    	
            // jquery.tmpl v1 doesn't like it if the template returns just text content or nothing - it only likes you to return DOM nodes.
            // To make things more flexible, we can wrap the whole template in a <script> node so that jquery.tmpl just processes it as
            // text and doesn't try to parse the output. Then, since jquery.tmpl has jQuery as a dependency anyway, we can use jQuery to
            // parse that text into a document fragment using jQuery.clean().        
            var templateTextInWrapper = "<script type=\"text/html\">" + getTemplateNode(template).text + "</script>";
            var renderedMarkupInWrapper = $.tmpl(templateTextInWrapper, data);
            var renderedMarkup = renderedMarkupInWrapper[0].text.replace(aposRegex, "'");;
            return jQuery.clean([renderedMarkup], document);
        }
        
        // It's easier with jquery.tmpl v2 and later - it handles any DOM structure
        data = [data]; // Prewrap the data in an array to stop jquery-tmpl from trying to unwrap any arrays
        var templateText = getTemplateNode(template).text;
        return $.tmpl(templateText, data);
    },

    this['isTemplateRewritten'] = function (template) {
        return getTemplateNode(template).isRewritten === true;
    },

    this['rewriteTemplate'] = function (template, rewriterCallback) {
        var templateNode = getTemplateNode(template);
        var rewritten = rewriterCallback(templateNode.text);     
        
        if (this.jQueryTmplVersion == 1) {
            // jquery.tmpl v1 falls over if you use single-quotes, so replace these with a temporary marker for template rendering, 
            // and then replace back after the template was rendered. This is slightly complicated by the fact that we must not interfere
            // with any code blocks - only replace apos characters outside code blocks.
            rewritten = ko.utils.stringTrim(rewritten);
            rewritten = rewritten.replace(/([\s\S]*?)(\${[\s\S]*?}|{{[\=a-z][\s\S]*?}}|$)/g, function(match) {
                // Called for each non-code-block followed by a code block (or end of template)
                var nonCodeSnippet = arguments[1];
                var codeSnippet = arguments[2];
                return nonCodeSnippet.replace(/\'/g, aposMarker) + codeSnippet;
            });         	
        }
        
        templateNode.text = rewritten;
        templateNode.isRewritten = true;
    },

    this['createJavaScriptEvaluatorBlock'] = function (script) {
        if (this.jQueryTmplVersion == 1)
            return "{{= " + script + "}}";
            
        // From v2, jquery-tmpl does some parameter parsing that fails on nontrivial expressions.
        // Prevent it from messing with the code by wrapping it in a further function.
        return "{{ko_code ((function() { return " + script + " })()) }}";
    },

    this.addTemplate = function (templateName, templateMarkup) {
        document.write("<script type='text/html' id='" + templateName + "'>" + templateMarkup + "</script>");
    }
    
    if (this.jQueryTmplVersion > 1) {
        jQuery.tmpl.tag.ko_code = {
            open: "_.push($1 || '');"
        };
    }    
};

ko.jqueryTmplTemplateEngine.prototype = new ko.templateEngine();

// Use this one by default
ko.setTemplateEngine(new ko.jqueryTmplTemplateEngine());