
var dummyTemplateEngine = function (templates) {   
    var inMemoryTemplates = templates || {};
    var inMemoryTemplateData = {};

    function dummyTemplateSource(id) {
        this.id = id;
    }
    dummyTemplateSource.prototype = {
        text: function(val) {
            if (arguments.length >= 1)
                inMemoryTemplates[this.id] = val;
            return inMemoryTemplates[this.id];            
        },
        data: function(key, val) {
            if (arguments.length >= 2) {
                inMemoryTemplateData[this.id] = inMemoryTemplateData[this.id] || {};
                inMemoryTemplateData[this.id][key] = val;
            }
            return (inMemoryTemplateData[this.id] || {})[key];
        }
    }

    this.makeTemplateSource = function(template) {
        if (typeof template == "string")
            return new dummyTemplateSource(template); // Named template comes from the in-memory collection
        else if ((template.nodeType == 1) || (template.nodeType == 8))
            return new ko.templateSources.anonymousTemplate(template); // Anonymous template
    };

    this.renderTemplateSource = function (templateSource, bindingContext, options) {
        var data = bindingContext['$data'];
        options = options || {};
        var templateText = templateSource.text();
        if (typeof templateText == "function")
            templateText = templateText(data, options);

        templateText = options.showParams ? templateText + ", data=" + data + ", options=" + options : templateText;
        var templateOptions = options.templateOptions; // Have templateOptions in scope to support [js:templateOptions.foo] syntax

        var result;
        with (bindingContext) {
            with (data || {}) {
                with (options.templateRenderingVariablesInScope || {}) {
                    // Dummy [renderTemplate:...] syntax
                    result = templateText.replace(/\[renderTemplate\:(.*?)\]/g, function (match, templateName) {
                        return ko.renderTemplate(templateName, data, options);
                    });

                    
                    var evalHandler = function (match, script) {
                        try {
                            var evalResult = eval(script);
                            return (evalResult === null) || (evalResult === undefined) ? "" : evalResult.toString();
                        } catch (ex) {
                            throw new Error("Error evaluating script: [js: " + script + "]\n\nException: " + ex.toString());
                        }
                    }

                    // Dummy [[js:...]] syntax (in case you need to use square brackets inside the expression)
                    result = result.replace(/\[\[js\:([\s\S]*?)\]\]/g, evalHandler);

                    // Dummy [js:...] syntax
                    result = result.replace(/\[js\:([\s\S]*?)\]/g, evalHandler);
                }
            }
        }

        if (options.bypassDomNodeWrap)
            return ko.utils.parseHtmlFragment(result);
        else {
            var node = document.createElement("div");

            // Annoyingly, IE strips out comment nodes unless they are contained between other nodes, so put some dummy nodes around the HTML, then remove them after parsing.
            node.innerHTML = "<div>a</div>" + result + "<div>a</div>";
            node.removeChild(node.firstChild);
            node.removeChild(node.lastChild);

            return [node];
        }
    };

    this.rewriteTemplate = function (template, rewriterCallback) {
        // Only rewrite if the template isn't a function (can't rewrite those)
        var templateSource = this.makeTemplateSource(template);
        if (typeof templateSource.text() != "function")
            return ko.templateEngine.prototype.rewriteTemplate.call(this, template, rewriterCallback);
    };
    this.createJavaScriptEvaluatorBlock = function (script) { return "[js:" + script + "]"; };
};
dummyTemplateEngine.prototype = new ko.templateEngine();

