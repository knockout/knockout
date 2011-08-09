describe('Native template engine', {
    before_each: function () {
        ko.setTemplateEngine(new ko.nativeTemplateEngine());
        
        function ensureNodeExistsAndIsEmpty(id, tagName) {
            var existingNode = document.getElementById(id);
            if (existingNode != null)
                existingNode.parentNode.removeChild(existingNode);
            var resultNode = document.createElement(tagName || "div");
            resultNode.id = id;
            resultNode.setAttribute("type", "text/html");
            document.body.appendChild(resultNode);  
            return resultNode;  		
        }
        
        this.testDivTemplate = ensureNodeExistsAndIsEmpty("testDivTemplate");
        this.testScriptTemplate = ensureNodeExistsAndIsEmpty("testScriptTemplate", "script");        
        this.templateOutput = ensureNodeExistsAndIsEmpty("templateOutput");
    },

    'Named template can display static content from regular DOM element': function () {
        testDivTemplate.innerHTML = "this is some static content";
        ko.renderTemplate("testDivTemplate", null, null, templateOutput);
        value_of(templateOutput).should_contain_html("this is some static content");
    },
    
    'Named template can fetch template from regular DOM element and data-bind on results': function () {
        testDivTemplate.innerHTML = "name: <div data-bind='text: name'></div>";
        ko.renderTemplate("testDivTemplate", { name: 'bert' }, null, templateOutput);
        value_of(templateOutput).should_contain_html("name: <div data-bind=\"text: name\">bert</div>");
    },
    
    'Named template can fetch template from <script> elements and data-bind on results': function () {
        testScriptTemplate.text = "name: <div data-bind='text: name'></div>";
        ko.renderTemplate("testScriptTemplate", { name: 'bert' }, null, templateOutput);
        value_of(templateOutput).should_contain_html("name: <div data-bind=\"text: name\">bert</div>");
    }, 
    
    'Anonymous template can display static content': function () {
        new ko.templateSources.anonymousTemplate(templateOutput).text("this is some static content");
        templateOutput.innerHTML = "irrelevant initial content";
        ko.renderTemplate(templateOutput, null, null, templateOutput);
        value_of(templateOutput).should_contain_html("this is some static content");
    },
    
    'Anonymous template can data-bind on results': function () {
        new ko.templateSources.anonymousTemplate(templateOutput).text("name: <div data-bind='text: name'></div>");
        templateOutput.innerHTML = "irrelevant initial content";
        ko.renderTemplate(templateOutput, { name: 'bert' }, null, templateOutput);
        value_of(templateOutput).should_contain_html("name: <div data-bind=\"text: name\">bert</div>");
    }    
});