/// <reference path="../templating.js" />

ko.jqueryTmplTemplateEngine = function () {
    function getTemplateNode(template) {
        var templateNode = document.getElementById(template);
        if (templateNode == null)
            throw new Error("Cannot find template with ID=" + template);
        return templateNode;
    }

    this.renderTemplate = function (template, data, options) {
        // jquery.tmpl doesn't like it if the template returns just text content or nothing - it only likes you to return DOM nodes.
        // To make things more flexible, we can wrap the whole template in a <script> node so that jquery.tmpl just processes it as
        // text and doesn't try to parse the output. Then, since jquery.tmpl has jQuery as a dependency anyway, we can use jQuery to
        // parse that text into a document fragment using jQuery.clean().
        var templateTextInWrapper = "<script type=\"text/html\">" + getTemplateNode(template).text + "</script>";
        var renderedMarkupInWrapper = $.tmpl(templateTextInWrapper, data);
        return jQuery.clean([renderedMarkupInWrapper[0].text], document);
    },

    this.isTemplateRewritten = function (template) {
        return getTemplateNode(template).isRewritten === true;
    },

    this.rewriteTemplate = function (template, rewriterCallback) {
        var templateNode = getTemplateNode(template);
        var rewritten = rewriterCallback(templateNode.text)
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