describe('Templating', {
    before_each: function () {
        ko.setTemplateEngine(new ko.nativeTemplateEngine());
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

    'Should be able to access newly rendered/inserted elements in \'afterRender\' callaback': function () {
        var passedElement, passedDataItem;
        var myCallback = function(elementsArray, dataItem) { 
            value_of(elementsArray.length).should_be(1);
            passedElement = elementsArray[0]; 
            passedDataItem = dataItem;     		
        }
        var myModel = {};
        ko.setTemplateEngine(new dummyTemplateEngine({ someTemplate: "ABC" }));
        ko.renderTemplate("someTemplate", myModel, { afterRender: myCallback }, testNode);
        value_of(passedElement.innerHTML).should_be("ABC");
        value_of(passedDataItem).should_be(myModel);
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

    'Should stop updating DOM nodes when the dependency next changes if the DOM node has been removed from the document': function () {
        var dependency = new ko.observable("A");
        var template = { someTemplate: function () { return "Value = " + dependency() } };
        ko.setTemplateEngine(new dummyTemplateEngine(template));

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
        ko.applyBindings(null, testNode);
        value_of(testNode.childNodes[0]).should_contain_html("<div>template output</div>");
    },

    'Should be able to tell data-bind syntax which object to pass as data for the template (otherwise, uses viewModel)': function () {
        ko.setTemplateEngine(new dummyTemplateEngine({ someTemplate: "result = [js: childProp]" }));
        testNode.innerHTML = "<div data-bind='template: { name: \"someTemplate\", data: someProp }'></div>";
        ko.applyBindings({ someProp: { childProp: 123} }, testNode);
        value_of(testNode.childNodes[0]).should_contain_html("<div>result = 123</div>");
    },

    'Should stop tracking inner observables immediately when the container node is removed from the document': function() {
        var innerObservable = ko.observable("some value");
        ko.setTemplateEngine(new dummyTemplateEngine({ someTemplate: "result = [js: childProp()]" }));
        testNode.innerHTML = "<div data-bind='template: { name: \"someTemplate\", data: someProp }'></div>";
        ko.applyBindings({ someProp: { childProp: innerObservable} }, testNode);
        
        value_of(innerObservable.getSubscriptionsCount()).should_be(1);
        ko.removeNode(testNode.childNodes[0]);
        value_of(innerObservable.getSubscriptionsCount()).should_be(0);
    },

    'Should be able to pick template as a function of the data item using data-bind syntax': function () {
        var templatePicker = function(dataItem) {
            return dataItem.myTemplate;	
        };
        ko.setTemplateEngine(new dummyTemplateEngine({ someTemplate: "result = [js: childProp]" }));
        testNode.innerHTML = "<div data-bind='template: { name: templateSelectorFunction, data: someProp }'></div>";
        ko.applyBindings({ someProp: { childProp: 123, myTemplate: "someTemplate" }, templateSelectorFunction: templatePicker }, testNode);
        value_of(testNode.childNodes[0]).should_contain_html("<div>result = 123</div>");
    },

    'Should be able to chain templates, rendering one from inside another': function () {
        ko.setTemplateEngine(new dummyTemplateEngine({
            outerTemplate: "outer template output, [renderTemplate:innerTemplate]", // [renderTemplate:...] is special syntax supported by dummy template engine
            innerTemplate: "inner template output <span data-bind='text: 123'></span>"
        }));
        testNode.innerHTML = "<div data-bind='template:\"outerTemplate\"'></div>";
        ko.applyBindings(null, testNode);
        value_of(testNode.childNodes[0]).should_contain_html("<div>outer template output, <div>inner template output <span>123</span></div></div>");
    },

    'Should rerender chained templates when their dependencies change, without rerendering parent templates': function () {
        var observable = new ko.observable("ABC");
        var timesRenderedOuter = 0, timesRenderedInner = 0;
        ko.setTemplateEngine(new dummyTemplateEngine({
            outerTemplate: function () { timesRenderedOuter++; return "outer template output, [renderTemplate:innerTemplate]" }, // [renderTemplate:...] is special syntax supported by dummy template engine
            innerTemplate: function () { timesRenderedInner++; return observable() }
        }));
        testNode.innerHTML = "<div data-bind='template:\"outerTemplate\"'></div>";
        ko.applyBindings(null, testNode);
        value_of(testNode.childNodes[0]).should_contain_html("<div>outer template output, <div>abc</div></div>");
        value_of(timesRenderedOuter).should_be(1);
        value_of(timesRenderedInner).should_be(1);

        observable("DEF");
        value_of(testNode.childNodes[0]).should_contain_html("<div>outer template output, <div>def</div></div>");
        value_of(timesRenderedOuter).should_be(1);
        value_of(timesRenderedInner).should_be(2);
    },
    
    'Should stop tracking inner observables referenced by a chained template as soon as the chained template output node is removed from the document': function() {
        var innerObservable = ko.observable("some value");
        ko.setTemplateEngine(new dummyTemplateEngine({
            outerTemplate: "outer template output, <span id='innerTemplateOutput'>[renderTemplate:innerTemplate]</span>",
            innerTemplate: "result = [js: childProp()]"
        }));
        testNode.innerHTML = "<div data-bind='template: { name: \"outerTemplate\", data: someProp }'></div>";
        ko.applyBindings({ someProp: { childProp: innerObservable} }, testNode);
        
        value_of(innerObservable.getSubscriptionsCount()).should_be(1);
        ko.removeNode(document.getElementById('innerTemplateOutput'));
        value_of(innerObservable.getSubscriptionsCount()).should_be(0);
    },

    'Should handle data-bind attributes from inside templates, regardless of element and attribute casing': function () {
        ko.setTemplateEngine(new dummyTemplateEngine({ someTemplate: "<INPUT Data-Bind='value:\"Hi\"' />" }));
        ko.renderTemplate("someTemplate", null, null, testNode);
        value_of(testNode.childNodes[0].childNodes[0].value).should_be("Hi");
    },
    
    'Should handle data-bind attributes that include newlines from inside templates': function () {
        ko.setTemplateEngine(new dummyTemplateEngine({ someTemplate: "<input data-bind='value:\n\"Hi\"' />" }));
        ko.renderTemplate("someTemplate", null, null, testNode);
        value_of(testNode.childNodes[0].childNodes[0].value).should_be("Hi");
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
    
    'Data binding syntax should use the template\'s \'data\' object as the viewModel value (so \'this\' is set correctly when calling click handlers etc.)': function() {
        ko.setTemplateEngine(new dummyTemplateEngine({
            someTemplate: "<button data-bind='click: someFunctionOnModel'>click me</button>"
        }));
        var viewModel = {
            didCallMyFunction : false,
            someFunctionOnModel : function() { this.didCallMyFunction = true }
        };
        ko.renderTemplate("someTemplate", viewModel, null, testNode);
        var buttonNode = testNode.childNodes[0].childNodes[0];
        value_of(buttonNode.tagName).should_be("BUTTON"); // Be sure we're clicking the right thing
        buttonNode.click();
        value_of(viewModel.didCallMyFunction).should_be(true);
    },

    'Data binding syntax should permit nested templates, and only bind inner templates once': function() {
        // Will verify that bindings are applied only once for both inline (rewritten) bindings,
        // and external (non-rewritten) ones
        var originalBindingProvider = ko.bindingProvider.instance;
        ko.bindingProvider.instance = {
            nodeHasBindings: function(node, bindingContext) {
                return (node.tagName == 'EM') || originalBindingProvider.nodeHasBindings(node, bindingContext);
            },
            getBindings: function(node, bindingContext) {
                if (node.tagName == 'EM')
                    return { text: ++model.numBindings };
                return originalBindingProvider.getBindings(node, bindingContext);
            }
        };

        ko.setTemplateEngine(new dummyTemplateEngine({ 
            outerTemplate: "Outer <div data-bind='template: { name: \"innerTemplate\", bypassDomNodeWrap: true }'></div>", 
            innerTemplate: "Inner via inline binding: <span data-bind='text: ++numBindings'></span>"
                         + "Inner via external binding: <em></em>"
        }));
        var model = { numBindings: 0 };
        testNode.innerHTML = "<div data-bind='template: { name: \"outerTemplate\", bypassDomNodeWrap: true }'></div>";
        ko.applyBindings(model, testNode);
        value_of(model.numBindings).should_be(2);
        value_of(testNode.childNodes[0]).should_contain_html("outer <div>inner via inline binding: <span>2</span>inner via external binding: <em>1</em></div>");
        
        ko.bindingProvider.instance = originalBindingProvider;      
    },

    'Data binding syntax should support \'foreach\' option, whereby it renders for each item in an array but doesn\'t rerender everything if you push or splice': function () {
        var myArray = new ko.observableArray([{ personName: "Bob" }, { personName: "Frank"}]);
        ko.setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "The item is [js: personName]" }));
        testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

        ko.applyBindings({ myCollection: myArray }, testNode);
        value_of(testNode.childNodes[0]).should_contain_html("<div>the item is bob</div><div>the item is frank</div>");
        var originalBobNode = testNode.childNodes[0].childNodes[0];
        var originalFrankNode = testNode.childNodes[0].childNodes[1];

        myArray.push({ personName: "Steve" });
        value_of(testNode.childNodes[0]).should_contain_html("<div>the item is bob</div><div>the item is frank</div><div>the item is steve</div>");
        value_of(testNode.childNodes[0].childNodes[0]).should_be(originalBobNode);
        value_of(testNode.childNodes[0].childNodes[1]).should_be(originalFrankNode);
    },

    'Data binding \'foreach\' option should apply bindings within the context of each item in the array': function () {
        var myArray = new ko.observableArray([{ personName: "Bob" }, { personName: "Frank"}]);
        ko.setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "The item is <span data-bind='text: personName'></span>" }));
        testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

        ko.applyBindings({ myCollection: myArray }, testNode);
        value_of(testNode.childNodes[0]).should_contain_html("<div>the item is <span>bob</span></div><div>the item is <span>frank</span></div>");
    },

    'Data binding \'foreach\' options should only bind each group of output nodes once': function() {
        var initCalls = 0;
        ko.bindingHandlers.countInits = { init: function() { initCalls++ } };
        ko.setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "<span data-bind='countInits: true'></span>" }));
        testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

        ko.applyBindings({ myCollection: [1,2,3] }, testNode);
        value_of(initCalls).should_be(3); // 3 because there were 3 items in myCollection
    },

    'Data binding \'foreach\' option should apply bindings with an $index in the context': function () {
        var myArray = new ko.observableArray([{ personName: "Bob" }, { personName: "Frank"}]);
        ko.setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "The item # is <span data-bind='text: $index'></span>" }));
        testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

        ko.applyBindings({ myCollection: myArray }, testNode);
        value_of(testNode.childNodes[0]).should_contain_html("<div>the item # is <span>0</span></div><div>the item # is <span>1</span></div>");
    },

    'Data binding \'foreach\' option should update bindings that reference an $index if the list changes': function () {
        var myArray = new ko.observableArray([{ personName: "Bob" }, { personName: "Frank"}]);
        ko.setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "The item <span data-bind='text: personName'></span>is <span data-bind='text: $index'></span>" }));
        testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

        ko.applyBindings({ myCollection: myArray }, testNode);
        value_of(testNode.childNodes[0]).should_contain_html("<div>the item <span>bob</span>is <span>0</span></div><div>the item <span>frank</span>is <span>1</span></div>");

        var frank = myArray.pop(); // remove frank
        value_of(testNode.childNodes[0]).should_contain_html("<div>the item <span>bob</span>is <span>0</span></div>");

        myArray.unshift(frank); // put frank in the front
        value_of(testNode.childNodes[0]).should_contain_html("<div>the item <span>frank</span>is <span>0</span></div><div>the item <span>bob</span>is <span>1</span></div>");

    },
    
    'Data binding \'foreach\' option should accept array with "undefined" and "null" items': function () {
        var myArray = new ko.observableArray([undefined, null]);
        ko.setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "The item is <span data-bind='text: String($data)'></span>" }));
        testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

        ko.applyBindings({ myCollection: myArray }, testNode);
        value_of(testNode.childNodes[0]).should_contain_html("<div>the item is <span>undefined</span></div><div>the item is <span>null</span></div>");
    },
    
    'Data binding \'foreach\' option should update DOM nodes when a dependency of their mapping function changes': function() {
        var myObservable = new ko.observable("Steve");
        var myArray = new ko.observableArray([{ personName: "Bob" }, { personName: myObservable }, { personName: "Another" }]);
        ko.setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "The item is [js: ko.utils.unwrapObservable(personName)]" }));
        testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

        ko.applyBindings({ myCollection: myArray }, testNode);
        value_of(testNode.childNodes[0]).should_contain_html("<div>the item is bob</div><div>the item is steve</div><div>the item is another</div>");
        var originalBobNode = testNode.childNodes[0].childNodes[0];
        
        myObservable("Steve2");
        value_of(testNode.childNodes[0]).should_contain_html("<div>the item is bob</div><div>the item is steve2</div><div>the item is another</div>");
        value_of(testNode.childNodes[0].childNodes[0]).should_be(originalBobNode);
        
        // Ensure we can still remove the corresponding nodes (even though they've changed), and that doing so causes the subscription to be disposed
        value_of(myObservable.getSubscriptionsCount()).should_be(1);
        myArray.splice(1, 1);
        value_of(testNode.childNodes[0]).should_contain_html("<div>the item is bob</div><div>the item is another</div>");
        myObservable("Something else"); // Re-evaluating the observable causes the orphaned subscriptions to be disposed
        value_of(myObservable.getSubscriptionsCount()).should_be(0);
    },
    
    'Data binding \'foreach\' option should treat a null parameter as meaning \'no items\'': function() {
        var myArray = new ko.observableArray(["A", "B"]);
        ko.setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "hello" }));
        testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

        ko.applyBindings({ myCollection: myArray }, testNode);    	
        value_of(testNode.childNodes[0].childNodes.length).should_be(2);
        
        // Now set the observable to null and check it's treated like an empty array
        // (because how else should null be interpreted?)
        myArray(null);
        value_of(testNode.childNodes[0].childNodes.length).should_be(0);
    },
    
    'Data binding \'foreach\' option should stop tracking inner observables when the container node is removed': function() {
        var innerObservable = ko.observable("some value");
        var myArray = new ko.observableArray([{obsVal:innerObservable}, {obsVal:innerObservable}]);
        ko.setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "The item is [js: ko.utils.unwrapObservable(obsVal)]" }));
        testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

        ko.applyBindings({ myCollection: myArray }, testNode);
        value_of(innerObservable.getSubscriptionsCount()).should_be(2);    	
        
        ko.removeNode(testNode.childNodes[0]);
        value_of(innerObservable.getSubscriptionsCount()).should_be(0);    	
    },
    
    'Data binding \'foreach\' option should stop tracking inner observables related to each array item when that array item is removed': function() {
        var innerObservable = ko.observable("some value");
        var myArray = new ko.observableArray([{obsVal:innerObservable}, {obsVal:innerObservable}]);
        ko.setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "The item is [js: ko.utils.unwrapObservable(obsVal)]" }));
        testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

        ko.applyBindings({ myCollection: myArray }, testNode);
        value_of(innerObservable.getSubscriptionsCount()).should_be(2);    	
        
        myArray.splice(1, 1);
        value_of(innerObservable.getSubscriptionsCount()).should_be(1);    	
        myArray([]);
        value_of(innerObservable.getSubscriptionsCount()).should_be(0);    	
    },    
    
    'Data binding syntax should omit any items whose \'_destroy\' flag is set (unwrapping the flag if it is observable)' : function() {
        var myArray = new ko.observableArray([{ someProp: 1 }, { someProp: 2, _destroy: 'evals to true' }, { someProp : 3 }, { someProp: 4, _destroy: ko.observable(false) }]);
        ko.setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "someProp=[js: someProp]" }));
        testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection }'></div>";

        ko.applyBindings({ myCollection: myArray }, testNode);    	
        value_of(testNode.childNodes[0]).should_contain_html("<div>someprop=1</div><div>someprop=3</div><div>someprop=4</div>");
    },
    
    'Data binding syntax should include any items whose \'_destroy\' flag is set if you use includeDestroyed' : function() {
        var myArray = new ko.observableArray([{ someProp: 1 }, { someProp: 2, _destroy: 'evals to true' }, { someProp : 3 }]);
        ko.setTemplateEngine(new dummyTemplateEngine({ itemTemplate: "someProp=[js: someProp]" }));
        testNode.innerHTML = "<div data-bind='template: { name: \"itemTemplate\", foreach: myCollection, includeDestroyed: true }'></div>";

        ko.applyBindings({ myCollection: myArray }, testNode);    	
        value_of(testNode.childNodes[0]).should_contain_html("<div>someprop=1</div><div>someprop=2</div><div>someprop=3</div>");
    },
    
    'Data binding syntax should support \"if\" condition' : function() {
        ko.setTemplateEngine(new dummyTemplateEngine({ myTemplate: "Value: [js: myProp().childProp]" }));        
        testNode.innerHTML = "<div data-bind='template: { name: \"myTemplate\", \"if\": myProp }'></div>";
        
        var viewModel = { myProp: ko.observable({ childProp: 'abc' }) };
        ko.applyBindings(viewModel, testNode);
        
        // Initially there is a value
        value_of(testNode.childNodes[0]).should_contain_text("Value: abc");
        
        // Causing the condition to become false causes the output to be removed
        viewModel.myProp(null);
        value_of(testNode.childNodes[0]).should_contain_text("");
        
        // Causing the condition to become true causes the output to reappear
        viewModel.myProp({ childProp: 'def' });
        value_of(testNode.childNodes[0]).should_contain_text("Value: def");
    },
    
    'Data binding syntax should support \"ifnot\" condition' : function() {
        ko.setTemplateEngine(new dummyTemplateEngine({ myTemplate: "Hello" }));        
        testNode.innerHTML = "<div data-bind='template: { name: \"myTemplate\", ifnot: shouldHide }'></div>";
        
        var viewModel = { shouldHide: ko.observable(true) };
        ko.applyBindings(viewModel, testNode);
        
        // Initially there is no output (shouldHide=true)
        value_of(testNode.childNodes[0]).should_contain_text("");
        
        // Causing the condition to become false causes the output to be displayed
        viewModel.shouldHide(false);
        value_of(testNode.childNodes[0]).should_contain_text("Hello");
        
        // Causing the condition to become true causes the output to disappear
        viewModel.shouldHide(true);
        value_of(testNode.childNodes[0]).should_contain_text("");
    },    
    
    'Data binding syntax should support \"if\" condition in conjunction with foreach': function() {
        ko.setTemplateEngine(new dummyTemplateEngine({ myTemplate: "Value: [js: myProp().childProp]" }));        
        testNode.innerHTML = "<div data-bind='template: { name: \"myTemplate\", \"if\": myProp, foreach: [$data, $data, $data] }'></div>";
        
        var viewModel = { myProp: ko.observable({ childProp: 'abc' }) };
        ko.applyBindings(viewModel, testNode);
        value_of(testNode.childNodes[0].childNodes[0]).should_contain_text("Value: abc");
        value_of(testNode.childNodes[0].childNodes[1]).should_contain_text("Value: abc");
        value_of(testNode.childNodes[0].childNodes[2]).should_contain_text("Value: abc");
        
        // Causing the condition to become false causes the output to be removed
        viewModel.myProp(null);
        value_of(testNode.childNodes[0]).should_contain_text("");
        
        // Causing the condition to become true causes the output to reappear
        viewModel.myProp({ childProp: 'def' });
        value_of(testNode.childNodes[0].childNodes[0]).should_contain_text("Value: def");
        value_of(testNode.childNodes[0].childNodes[1]).should_contain_text("Value: def");
        value_of(testNode.childNodes[0].childNodes[2]).should_contain_text("Value: def");
    },
    
    'Should be able to populate checkboxes from inside templates, despite IE6 limitations': function () {    	
        ko.setTemplateEngine(new dummyTemplateEngine({ someTemplate: "<input type='checkbox' data-bind='checked:isChecked' />" }));
        ko.renderTemplate("someTemplate", null, { templateRenderingVariablesInScope: { isChecked: true } }, testNode);
        value_of(testNode.childNodes[0].childNodes[0].checked).should_be(true);
    },
    
    'Should be able to populate radio buttons from inside templates, despite IE6 limitations': function () {    	
        ko.setTemplateEngine(new dummyTemplateEngine({ someTemplate: "<input type='radio' name='somename' value='abc' data-bind='checked:someValue' />" }));
        ko.renderTemplate("someTemplate", null, { templateRenderingVariablesInScope: { someValue: 'abc' } }, testNode);
        value_of(testNode.childNodes[0].childNodes[0].checked).should_be(true);
    },
    
    'Should be able to render a different template for each array entry by passing a function as template name': function() {
        var myArray = new ko.observableArray([
            { preferredTemplate: 1, someProperty: 'firstItemValue' }, 
            { preferredTemplate: 2, someProperty: 'secondItemValue' }
        ]);
        ko.setTemplateEngine(new dummyTemplateEngine({
            firstTemplate: "Template1Output, [js:someProperty]", 
            secondTemplate: "Template2Output, [js:someProperty]"
        }));
        testNode.innerHTML = "<div data-bind='template: {name: getTemplateModelProperty, foreach: myCollection}'></div>";
        
        var getTemplate = function(dataItem) {
            return dataItem.preferredTemplate == 1 ? 'firstTemplate' : 'secondTemplate';
        };
        ko.applyBindings({ myCollection: myArray, getTemplateModelProperty: getTemplate }, testNode);
        value_of(testNode.childNodes[0]).should_contain_html("<div>template1output, firstitemvalue</div><div>template2output, seconditemvalue</div>");
    },
    
    'Data binding \'templateOptions\' should be passed to template': function() {
        var myModel = { 
            someAdditionalData: { myAdditionalProp: "someAdditionalValue" },
            people: new ko.observableArray([
                { name: "Alpha" }, 
                { name: "Beta" }
            ])
        };
        ko.setTemplateEngine(new dummyTemplateEngine({myTemplate: "Person [js:name] has additional property [js:templateOptions.myAdditionalProp]"}));
        testNode.innerHTML = "<div data-bind='template: {name: \"myTemplate\", foreach: people, templateOptions: someAdditionalData }'></div>";

        ko.applyBindings(myModel, testNode);
        value_of(testNode.childNodes[0]).should_contain_html("<div>person alpha has additional property someadditionalvalue</div><div>person beta has additional property someadditionalvalue</div>");
    },
    
    'If the template binding is updated, should dispose any template subscriptions previously associated with the element': function() {
        var myModel = { 
            myObservable: ko.observable("some value"),
            unrelatedObservable: ko.observable()
        };
        ko.setTemplateEngine(new dummyTemplateEngine({myTemplate: "The value is [js:myObservable()]"}));
        testNode.innerHTML = "<div data-bind='template: \"myTemplate\", unrelatedBindingHandler: unrelatedObservable()'></div>";
        ko.applyBindings(myModel, testNode);
        
        // Right now the template references myObservable, so there should be exactly one subscription on it
        value_of(testNode.childNodes[0]).should_contain_html("<div>the value is some value</div>");
        value_of(myModel.myObservable.getSubscriptionsCount()).should_be(1);
        
        // By changing unrelatedObservable, we force the data-bind value to be re-evaluated, setting up a new template subscription,
        // so there have now existed two subscriptions on myObservable...
        myModel.unrelatedObservable("any value");
        
        // ...but, because the old subscription should have been disposed automatically, there should only be one left
        value_of(myModel.myObservable.getSubscriptionsCount()).should_be(1);
    },
    
    'Should be able to specify a template engine instance using data-bind syntax': function() {
        ko.setTemplateEngine(new dummyTemplateEngine({ theTemplate: "Default output" })); // Not going to use this one
        var alternativeTemplateEngine = new dummyTemplateEngine({ theTemplate: "Alternative output" });
        
        testNode.innerHTML = "<div data-bind='template: { name: \"theTemplate\", templateEngine: chosenEngine }'></div>";
        ko.applyBindings({ chosenEngine: alternativeTemplateEngine }, testNode);
        
        value_of(testNode.childNodes[0]).should_contain_text("Alternative output");
    },

    'Data-bind syntax should expose parent binding context as $parent if binding with an explicit \"data\" value': function() {
        ko.setTemplateEngine(new dummyTemplateEngine({
            myTemplate: "ValueLiteral: [js:$parent.parentProp], ValueBound: <span data-bind='text: $parent.parentProp'></span>"
        }));
        testNode.innerHTML = "<div data-bind='template: { name: \"myTemplate\", data: someItem }'></div>";
        ko.applyBindings({ someItem: {}, parentProp: 'Hello' }, testNode);
        value_of(testNode.childNodes[0]).should_contain_text("ValueLiteral: Hello, ValueBound: Hello");
    },

    'Data-bind syntax should expose all ancestor binding contexts as $parents': function() {
        ko.setTemplateEngine(new dummyTemplateEngine({
            outerTemplate:  "<div data-bind='template: { name:\"middleTemplate\", data: middleItem }'></div>",
            middleTemplate: "<div data-bind='template: { name: \"innerTemplate\", data: innerItem }'></div>",
            innerTemplate:  "(Data:[js:$data.val], Parent:[[js:$parents[0].val]], Grandparent:[[js:$parents[1].val]], Root:[js:$root.val], Depth:[js:$parents.length])"
        }));
        testNode.innerHTML = "<div data-bind='template: { name: \"outerTemplate\", data: outerItem }'></div>";   
                           
        ko.applyBindings({
            val: "ROOT",
            outerItem: {
                val: "OUTER",
                middleItem: {
                    val: "MIDDLE",
                    innerItem: { val: "INNER" }
                }
            }
        }, testNode);
        value_of(testNode.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0]).should_contain_text("(Data:INNER, Parent:MIDDLE, Grandparent:OUTER, Root:ROOT, Depth:3)");
    },
    
    'Should not be allowed to rewrite templates that embed anonymous templates': function() {
        // The reason is that your template engine's native control flow and variable evaluation logic is going to run first, independently
        // of any KO-native control flow, so variables would get evaluated in the wrong context. Example:
        //
        // <div data-bind="foreach: someArray">
        //     ${ somePropertyOfEachArrayItem }   <-- This gets evaluated *before* the foreach binds, so it can't reference array entries
        // </div>
        //
        // It should be perfectly OK to fix this just by preventing anonymous templates within rewritten templates, because
        // (1) The developer can always use their template engine's native control flow syntax instead of the KO-native ones - that will work
        // (2) The developer can use KO's native templating instead, if they are keen on KO-native control flow or anonymous templates

        ko.setTemplateEngine(new dummyTemplateEngine({
            myTemplate: "<div data-bind='template: { data: someData }'>Childprop: [js: childProp]</div>"
        }));        
        testNode.innerHTML = "<div data-bind='template: { name: \"myTemplate\" }'></div>";   

        var didThrow = false;
        try {
            ko.applyBindings({ someData: { childProp: 'abc' } }, testNode);
        } catch(ex) {
            didThrow = true;
            value_of(ex.message).should_be("This template engine does not support anonymous templates nested within its templates");
        }
        value_of(didThrow).should_be(true);
    },

    'Should not be allowed to rewrite templates that embed control flow bindings': function() {
        // Same reason as above
        ko.utils.arrayForEach(['if', 'ifnot', 'with', 'foreach'], function(bindingName) {
            ko.setTemplateEngine(new dummyTemplateEngine({ myTemplate: "<div data-bind='" + bindingName + ": \"SomeValue\"'>Hello</div>" }));
            testNode.innerHTML = "<div data-bind='template: { name: \"myTemplate\" }'></div>";   

            var didThrow = false;
            try { ko.applyBindings({ someData: { childProp: 'abc' } }, testNode) } 
            catch (ex) {
                didThrow = true;
                value_of(ex.message).should_be("This template engine does not support the '" + bindingName + "' binding within its templates");
            }
            if (!didThrow)
                throw new Error("Did not prevent use of " + bindingName);            
        });
    },
    
    'Should be able to render anonymous templates using virtual containers': function() {
        ko.setTemplateEngine(new dummyTemplateEngine());    
        testNode.innerHTML = "Start <!-- ko template: { data: someData } -->Childprop: [js: childProp]<!-- /ko --> End";
        ko.applyBindings({ someData: { childProp: 'abc' } }, testNode);
        value_of(testNode).should_contain_html("start <!-- ko template: { data: somedata } --><div>childprop: abc</div><!-- /ko -->end");
    },

    'Should be able to use anonymous templates that contain first-child comment nodes': function() {
        // This represents issue https://github.com/SteveSanderson/knockout/issues/188
        // (IE < 9 strips out leading comment nodes when you use .innerHTML)   
        ko.setTemplateEngine(new dummyTemplateEngine({}));
        testNode.innerHTML = "start <div data-bind='foreach: [1,2]'><span><!-- leading comment -->hello</span></div>";
        ko.applyBindings(null, testNode);
        value_of(testNode).should_contain_html('start <div data-bind="foreach: [1,2]"><span><!-- leading comment -->hello</span><span><!-- leading comment -->hello</span></div>');
    },

    'Should allow anonymous templates output to include top-level virtual elements, and will bind their virtual children only once': function() {
        delete ko.bindingHandlers.nonexistentHandler;
        var initCalls = 0;
        ko.bindingHandlers.countInits = { init: function () { initCalls++ } };
        testNode.innerHTML = "<div data-bind='template: {}'><!-- ko nonexistentHandler: true --><span data-bind='countInits: true'></span><!-- /ko --></div>";
        ko.applyBindings(null, testNode);
        value_of(initCalls).should_be(1);
    }
})