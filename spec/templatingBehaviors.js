/// <reference path="../src/templating/templating.js" />

var dummyTemplateEngine = function (templates) {
    templates = templates || [];
    this.renderTemplate = function (template, data, options) {
        options = options || {};
        var result = templates[template];
        if (result && typeof result == "function")
            result = result(data, options);

        result = options.showParams ? result + ", data=" + data + ", options=" + options : result;

        with (data || {}) {
            with (options.templateRenderingVariablesInScope || {}) {
                // Dummy [renderTemplate:...] syntax
                result = result.replace(/\[renderTemplate\:(.*?)\]/g, function (match, templateName) {
                    return ko.renderTemplate(templateName, data, options);
                });

                // Dummy [js:...] syntax
                result = result.replace(/\[js\:(.*?)\]/g, function (match, script) {
                    try {
                        var evalResult = eval(script);
                        return (evalResult === null) || (evalResult === undefined) ? "" : evalResult.toString();
                    } catch (ex) {
                        throw new Error("Error evaluating script: [js: " + script + "]\n\nException: " + ex.toString());
                    }
                });
            }
        }

        if (options.bypassDomNodeWrap)
            return result;
        else {
            var node = document.createElement("div");

            // Annoyingly, IE strips out comment nodes unless they are contained between other nodes, so put some dummy nodes around the HTML, then remove them after parsing.
            node.innerHTML = "<div>a</div>" + result + "<div>a</div>";
            node.removeChild(node.firstChild);
            node.removeChild(node.lastChild);

            return [node];
        }
    };

    this.isTemplateRewritten = function (template) { return typeof templates[template] == "function" /* Can't rewrite functions, so claim they are already rewritten */; },
    this.rewriteTemplate = function (template, rewriterCallback) { templates[template] = rewriterCallback(templates[template]); },
    this.createJavaScriptEvaluatorBlock = function (script) { return "[js:" + script + "]"; }
};
dummyTemplateEngine.prototype = new ko.templateEngine();

