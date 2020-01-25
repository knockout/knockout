describe('Binding attribute syntax', function() {
    beforeEach(jasmine.prepareTestNode);

    it('applyBindings should accept no parameters and then act on document.body with undefined model', function() {
        this.after(function () { ko.cleanNode(document.body); });     // Just to avoid interfering with other specs

        var didInit = false;
        ko.bindingHandlers.test = {
            init: function (element, valueAccessor, allBindings, viewModel) {
                expect(element.id).toEqual("testElement");
                expect(viewModel).toBeUndefined();
                didInit = true;
            }
        };
        testNode.innerHTML = "<div id='testElement' data-bind='test:123'></div>";
        ko.applyBindings();
        expect(didInit).toEqual(true);
    });

    it('applyBindings should accept one parameter and then act on document.body with parameter as model', function() {
        this.after(function () { ko.cleanNode(document.body); });     // Just to avoid interfering with other specs

        var didInit = false;
        var suppliedViewModel = {};
        ko.bindingHandlers.test = {
            init: function (element, valueAccessor, allBindings, viewModel) {
                expect(element.id).toEqual("testElement");
                expect(viewModel).toEqual(suppliedViewModel);
                didInit = true;
            }
        };
        testNode.innerHTML = "<div id='testElement' data-bind='test'></div>";
        ko.applyBindings(suppliedViewModel);
        expect(didInit).toEqual(true);
    });

    it('applyBindings should accept two parameters and then act on second param as DOM node with first param as model', function() {
        var didInit = false;
        var suppliedViewModel = {};
        ko.bindingHandlers.test = {
            init: function (element, valueAccessor, allBindings, viewModel) {
                expect(element.id).toEqual("testElement");
                expect(viewModel).toEqual(suppliedViewModel);
                didInit = true;
            }
        };
        testNode.innerHTML = "<div id='testElement' data-bind='test'></div>";

        var shouldNotMatchNode = document.createElement("DIV");
        shouldNotMatchNode.innerHTML = "<div id='shouldNotMatchThisElement' data-bind='test'></div>";
        document.body.appendChild(shouldNotMatchNode);
        this.after(function () { document.body.removeChild(shouldNotMatchNode); });

        ko.applyBindings(suppliedViewModel, testNode);
        expect(didInit).toEqual(true);
    });

    var exceptionMessage = "second parameter should be a DOM node";
    ko.utils.arrayForEach([
        undefined,
        null,
        "",
        "A Node",
        123,
        {},
        []
    ], function (testValue) {
        it('applyBindings should throw an error if called with a non-node value: '+ jasmine.pp(testValue), function () {
            expect(function () {
                ko.applyBindings({}, testValue);
            }).toThrowContaining(exceptionMessage);
        });
    });

    it('applyBindings should accept three parameters and use the third parameter as a callback for modifying the root context', function() {
        var didInit = false;
        ko.bindingHandlers.test = {
            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                expect(bindingContext.extraValue).toEqual("extra");
                didInit = true;
            }
        };
        testNode.innerHTML = "<div id='testElement' data-bind='test'></div>";
        ko.applyBindings(null, testNode, function(context) {
            context.extraValue = "extra";
        });
        expect(didInit).toEqual(true);
    });

    it('Should tolerate empty or only white-space binding strings', function() {
        testNode.innerHTML = "<div data-bind=''></div><div data-bind='   '></div>";
        ko.applyBindings(null, testNode); // No exception means success
    });

    it('Should tolerate whitespace and nonexistent handlers', function () {
        testNode.innerHTML = "<div data-bind=' nonexistentHandler : \"Hello\" '></div>";
        ko.applyBindings(null, testNode); // No exception means success
    });

    it('Should tolerate arbitrary literals as the values for a handler', function () {
        testNode.innerHTML = "<div data-bind='stringLiteral: \"hello\", numberLiteral: 123, boolLiteralTrue: true, boolLiteralFalse: false, objectLiteral: {}, functionLiteral: function() { }, nullLiteral: null, undefinedLiteral: undefined'></div>";
        ko.applyBindings(null, testNode); // No exception means success
    });

    it('Should tolerate wacky IE conditional comments', function() {
        // Represents issue https://github.com/SteveSanderson/knockout/issues/186. Would fail on IE9, but work on earlier IE versions.
        testNode.innerHTML = "<div><!--[if IE]><!-->Hello<!--<![endif]--></div>";
        ko.applyBindings(null, testNode); // No exception means success
    });

    it('Should produce a meaningful error if a binding value contains invalid JavaScript', function() {
        ko.bindingHandlers.test = {
            init: function (element, valueAccessor) { valueAccessor(); }
        };
        testNode.innerHTML = "<div data-bind='test: (1;2)'></div>";
        expect(function () {
            ko.applyBindings(null, testNode);
        }).toThrowContaining("Unable to parse bindings.\nBindings value: test: (1;2)\nMessage:");
    });

    it('Should produce a meaningful error if a binding value doesn\'t exist', function() {
        ko.bindingHandlers.test = {
            init: function (element, valueAccessor) { valueAccessor(); }
        };
        testNode.innerHTML = "<div data-bind='test: nonexistentValue'></div>";
        expect(function () {
            ko.applyBindings(null, testNode);
        }).toThrowContaining("Unable to process binding \"test: function");
    });

    it('Should invoke registered handlers\'s init() then update() methods passing binding data', function () {
        var methodsInvoked = [];
        ko.bindingHandlers.test = {
            init: function (element, valueAccessor, allBindings) {
                methodsInvoked.push("init");
                expect(element.id).toEqual("testElement");
                expect(valueAccessor()).toEqual("Hello");
                expect(allBindings.get('another')).toEqual(123);
            },
            update: function (element, valueAccessor, allBindings) {
                methodsInvoked.push("update");
                expect(element.id).toEqual("testElement");
                expect(valueAccessor()).toEqual("Hello");
                expect(allBindings.get('another')).toEqual(123);
            }
        }
        testNode.innerHTML = "<div id='testElement' data-bind='test:\"Hello\", another:123'></div>";
        ko.applyBindings(null, testNode);
        expect(methodsInvoked.length).toEqual(2);
        expect(methodsInvoked[0]).toEqual("init");
        expect(methodsInvoked[1]).toEqual("update");
    });

    it('Should invoke each handlers\'s init() and update() before running the next one', function () {
        var methodsInvoked = [];
        ko.bindingHandlers.test1 = ko.bindingHandlers.test2 = {
            init: function (element, valueAccessor) {
                methodsInvoked.push("init" + valueAccessor());
            },
            update: function (element, valueAccessor) {
                methodsInvoked.push("update" + valueAccessor());
            }
        };
        testNode.innerHTML = "<div data-bind='test1:\"1\", test2:\"2\"'></div>";
        ko.applyBindings(null, testNode);
        expect(methodsInvoked).toEqual(['init1', 'update1', 'init2', 'update2']);
    });

    it('Should be able to use $element in binding value', function() {
        testNode.innerHTML = "<div data-bind='text: $element.tagName'></div>";
        ko.applyBindings({}, testNode);
        expect(testNode).toContainText("DIV");
    });

    it('Should be able to use $context in binding value to refer to the context object', function() {
        testNode.innerHTML = "<div data-bind='text: $context.$data === $data'></div>";
        ko.applyBindings({}, testNode);
        expect(testNode).toContainText("true");
    });

    it('Should be able to refer to the bound object itself (at the root scope, the viewmodel) via $data', function() {
        testNode.innerHTML = "<div data-bind='text: $data.someProp'></div>";
        ko.applyBindings({ someProp: 'My prop value' }, testNode);
        expect(testNode).toContainText("My prop value");
    });

    it('Bindings can signal that they control descendant bindings by returning a flag from their init function', function() {
        ko.bindingHandlers.test = {
            init: function() { return { controlsDescendantBindings : true } }
        };
        testNode.innerHTML = "<div data-bind='test: true'>"
                           +     "<div data-bind='text: 123'>456</div>"
                           + "</div>"
                           + "<div data-bind='text: 123'>456</div>";
        ko.applyBindings(null, testNode);

        expect(testNode.childNodes[0].childNodes[0].innerHTML).toEqual("456");
        expect(testNode.childNodes[1].innerHTML).toEqual("123");
    });

    it('Should not be allowed to have multiple bindings on the same element that claim to control descendant bindings', function() {
        ko.bindingHandlers.test1 = {
            init: function() { return { controlsDescendantBindings : true } }
        };
        ko.bindingHandlers.test2 = ko.bindingHandlers.test1;
        testNode.innerHTML = "<div data-bind='test1: true, test2: true'></div>";
        expect(function () {
            ko.applyBindings(null, testNode);
        }).toThrowContaining("Multiple bindings (test1 and test2) are trying to control descendant bindings of the same element.");
    });

    it('Should use properties on the view model in preference to properties on the binding context', function() {
        testNode.innerHTML = "<div data-bind='text: $data.someProp'></div>";
        ko.applyBindings({ '$data': { someProp: 'Inner value'}, someProp: 'Outer value' }, testNode);
        expect(testNode).toContainText("Inner value");
    });

    it('Should be able to extend a binding context, adding new custom properties, without mutating the original binding context', function() {
        ko.bindingHandlers.addCustomProperty = {
            init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
                ko.applyBindingsToDescendants(bindingContext.extend({ '$customProp': 'my value' }), element);
                return { controlsDescendantBindings : true };
            }
        };
        testNode.innerHTML = "<div data-bind='with: sub'><div data-bind='addCustomProperty: true'><div data-bind='text: $customProp'></div></div></div>";
        var vm = { sub: {} };
        ko.applyBindings(vm, testNode);
        expect(testNode).toContainText("my value");
        expect(ko.contextFor(testNode.childNodes[0].childNodes[0].childNodes[0]).$customProp).toEqual("my value");
        expect(ko.contextFor(testNode.childNodes[0].childNodes[0]).$customProp).toBeUndefined(); // Should not affect original binding context

        // vale of $data and $parent should be unchanged in extended context
        expect(ko.contextFor(testNode.childNodes[0].childNodes[0].childNodes[0]).$data).toEqual(vm.sub);
        expect(ko.contextFor(testNode.childNodes[0].childNodes[0].childNodes[0]).$parent).toEqual(vm);
    });

    it('Binding contexts should inherit any custom properties from ancestor binding contexts', function() {
        ko.bindingHandlers.addCustomProperty = {
            init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
                ko.applyBindingsToDescendants(bindingContext.extend({ '$customProp': 'my value' }), element);
                return { controlsDescendantBindings : true };
            }
        };
        testNode.innerHTML = "<div data-bind='addCustomProperty: true'><div data-bind='with: true'><div data-bind='text: $customProp'></div></div></div>";
        ko.applyBindings(null, testNode);
        expect(testNode).toContainText("my value");
    });

    it('Binding context should hide or not minify extra internal properties', function () {
        testNode.innerHTML = "<div data-bind='with: $data'><div></div></div>";
        ko.applyBindings({}, testNode);

        var allowedProperties = ['$parents', '$root', 'ko', '$rawData', '$data', '$parentContext', '$parent'];
        if (ko.utils.createSymbolOrString('') === '') {
            allowedProperties.push('_subscribable');
            allowedProperties.push('_ancestorBindingInfo');
            allowedProperties.push('_dataDependency');
        }
        ko.utils.objectForEach(ko.contextFor(testNode.childNodes[0].childNodes[0]), function (prop) {
            expect(allowedProperties).toContain(prop);
        });
    });

    it('Should be able to retrieve the binding context associated with any node', function() {
        testNode.innerHTML = "<div><div data-bind='text: name'></div></div>";
        ko.applyBindings({ name: 'Bert' }, testNode.childNodes[0]);

        expect(testNode.childNodes[0].childNodes[0]).toContainText("Bert");

        // Can't get binding context for unbound nodes
        expect(ko.dataFor(testNode)).toBeUndefined();
        expect(ko.contextFor(testNode)).toBeUndefined();

        // Can get binding context for directly bound nodes
        expect(ko.dataFor(testNode.childNodes[0]).name).toEqual("Bert");
        expect(ko.contextFor(testNode.childNodes[0]).$data.name).toEqual("Bert");

        // Can get binding context for descendants of directly bound nodes
        expect(ko.dataFor(testNode.childNodes[0].childNodes[0]).name).toEqual("Bert");
        expect(ko.contextFor(testNode.childNodes[0].childNodes[0]).$data.name).toEqual("Bert");

        // Also test that a non-node object returns nothing and doesn't crash
        expect(ko.dataFor({})).toBeUndefined();
        expect(ko.contextFor({})).toBeUndefined();
    });

    it('Should not return a context object for unbound elements that are descendants of bound elements', function() {
        // From https://github.com/knockout/knockout/issues/2148
        testNode.innerHTML = '<div data-bind="visible: isVisible"><span>Some text</span><div data-bind="allowBindings: false"><input data-bind="value: someValue"></div></div>';

        ko.bindingHandlers.allowBindings = {
            init: function(elem, valueAccessor) {
                // Let bindings proceed as normal *only if* my value is false
                var shouldAllowBindings = ko.unwrap(valueAccessor());
                return { controlsDescendantBindings: !shouldAllowBindings };
            }
        };
        var vm = {isVisible: true};
        ko.applyBindings(vm, testNode);

        // All of the bound nodes return the viewmodel
        expect(ko.dataFor(testNode.childNodes[0])).toBe(vm);
        expect(ko.dataFor(testNode.childNodes[0].childNodes[0])).toBe(vm);
        expect(ko.dataFor(testNode.childNodes[0].childNodes[1])).toBe(vm);
        expect(ko.contextFor(testNode.childNodes[0].childNodes[1]).$data).toBe(vm);

        // The unbound child node returns undefined
        expect(ko.dataFor(testNode.childNodes[0].childNodes[1].childNodes[0])).toBeUndefined();
        expect(ko.contextFor(testNode.childNodes[0].childNodes[1].childNodes[0])).toBeUndefined();
    });

    it('Should return the context object for nodes specifically bound, but override with general binding', function() {
        // See https://github.com/knockout/knockout/issues/231#issuecomment-388210267
        testNode.innerHTML = '<div data-bind="text: name"></div>';

        var vm1 = { name: "specific" };
        ko.applyBindingsToNode(testNode.childNodes[0], { text: vm1.name }, vm1);
        expect(testNode).toContainText(vm1.name);
        expect(ko.dataFor(testNode.childNodes[0])).toBe(vm1);
        expect(ko.contextFor(testNode.childNodes[0]).$data).toBe(vm1);

        var vm2 = { name: "general" };
        ko.applyBindings(vm2, testNode);
        expect(testNode).toContainText(vm2.name);
        expect(ko.dataFor(testNode.childNodes[0])).toBe(vm2);
        expect(ko.contextFor(testNode.childNodes[0]).$data).toBe(vm2);
    });

    it('Should not be allowed to use containerless binding syntax for bindings other than whitelisted ones', function() {
        testNode.innerHTML = "Hello <!-- ko visible: false -->Some text<!-- /ko --> Goodbye";
        expect(function () {
            ko.applyBindings(null, testNode);
        }).toThrow("The binding 'visible' cannot be used with virtual elements");
    });

    it('Should be able to set a custom binding to use containerless binding', function() {
        var initCalls = 0;
        ko.bindingHandlers.test = { init: function () { initCalls++ } };
        ko.virtualElements.allowedBindings['test'] = true;

        testNode.innerHTML = "Hello <!-- ko test: false -->Some text<!-- /ko --> Goodbye";
        ko.applyBindings(null, testNode);

        expect(initCalls).toEqual(1);
        expect(testNode).toContainText("Hello Some text Goodbye");
    });

    it('Should be allowed to express containerless bindings with arbitrary internal whitespace and newlines', function() {
        testNode.innerHTML = "Hello <!-- ko\n" +
                             "    with\n" +
                             "      : \n "+
                             "        { \n" +
                             "           \tpersonName: 'Bert'\n" +
                             "        }\n" +
                             "   \t --><span data-bind='text: personName'></span><!-- \n" +
                             "     /ko \n" +
                             "-->, Goodbye";
        ko.applyBindings(null, testNode);
        expect(testNode).toContainText('Hello Bert, Goodbye');
    });

    it('Should reject closing virtual bindings without matching open, when found as a sibling', function() {
        testNode.innerHTML = "x<div></div><!-- /ko -->x";
        expect(function() {
            ko.applyBindings(null, testNode);
        }).toThrow();
    });

    it('Should reject closing virtual bindings without matching open, when found as a a first child', function() {
        testNode.innerHTML = "<div>x<!-- /ko -->x</div>";
        expect(function() {
            ko.applyBindings(null, testNode);
        }).toThrow();
    });

    it('Should reject closing virtual bindings, when found as first child at the top level', function() {
        testNode.innerHTML = "x<!-- /ko -->x";
        expect(function() {
            ko.applyBindings(null, testNode);
        }).toThrow();
    });

    it('Should reject duplicated closing virtual bindings', function() {
        testNode.innerHTML = "x<!-- ko if: true --><div></div><!-- /ko --><!-- /ko -->x";
        expect(function() {
            ko.applyBindings(null, testNode);
        }).toThrow();
    });

    it('Should reject opening virtual bindings that are not closed', function() {
        testNode.innerHTML = "x<!-- ko if: true -->x";
        expect(function() {
            ko.applyBindings(null, testNode);
        }).toThrow();
    });

    it('Should reject virtual bindings that are nested incorrectly', function() {
        testNode.innerHTML = "x<!-- ko if: true --><div><!-- /ko --></div>x";
        expect(function() {
            ko.applyBindings(null, testNode);
        }).toThrow();
    });

    it('Should be able to access virtual children in custom containerless binding', function() {
        var countNodes = 0;
        ko.bindingHandlers.test = {
            init: function (element, valueAccessor) {
                // Counts the number of virtual children, and overwrites the text contents of any text nodes
                for (var node = ko.virtualElements.firstChild(element); node; node = ko.virtualElements.nextSibling(node)) {
                    countNodes++;
                    if (node.nodeType === 3)
                        node.data = 'new text';
                }
            }
        };
        ko.virtualElements.allowedBindings['test'] = true;

        testNode.innerHTML = "Hello <!-- ko test: false -->Some text<!-- /ko --> Goodbye";
        ko.applyBindings(null, testNode);

        expect(countNodes).toEqual(1);
        expect(testNode).toContainText("Hello new text Goodbye");
    });

    it('Should only bind containerless binding once inside template', function() {
        var initCalls = 0;
        ko.bindingHandlers.test = { init: function () { initCalls++ } };
        ko.virtualElements.allowedBindings['test'] = true;

        testNode.innerHTML = "Hello <!-- ko if: true --><!-- ko test: false -->Some text<!-- /ko --><!-- /ko --> Goodbye";
        ko.applyBindings(null, testNode);

        expect(initCalls).toEqual(1);
        expect(testNode).toContainText("Hello Some text Goodbye");
    });

    it('Bindings in containerless binding in templates should be bound only once', function() {
        delete ko.bindingHandlers.nonexistentHandler;
        var initCalls = 0;
        ko.bindingHandlers.test = { init: function () { initCalls++; } };
        testNode.innerHTML = "<div data-bind='template: {\"if\":true}'>xxx<!-- ko nonexistentHandler: true --><span data-bind='test: true'></span><!-- /ko --></div>";
        ko.applyBindings({}, testNode);
        expect(initCalls).toEqual(1);
    });

    it('Should automatically bind virtual descendants of containerless markers if no binding controlsDescendantBindings', function() {
        testNode.innerHTML = "Hello <!-- ko dummy: false --><span data-bind='text: \"WasBound\"'>Some text</span><!-- /ko --> Goodbye";
        ko.applyBindings(null, testNode);
        expect(testNode).toContainText("Hello WasBound Goodbye");
    });

    it('Should be able to set and access correct context in custom containerless binding', function() {
        ko.bindingHandlers.bindChildrenWithCustomContext = {
            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var innerContext = bindingContext.createChildContext({ myCustomData: 123 });
                ko.applyBindingsToDescendants(innerContext, element);
                return { 'controlsDescendantBindings': true };
            }
        };
        ko.virtualElements.allowedBindings['bindChildrenWithCustomContext'] = true;

        testNode.innerHTML = "Hello <!-- ko bindChildrenWithCustomContext: true --><div>Some text</div><!-- /ko --> Goodbye";
        ko.applyBindings(null, testNode);

        expect(ko.dataFor(testNode.childNodes[2]).myCustomData).toEqual(123);
    });

    it('Should be able to set and access correct context in nested containerless binding', function() {
        delete ko.bindingHandlers.nonexistentHandler;
        ko.bindingHandlers.bindChildrenWithCustomContext = {
            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var innerContext = bindingContext.createChildContext({ myCustomData: 123 });
                ko.applyBindingsToDescendants(innerContext, element);
                return { 'controlsDescendantBindings': true };
            }
        };

        testNode.innerHTML = "Hello <div data-bind='bindChildrenWithCustomContext: true'><!-- ko nonexistentHandler: 123 --><div>Some text</div><!-- /ko --></div> Goodbye";
        ko.applyBindings(null, testNode);

        expect(ko.dataFor(testNode.childNodes[1].childNodes[0]).myCustomData).toEqual(123);
        expect(ko.dataFor(testNode.childNodes[1].childNodes[1]).myCustomData).toEqual(123);
    });

    it('Should be able to access custom context variables in child context', function() {
        ko.bindingHandlers.bindChildrenWithCustomContext = {
            init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                var innerContext = bindingContext.createChildContext({ myCustomData: 123 });
                innerContext.customValue = 'xyz';
                ko.applyBindingsToDescendants(innerContext, element);
                return { 'controlsDescendantBindings': true };
            }
        };

        testNode.innerHTML = "Hello <div data-bind='bindChildrenWithCustomContext: true'><!-- ko with: myCustomData --><div>Some text</div><!-- /ko --></div> Goodbye";
        ko.applyBindings(null, testNode);

        expect(ko.contextFor(testNode.childNodes[1].childNodes[0]).customValue).toEqual('xyz');
        expect(ko.dataFor(testNode.childNodes[1].childNodes[1])).toEqual(123);
        expect(ko.contextFor(testNode.childNodes[1].childNodes[1]).$parent.myCustomData).toEqual(123);
        expect(ko.contextFor(testNode.childNodes[1].childNodes[1]).$parentContext.customValue).toEqual('xyz');
    });

    it('Should be able to use value-less binding in containerless binding', function() {
        var initCalls = 0;
        ko.bindingHandlers.test = { init: function () { initCalls++ } };
        ko.virtualElements.allowedBindings['test'] = true;

        testNode.innerHTML = "Hello <!-- ko test -->Some text<!-- /ko --> Goodbye";
        ko.applyBindings(null, testNode);

        expect(initCalls).toEqual(1);
        expect(testNode).toContainText("Hello Some text Goodbye");
    });

    it('Should not allow multiple applyBindings calls for the same element', function() {
        testNode.innerHTML = "<div data-bind='text: \"Some Text\"'></div>";

        // First call is fine
        ko.applyBindings({}, testNode);

        // Second call throws an error
        expect(function () {
            ko.applyBindings({}, testNode);
        }).toThrow("You cannot apply bindings multiple times to the same element.");
    });

    it('Should allow multiple applyBindings calls for the same element if cleanNode is used', function() {
        testNode.innerHTML = "<div data-bind='text: \"Some Text\"'></div>";

        // First call
        ko.applyBindings({}, testNode);

        // cleanNode called before second call
        ko.cleanNode(testNode);
        ko.applyBindings({}, testNode);
        // Should not throw any errors
    });

    it('Should allow multiple applyBindings calls for the same element if subsequent call provides a binding', function() {
        testNode.innerHTML = "<div data-bind='text: \"Some Text\"'></div>";

        // First call uses data-bind
        ko.applyBindings({}, testNode);

        // Second call provides a binding
        ko.applyBindingsToNode(testNode, { visible: false }, {});
        // Should not throw any errors
    });

    it('Should allow multiple applyBindings calls for the same element if initial call provides a binding', function() {
        testNode.innerHTML = "<div data-bind='text: \"Some Text\"'></div>";

        // First call provides a binding
        ko.applyBindingsToNode(testNode, { visible: false }, {});

        // Second call uses data-bind
        ko.applyBindings({}, testNode);
        // Should not throw any errors
    });

    describe('Should not bind against text content inside restricted elements', function() {
        this.beforeEach(function() {
            this.restoreAfter(ko.bindingProvider, 'instance');

            // Developers won't expect or want binding to mutate the contents of <script> or <textarea>
            // elements. Historically this wasn't a problem because the default binding provider only
            // acts on elements, but now custom providers can act on text contents of elements, it's
            // important to ensure we don't break these elements by mutating their contents.

            // First replace the binding provider with one that's hardcoded to replace all text
            // content with a special message, via a binding handler that operates on text nodes

            var originalBindingProvider = ko.bindingProvider.instance;
            ko.bindingProvider.instance = {
                nodeHasBindings: function(node) {
                    // IE < 9 can't bind text nodes, as expando properties are not allowed on them.
                    // This will still prove that the binding provider was not executed on the children of a restricted element.
                    if (node.nodeType === 3 && jasmine.ieVersion < 9) {
                        node.data = "replaced";
                        return false;
                    }

                    return true;
                },
                getBindingAccessors: function(node, bindingContext) {
                    if (node.nodeType === 3) {
                        return {
                            replaceTextNodeContent: function() { return "replaced"; }
                        };
                    } else {
                        return originalBindingProvider.getBindingAccessors(node, bindingContext);
                    }
                }
            };
            ko.bindingHandlers.replaceTextNodeContent = {
                update: function(textNode, valueAccessor) { textNode.data = valueAccessor(); }
            };
        });


        it('<script>', function() {
            testNode.innerHTML = "<p>Hello</p><script>alert(123);</script><p>Goodbye</p>";
            ko.applyBindings({ sometext: 'hello' }, testNode);
            expect(testNode).toContainHtml('<p>replaced</p><script>alert(123);</script><p>replaced</p>');
        });


        it('<textarea>', function() {
            testNode.innerHTML = "<p>Hello</p><textarea>test</textarea><p>Goodbye</p>";
            ko.applyBindings({ sometext: 'hello' }, testNode);
            expect(testNode).toContainHtml('<p>replaced</p><textarea>test</textarea><p>replaced</p>');
        });

        it('<template>', function() {
            document.createElement('template'); // For old IE
            testNode.innerHTML = "<p>Hello</p><template>test</template><p>Goodbye</p>";
            ko.applyBindings({ sometext: 'hello' }, testNode);
            expect(testNode).toContainHtml('<p>replaced</p><template>test</template><p>replaced</p>');
        });
    });

    it('Should call a childrenComplete callback function after descendant elements are bound', function () {
        var callbacks = 0,
            callback = function (nodes, data) {
                expect(nodes.length).toEqual(1);
                expect(nodes[0]).toEqual(testNode.childNodes[0].childNodes[0]);
                expect(data).toEqual(vm);
                callbacks++;
            },
            vm = { callback: callback };

        testNode.innerHTML = "<div data-bind='childrenComplete: callback'><span data-bind='text: \"Some Text\"'></span></div>";
        ko.applyBindings(vm, testNode);
        expect(callbacks).toEqual(1);
    });

    it('Should call a childrenComplete callback function when bound to a virtual element', function () {
        var callbacks = 0,
            callback = function (nodes, data) {
                expect(nodes.length).toEqual(1);
                expect(nodes[0]).toEqual(testNode.childNodes[2]);
                expect(data).toEqual(vm);
                callbacks++;
            },
            vm = { callback: callback };

        testNode.innerHTML = "begin <!-- ko childrenComplete: callback --><span data-bind='text: \"Some Text\"'></span><!-- /ko --> end";
        ko.applyBindings(vm, testNode);
        expect(callbacks).toEqual(1);
    });

    it('Should not call a childrenComplete callback function when there are no descendant nodes', function () {
        var callbacks = 0;

        testNode.innerHTML = "<div data-bind='childrenComplete: callback'></div>";
        ko.applyBindings({ callback: function () { callbacks++; } }, testNode);
        expect(callbacks).toEqual(0);
    });

    it('Should ignore (and not throw an error) for a null childrenComplete callback', function () {
        testNode.innerHTML = "<div data-bind='childrenComplete: null'><span data-bind='text: \"Some Text\"'></span></div>";
        ko.applyBindings({}, testNode);
    });

    it('Should call childrenComplete callback registered with ko.bindingEvent.subscribe', function () {
        var callbacks = 0,
            vm = {};

        ko.bindingEvent.subscribe(testNode, "childrenComplete", function (node) {
            callbacks++;
            expect(node).toEqual(testNode);
            expect(ko.dataFor(node)).toEqual(vm);
        });

        testNode.innerHTML = "<div></div>";
        ko.applyBindings(vm, testNode);
        expect(callbacks).toEqual(1);
    });

    it('Should call childrenComplete callback immediately if already bound and "notifyImmediately" option set', function () {
        var callbacks = 0,
            vm = {};

        testNode.innerHTML = "<div></div>";
        ko.applyBindings(vm, testNode);

        ko.bindingEvent.subscribe(testNode, "childrenComplete", function (node) {
            callbacks++;
            expect(node).toEqual(testNode);
            expect(ko.dataFor(node)).toEqual(vm);
        }, null, { notifyImmediately: true });

        expect(callbacks).toEqual(1);
    });

    it('Should call a descendantsComplete callback function after descendant elements are bound', function () {
        var callbacks = 0,
            callback = function (node) {
                expect(node).toEqual(testNode.childNodes[0]);
                callbacks++;
            },
            vm = { callback: callback };

        testNode.innerHTML = "<div data-bind='descendantsComplete: callback'><span data-bind='text: \"Some Text\"'></span></div>";
        ko.applyBindings(vm, testNode);
        expect(callbacks).toEqual(1);
    });

    it('Should call a descendantsComplete callback function when bound to a virtual element', function () {
        var callbacks = 0,
            callback = function (node) {
                expect(node).toEqual(testNode.childNodes[1]);
                callbacks++;
            },
            vm = { callback: callback };

        testNode.innerHTML = "begin <!-- ko descendantsComplete: callback --><span data-bind='text: \"Some Text\"'></span><!-- /ko --> end";
        ko.applyBindings(vm, testNode);
        expect(callbacks).toEqual(1);
    });

    it('Should not call a descendantsComplete callback function when there are no descendant nodes', function () {
        var callbacks = 0;

        testNode.innerHTML = "<div data-bind='descendantsComplete: callback'></div>";
        ko.applyBindings({ callback: function () { callbacks++; } }, testNode);
        expect(callbacks).toEqual(0);
    });

    it('Should ignore (and not throw an error) for a null descendantsComplete callback', function () {
        testNode.innerHTML = "<div data-bind='descendantsComplete: null'><span data-bind='text: \"Some Text\"'></span></div>";
        ko.applyBindings({}, testNode);
    });

    it('Should call descendantsComplete callback registered with ko.bindingEvent.subscribe, if descendantsComplete is also present in the binding', function () {
        var callbacks = 0;

        testNode.innerHTML = "<div data-bind='descendantsComplete'><div></div></div>";
        ko.bindingEvent.subscribe(testNode.childNodes[0], "descendantsComplete", function (node) {
            callbacks++;
            expect(node).toEqual(testNode.childNodes[0]);
        });

        ko.applyBindings({}, testNode);
        expect(callbacks).toEqual(1);
    });

    it('Should throw an error if a descendantsComplete callback is registered when descendantsComplete is not present in the binding', function () {
        var callbacks = 0;

        testNode.innerHTML = "<div><div></div></div>";
        ko.bindingEvent.subscribe(testNode.childNodes[0], "descendantsComplete", function (node) { callbacks++ });

        expect(function () {
            ko.applyBindings({}, testNode);
        }).toThrowContaining("event not supported");
        expect(callbacks).toEqual(0);
    });

    it('Should call a descendantsComplete callback function even if descendant element doesn\'t generate event', function () {
        var callbacks = 0,
            callback = function (node) {
                expect(node).toEqual(testNode.childNodes[0]);
                callbacks++;
            },
            vm = { callback: callback };

        testNode.innerHTML = "<div data-bind='descendantsComplete: callback'><span data-bind='text: \"Some Text\"'></span><div data-bind='descendantsComplete'></div></div>";
        ko.applyBindings(vm, testNode);
        expect(callbacks).toEqual(1);
    });
});
