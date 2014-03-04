describe('Native template engine', function() {
    beforeEach(function() {
        ko.setTemplateEngine(new ko.nativeTemplateEngine());

        function ensureNodeExistsAndIsEmpty(id, tagName, type) {
            var existingNode = document.getElementById(id);
            if (existingNode != null)
                existingNode.parentNode.removeChild(existingNode);
            var resultNode = document.createElement(tagName || "div");
            resultNode.id = id;
            if (type)
                resultNode.setAttribute("type", type);
            document.body.appendChild(resultNode);
            return resultNode;
        }

        window.testDivTemplate = ensureNodeExistsAndIsEmpty("testDivTemplate");
        window.testScriptTemplate = ensureNodeExistsAndIsEmpty("testScriptTemplate", "script", "text/html");
        window.testTextAreaTemplate = ensureNodeExistsAndIsEmpty("testTextAreaTemplate", "textarea");
        window.templateOutput = ensureNodeExistsAndIsEmpty("templateOutput");
    });

    describe('Named templates', function () {
        it('can display static content from regular DOM element', function () {
            window.testDivTemplate.innerHTML = "this is some static content";
            ko.renderTemplate("testDivTemplate", null, null, window.templateOutput);
            expect(window.templateOutput).toContainHtml("this is some static content");
        });

        it('can fetch template from regular DOM element and data-bind on results', function () {
            window.testDivTemplate.innerHTML = "name: <div data-bind='text: name'></div>";
            ko.renderTemplate("testDivTemplate", { name: 'bert' }, null, window.templateOutput);
            expect(window.templateOutput).toContainHtml("name: <div data-bind=\"text: name\">bert</div>");
        });

        it('can fetch template from <script> elements and data-bind on results', function () {
            window.testScriptTemplate.text = "name: <div data-bind='text: name'></div>";
            ko.renderTemplate("testScriptTemplate", { name: 'bert' }, null, window.templateOutput);
            expect(window.templateOutput).toContainHtml("name: <div data-bind=\"text: name\">bert</div>");
        });

        it('can fetch template from <textarea> elements and data-bind on results', function () {
            var prop = (typeof window.testTextAreaTemplate.innerText !== "undefined") ? "innerText" : "textContent";
            window.testTextAreaTemplate[prop] = "name: <div data-bind='text: name'></div>";
            ko.renderTemplate("testTextAreaTemplate", { name: 'bert' }, null, window.templateOutput);
            expect(window.templateOutput).toContainHtml("name: <div data-bind=\"text: name\">bert</div>");
        });
    });

    describe('Anonymous templates', function () {
        it('can display static content', function () {
            new ko.templateSources.anonymousTemplate(window.templateOutput).text("this is some static content");
            window.templateOutput.innerHTML = "irrelevant initial content";
            ko.renderTemplate(window.templateOutput, null, null, window.templateOutput);
            expect(window.templateOutput).toContainHtml("this is some static content");
        });

        it('can data-bind on results', function () {
            new ko.templateSources.anonymousTemplate(window.templateOutput).text("name: <div data-bind='text: name'></div>");
            window.templateOutput.innerHTML = "irrelevant initial content";
            ko.renderTemplate(window.templateOutput, { name: 'bert' }, null, window.templateOutput);
            expect(window.templateOutput).toContainHtml("name: <div data-bind=\"text: name\">bert</div>");
        });

        it('can be supplied by not giving a template name', function() {
            window.testDivTemplate.innerHTML = "<div data-bind='template: { data: someItem }'>Value: <span data-bind='text: val'></span></div>"

            var viewModel = {
                someItem: { val: 'abc' }
            };
            ko.applyBindings(viewModel, window.testDivTemplate);

            expect(window.testDivTemplate.childNodes[0]).toContainText("Value: abc");
        });

        it('work in conjunction with foreach', function() {
            window.testDivTemplate.innerHTML = "<div data-bind='template: { foreach: myItems }'><b>Item: <span data-bind='text: itemProp'></span></b></div>";
            var myItems = ko.observableArray([{ itemProp: 'Alpha' }, { itemProp: 'Beta' }, { itemProp: 'Gamma' }]);
            ko.applyBindings({ myItems: myItems }, window.testDivTemplate);

            expect(window.testDivTemplate.childNodes[0].childNodes[0]).toContainText("Item: Alpha");
            expect(window.testDivTemplate.childNodes[0].childNodes[1]).toContainText("Item: Beta");
            expect(window.testDivTemplate.childNodes[0].childNodes[2]).toContainText("Item: Gamma");

            // Can cause re-rendering
            myItems.push({ itemProp: 'Pushed' });
            expect(window.testDivTemplate.childNodes[0].childNodes[0]).toContainText("Item: Alpha");
            expect(window.testDivTemplate.childNodes[0].childNodes[1]).toContainText("Item: Beta");
            expect(window.testDivTemplate.childNodes[0].childNodes[2]).toContainText("Item: Gamma");
            expect(window.testDivTemplate.childNodes[0].childNodes[3]).toContainText("Item: Pushed");

            myItems.splice(1, 1);
            expect(window.testDivTemplate.childNodes[0].childNodes[0]).toContainText("Item: Alpha");
            expect(window.testDivTemplate.childNodes[0].childNodes[1]).toContainText("Item: Gamma");
            expect(window.testDivTemplate.childNodes[0].childNodes[2]).toContainText("Item: Pushed");
        });

        it('may be nested', function() {
            window.testDivTemplate.innerHTML = "<div data-bind='template: { foreach: items }'>"
                                           + "<div data-bind='template: { foreach: children }'>"
                                               + "(Val: <span data-bind='text: $data'></span>, Invocations: <span data-bind='text: $root.invocationCount()'></span>, Parents: <span data-bind='text: $parents.length'></span>)"
                                           + "</div>"
                                      + "</div>";
            var viewModel = {
                invocations: 0, // Verifying # invocations to be sure we're not rendering anything multiple times and discarding the results
                items: ko.observableArray([
                    { children: ko.observableArray(['A1', 'A2', 'A3']) },
                    { children: ko.observableArray(['B1', 'B2']) }
                ])
            };
            viewModel.invocationCount = function() { return ++this.invocations }.bind(viewModel);
            ko.applyBindings(viewModel, window.testDivTemplate);

            expect(window.testDivTemplate.childNodes[0].childNodes[0]).toContainText("(Val: A1, Invocations: 1, Parents: 2)(Val: A2, Invocations: 2, Parents: 2)(Val: A3, Invocations: 3, Parents: 2)");
            expect(window.testDivTemplate.childNodes[0].childNodes[1]).toContainText("(Val: B1, Invocations: 4, Parents: 2)(Val: B2, Invocations: 5, Parents: 2)");

            // Check we can insert without causing anything else to rerender
            viewModel.items()[1].children.unshift('ANew');
            expect(window.testDivTemplate.childNodes[0].childNodes[0]).toContainText("(Val: A1, Invocations: 1, Parents: 2)(Val: A2, Invocations: 2, Parents: 2)(Val: A3, Invocations: 3, Parents: 2)");
            expect(window.testDivTemplate.childNodes[0].childNodes[1]).toContainText("(Val: ANew, Invocations: 6, Parents: 2)(Val: B1, Invocations: 4, Parents: 2)(Val: B2, Invocations: 5, Parents: 2)");
        });
    });

    describe('Data-bind syntax', function () {
        it('should expose parent binding context as $parent if binding with an explicit \"data\" value', function() {
            window.testDivTemplate.innerHTML = "<div data-bind='template: { data: someItem }'>"
                                          + "ValueBound: <span data-bind='text: $parent.parentProp'></span>"
                                      + "</div>";
            ko.applyBindings({ someItem: {}, parentProp: 'Hello' }, window.testDivTemplate);
            expect(window.testDivTemplate.childNodes[0]).toContainText("ValueBound: Hello");
        });

        it('should expose all ancestor binding contexts as $parents, with top frame also given as $root', function() {
            window.testDivTemplate.innerHTML = "<div data-bind='template: { data: outerItem }'>"
                                           + "<div data-bind='template: { data: middleItem }'>"
                                               + "<div data-bind='template: { data: innerItem }'>("
                                                   + "data: <span data-bind='text: $data.val'></span>, "
                                                   + "parent: <span data-bind='text: $parent.val'></span>, "
                                                   + "parents[0]: <span data-bind='text: $parents[0].val'></span>, "
                                                   + "parents[1]: <span data-bind='text: $parents[1].val'></span>, "
                                                   + "parents.length: <span data-bind='text: $parents.length'></span>, "
                                                   + "root: <span data-bind='text: $root.val'></span>"
                                               + ")</div>"
                                           + "</div>"
                                      + "</div>";

            ko.applyBindings({
                val: "ROOT",
                outerItem: {
                    val: "OUTER",
                    middleItem: {
                        val: "MIDDLE",
                        innerItem: { val: "INNER" }
                    }
                }
            }, window.testDivTemplate);
            expect(window.testDivTemplate.childNodes[0].childNodes[0].childNodes[0]).toContainText("(data: INNER, parent: MIDDLE, parents[0]: MIDDLE, parents[1]: OUTER, parents.length: 3, root: ROOT)");
        });
    });
});