describe('Templating', {
    before_each: function () {
        var existingNode = document.getElementById("templatingTarget");
        if (existingNode != null)
            existingNode.parentNode.removeChild(existingNode);
        testNode = document.createElement("div");
        testNode.id = "templatingTarget";
        document.body.appendChild(testNode);
    },

    'Template engines can return an array of DOM nodes': function () {
        ko.setTemplateEngine(new dummyTemplateEngine({ x: [document.createElement("div"), document.createElement("span")] }));
        ko.renderTemplate("x", null, { bypassDomNodeWrap: true });
    },

    'Should not be able to render a template until a template engine is provided': function () {
        var threw = false;
        ko.setTemplateEngine(undefined);
        try { ko.renderTemplate("someTemplate", {}) }
        catch (ex) { threw = true }
        value_of(threw).should_be(true);
    },

    'Should be able to render a template into a given DOM element': function () {
        ko.setTemplateEngine(new dummyTemplateEngine({ someTemplate: "ABC" }));
        ko.renderTemplate("someTemplate", null, null, testNode);
        value_of(testNode.childNodes.length).should_be(1);
        value_of(testNode.childNodes[0].innerHTML).should_be("ABC");
    },

    'Should automatically rerender into DOM element when dependencies change': function () {
        var dependency = new ko.observable("A");
        ko.setTemplateEngine(new dummyTemplateEngine({ someTemplate: function () {
            return "Value = " + dependency();
        }
        }));

        ko.renderTemplate("someTemplate", null, null, testNode);
        value_of(testNode.childNodes.length).should_be(1);
        value_of(testNode.childNodes[0].innerHTML).should_be("Value = A");

        dependency("B");
        value_of(testNode.childNodes.length).should_be(1);
        value_of(testNode.childNodes[0].innerHTML).should_be("Value = B");
    },

    'If the supplied data item is observable, evaluates it and has subscription on it': function () {
        var observable = new ko.observable("A");
        ko.setTemplateEngine(new dummyTemplateEngine({ someTemplate: function (data) {
            return "Value = " + data;
        }
        }));
        ko.renderTemplate("someTemplate", observable, null, testNode);
        value_of(testNode.childNodes[0].innerHTML).should_be("Value = A");

        observable("B");
        value_of(testNode.childNodes[0].innerHTML).should_be("Value = B");
    },

    'Should stop updating DOM nodes if they are removed from the document': function () {
        var dependency = new ko.observable("A");
        ko.setTemplateEngine(new dummyTemplateEngine({ someTemplate: function () {
            return "Value = " + dependency();
        }
        }));

        ko.renderTemplate("someTemplate", null, null, testNode);
        value_of(testNode.childNodes.length).should_be(1);
        value_of(testNode.childNodes[0].innerHTML).should_be("Value = A");

        testNode.parentNode.removeChild(testNode);
        dependency("B");
        value_of(testNode.childNodes.length).should_be(1);
        value_of(testNode.childNodes[0].innerHTML).should_be("Value = A");
    },

    'Should be able to render a template using data-bind syntax': function () {
        ko.setTemplateEngine(new dummyTemplateEngine({ someTemplate: "template output" }));
        testNode.innerHTML = "<div data-bind='template:\"someTemplate\"'></div>";
        ko.applyBindings(testNode);
        value_of(testNode.childNodes[0].innerHTML.toLowerCase()).should_be("<div>template output</div>");
    },

    'Should be able to tell data-bind syntax which object to pass as data for the template (otherwise, uses viewModel)': function () {
        ko.setTemplateEngine(new dummyTemplateEngine({ someTemplate: "result = [js: childProp]" }));
        testNode.innerHTML = "<div data-bind='template: { name: \"someTemplate\", data: someProp }'></div>";
        ko.applyBindings(testNode, { someProp: { childProp: 123} });
        value_of(testNode.childNodes[0].innerHTML.toLowerCase()).should_be("<div>result = 123</div>");
    },

    'Should be able to chain templates, rendering one from inside another': function () {
        ko.setTemplateEngine(new dummyTemplateEngine({
            outerTemplate: "outer template output, [renderTemplate:innerTemplate]", // [renderTemplate:...] is special syntax supported by dummy template engine
            innerTemplate: "inner template output"
        }));
        testNode.innerHTML = "<div data-bind='template:\"outerTemplate\"'></div>";
        ko.applyBindings(testNode);
        value_of(testNode.childNodes[0].innerHTML.toLowerCase().replace("\r\n", "")).should_be("<div>outer template output, <div>inner template output</div></div>");
    },

    'Should rerender chained templates when their dependencies change, without rerendering parent templates': function () {
        var observable = new ko.observable("ABC");
        var timesRenderedOuter = 0, timesRenderedInner = 0;
        ko.setTemplateEngine(new dummyTemplateEngine({
            outerTemplate: function () { timesRenderedOuter++; return "outer template output, [renderTemplate:innerTemplate]" }, // [renderTemplate:...] is special syntax supported by dummy template engine
            innerTemplate: function () { timesRenderedInner++; return observable() }
        }));
        testNode.innerHTML = "<div data-bind='template:\"outerTemplate\"'></div>";
        ko.applyBindings(testNode);
        value_of(testNode.childNodes[0].innerHTML.toLowerCase().replace("\r\n", "")).should_be("<div>outer template output, <div>abc</div></div>");
        value_of(timesRenderedOuter).should_be(1);
        value_of(timesRenderedInner).should_be(1);

        observable("DEF");
        value_of(testNode.childNodes[0].innerHTML.toLowerCase().replace("\r\n", "")).should_be("<div>outer template output, <div>def</div></div>");
        value_of(timesRenderedOuter).should_be(1);
        value_of(timesRenderedInner).should_be(2);
    },

    'Data binding syntax should be able to reference variables put into scope by the template engine': function () {
        ko.setTemplateEngine(new dummyTemplateEngine({ someTemplate: "<input data-bind='value:message' />" }));
        ko.renderTemplate("someTemplate", null, { templateRenderingVariablesInScope: { message: "hello"} }, testNode);
        value_of(testNode.childNodes[0].childNodes[0].value).should_be("hello");
    },

    'Data binding syntax should defer evaluation of variables until the end of template rendering (so bindings can take independent subscriptions to them)': function () {
        ko.setTemplateEngine(new dummyTemplateEngine({
            someTemplate: "<input data-bind='value:message' />[js: message = 'goodbye'; undefined; ]"
        }));
        ko.renderTemplate("someTemplate", null, { templateRenderingVariablesInScope: { message: "hello"} }, testNode);
        value_of(testNode.childNodes[0].childNodes[0].value).should_be("goodbye");
    },

    'Data binding syntax should support \'foreach\' option, whereby it renders for each item in an array but doesn\'t rerender everything if you push or splice': function () {
        var myArray = new ko.observableArray([{ personName: "Bob" }, { personName: "Frank"}]);
        ko.setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "The item is [js: personName]" }));
        testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

        ko.applyBindings(testNode, { myCollection: myArray });
        value_of(testNode.childNodes[0].innerHTML.toLowerCase()).should_be("<div>the item is bob</div><div>the item is frank</div>");
        var originalBobNode = testNode.childNodes[0].childNodes[0];
        var originalFrankNode = testNode.childNodes[0].childNodes[1];

        myArray.push({ personName: "Steve" });
        value_of(testNode.childNodes[0].innerHTML.toLowerCase()).should_be("<div>the item is bob</div><div>the item is frank</div><div>the item is steve</div>");
        value_of(testNode.childNodes[0].childNodes[0]).should_be(originalBobNode);
        value_of(testNode.childNodes[0].childNodes[1]).should_be(originalFrankNode);
    }
})