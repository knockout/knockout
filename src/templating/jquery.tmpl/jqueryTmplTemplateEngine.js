/// <reference path="../templating.js" />

ko.jqueryTmplTemplateEngine = function () {
    function getTemplateNode(template) {
        var templateNode = document.getElementById(template);
        if (templateNode == null)
            throw new Error("Cannot find template with ID=" + template);
        return templateNode;
    }

	var aposMarker = "__ko_apos__";
	var aposRegex = new RegExp(aposMarker, "g");
    this.renderTemplate = function (template, data, options) {
        // jquery.tmpl doesn't like it if the template returns just text content or nothing - it only likes you to return DOM nodes.
        // To make things more flexible, we can wrap the whole template in a <script> node so that jquery.tmpl just processes it as
        // text and doesn't try to parse the output. Then, since jquery.tmpl has jQuery as a dependency anyway, we can use jQuery to
        // parse that text into a document fragment using jQuery.clean().        
        var templateTextInWrapper = "<script type=\"text/html\">" + getTemplateNode(template).text + "</script>";
        var renderedMarkupInWrapper = $.tmpl(templateTextInWrapper, data);
        var renderedMarkup = renderedMarkupInWrapper[0].text.replace(aposRegex, "'");
        return jQuery.clean([renderedMarkup], document);
    },

    this.isTemplateRewritten = function (template) {
        return getTemplateNode(template).isRewritten === true;
    },

    this.rewriteTemplate = function (template, rewriterCallback) {
        var templateNode = getTemplateNode(template);
        var rewritten = rewriterCallback(templateNode.text);
        
        // jquery.tmpl falls over if you use single-quotes, so replace these with a temporary marker for template rendering, 
        // and then replace back after the template was rendered. This is slightly complicated by the fact that we must not interfere
        // with any code blocks - only replace apos characters outside code blocks.
        rewritten = ko.utils.stringTrim(rewritten);
        rewritten = rewritten.replace(/([\s\S]*?)(\${[\s\S]*?}|{{[\=a-z][\s\S]*?}}|$)/g, function(match) {
        	// Called for each non-code-block followed by a code block (or end of template)
        	var nonCodeSnippet = arguments[1];
        	var codeSnippet = arguments[2];
        	return nonCodeSnippet.replace(/\'/g, aposMarker) + codeSnippet;
        });        
        
        templateNode.text = rewritten;
        templateNode.isRewritten = true;
    },

    this.createJavaScriptEvaluatorBlock = function (script) {
        return "{{= " + script + "}}";
    },

    // Am considering making template registration a native part of the API (and storing added templates centrally), but for now it's specific to this template engine
    this.addTemplate = function (templateName, templateMarkup) {
        document.write("<script type='text/html' id='" + templateName + "'>" + templateMarkup + "</script>");
    }
};
ko.jqueryTmplTemplateEngine.prototype = new ko.templateEngine();

// Use this one by default
ko.setTemplateEngine(new ko.jqueryTmplTemplateEngine());