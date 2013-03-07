describe('Binding attribute syntax', function() {
    beforeEach(jasmine.prepareTestNode);

    it('applyBindings should accept no parameters and then act on document.body with undefined model', function() {
        var didInit = false;
        ko.bindingHandlers.test = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
                expect(element.id).toEqual("testElement");
                expect(viewModel).toEqual(undefined);
                didInit = true;
            }
        };
        testNode.innerHTML = "<div id='testElement' data-bind='test:123'></div>";
        ko.applyBindings();
        expect(didInit).toEqual(true);

        // Just to avoid interfering with other specs:
        ko.utils.domData.clear(document.body);
    });

    it('applyBindings should accept one parameter and then act on document.body with parameter as model', function() {
        var didInit = false;
        var suppliedViewModel = {};
        ko.bindingHandlers.test = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
                expect(element.id).toEqual("testElement");
                expect(viewModel).toEqual(suppliedViewModel);
                didInit = true;
            }
        };
        testNode.innerHTML = "<div id='testElement' data-bind='test:123'></div>";
        ko.applyBindings(suppliedViewModel);
        expect(didInit).toEqual(true);

        // Just to avoid interfering with other specs:
        ko.utils.domData.clear(document.body);
    });

    it('applyBindings should accept two parameters and then act on second param as DOM node with first param as model', function() {
        var didInit = false;
        var suppliedViewModel = {};
        ko.bindingHandlers.test = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
                expect(element.id).toEqual("testElement");
                expect(viewModel).toEqual(suppliedViewModel);
                didInit = true;
            }
        };
        testNode.innerHTML = "<div id='testElement' data-bind='test:123'></div>";
        var shouldNotMatchNode = document.createElement("DIV");
        shouldNotMatchNode.innerHTML = "<div id='shouldNotMatchThisElement' data-bind='test:123'></div>";
        document.body.appendChild(shouldNotMatchNode);
        try {
            ko.applyBindings(suppliedViewModel, testNode);
            expect(didInit).toEqual(true);
        } finally {
            shouldNotMatchNode.parentNode.removeChild(shouldNotMatchNode);
        }
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

    it('Should invoke registered handlers\' init() then update() methods passing binding data', function () {
        var methodsInvoked = [];
        ko.bindingHandlers.test = {
            init: function (element, valueAccessor, allBindingsAccessor) {
                methodsInvoked.push("init");
                expect(element.id).toEqual("testElement");
                expect(valueAccessor()).toEqual("Hello");
                expect(allBindingsAccessor().another).toEqual(123);
            },
            update: function (element, valueAccessor, allBindingsAccessor) {
                methodsInvoked.push("update");
                expect(element.id).toEqual("testElement");
                expect(valueAccessor()).toEqual("Hello");
                expect(allBindingsAccessor().another).toEqual(123);
            }
        }
        testNode.innerHTML = "<div id='testElement' data-bind='test:\"Hello\", another:123'></div>";
        ko.applyBindings(null, testNode);
        expect(methodsInvoked.length).toEqual(2);
        expect(methodsInvoked[0]).toEqual("init");
        expect(methodsInvoked[1]).toEqual("update");
    });

    it('If the binding handler depends on an observable, invokes the init handler once and the update handler whenever a new value is available', function () {
        var observable = new ko.observable();
        var initPassedValues = [], updatePassedValues = [];
        ko.bindingHandlers.test = {
            init: function (element, valueAccessor) { initPassedValues.push(valueAccessor()()); },
            update: function (element, valueAccessor) { updatePassedValues.push(valueAccessor()()); }
        };
        testNode.innerHTML = "<div data-bind='test: myObservable'></div>";

        ko.applyBindings({ myObservable: observable }, testNode);
        expect(initPassedValues.length).toEqual(1);
        expect(updatePassedValues.length).toEqual(1);
        expect(initPassedValues[0]).toEqual(undefined);
        expect(updatePassedValues[0]).toEqual(undefined);

        observable("A");
        expect(initPassedValues.length).toEqual(1);
        expect(updatePassedValues.length).toEqual(2);
        expect(updatePassedValues[1]).toEqual("A");
    });

    it('If the associated DOM element was removed by KO, handler subscriptions are disposed immediately', function () {
        var observable = new ko.observable("A");
        testNode.innerHTML = "<div data-bind='anyHandler: myObservable()'></div>";
        ko.applyBindings({ myObservable: observable }, testNode);

        expect(observable.getSubscriptionsCount()).toEqual(1);

        ko.removeNode(testNode);

        expect(observable.getSubscriptionsCount()).toEqual(0);
    });

    it('If the associated DOM element was removed independently of KO, handler subscriptions are disposed on the next evaluation', function () {
        var observable = new ko.observable("A");
        testNode.innerHTML = "<div data-bind='anyHandler: myObservable()'></div>";
        ko.applyBindings({ myObservable: observable }, testNode);

        expect(observable.getSubscriptionsCount()).toEqual(1);

        testNode.parentNode.removeChild(testNode);
        observable("B"); // Force re-evaluation

        expect(observable.getSubscriptionsCount()).toEqual(0);
    });

    it('If the binding attribute involves an observable, re-invokes the bindings if the observable notifies a change', function () {
        var observable = new ko.observable({ message: "hello" });
        var passedValues = [];
        ko.bindingHandlers.test = { update: function (element, valueAccessor) { passedValues.push(valueAccessor()); } };
        testNode.innerHTML = "<div data-bind='test: myObservable().message'></div>";

        ko.applyBindings({ myObservable: observable }, testNode);
        expect(passedValues.length).toEqual(1);
        expect(passedValues[0]).toEqual("hello");

        observable({ message: "goodbye" });
        expect(passedValues.length).toEqual(2);
        expect(passedValues[1]).toEqual("goodbye");
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
        testNode.innerHTML = "<div data-bind='test1: true, test2: true'></div>"
        var didThrow = false;

        try { ko.applyBindings(null, testNode) }
        catch(ex) { didThrow = true; expect(ex.message).toContain('Multiple bindings (test1 and test2) are trying to control descendant bindings of the same element.') }
        expect(didThrow).toEqual(true);
    });

    it('Should use properties on the view model in preference to properties on the binding context', function() {
        testNode.innerHTML = "<div data-bind='text: $data.someProp'></div>";
        ko.applyBindings({ '$data': { someProp: 'Inner value'}, someProp: 'Outer value' }, testNode);
        expect(testNode).toContainText("Inner value");
    });

    it('Should be able to extend a binding context, adding new custom properties, without mutating the original binding context', function() {
        ko.bindingHandlers.addCustomProperty = {
            init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                ko.applyBindingsToDescendants(bindingContext.extend({ '$customProp': 'my value' }), element);
                return { controlsDescendantBindings : true };
            }
        };
        testNode.innerHTML = "<div data-bind='with: sub'><div data-bind='addCustomProperty: true'><div data-bind='text: $customProp'></div></div></div>";
        var vm = { sub: {} };
        ko.applyBindings(vm, testNode);
        expect(testNode).toContainText("my value");
        expect(ko.contextFor(testNode.childNodes[0].childNodes[0].childNodes[0]).$customProp).toEqual("my value");
        expect(ko.contextFor(testNode.childNodes[0].childNodes[0]).$customProp).toEqual(undefined); // Should not affect original binding context

        // vale of $data and $parent should be unchanged in extended context
        expect(ko.contextFor(testNode.childNodes[0].childNodes[0].childNodes[0]).$data).toEqual(vm.sub);
        expect(ko.contextFor(testNode.childNodes[0].childNodes[0].childNodes[0]).$parent).toEqual(vm);
    });

    it('Binding contexts should inherit any custom properties from ancestor binding contexts', function() {
        ko.bindingHandlers.addCustomProperty = {
            init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                ko.applyBindingsToDescendants(bindingContext.extend({ '$customProp': 'my value' }), element);
                return { controlsDescendantBindings : true };
            }
        };
        testNode.innerHTML = "<div data-bind='addCustomProperty: true'><div data-bind='with: true'><div data-bind='text: $customProp'></div></div></div>";
        ko.applyBindings(null, testNode);
        expect(testNode).toContainText("my value");
    });

    it('Should be able to retrieve the binding context associated with any node', function() {
        testNode.innerHTML = "<div><div data-bind='text: name'></div></div>";
        ko.applyBindings({ name: 'Bert' }, testNode.childNodes[0]);

        expect(testNode.childNodes[0].childNodes[0]).toContainText("Bert");

        // Can't get binding context for unbound nodes
        expect(ko.dataFor(testNode)).toEqual(undefined);
        expect(ko.contextFor(testNode)).toEqual(undefined);

        // Can get binding context for directly bound nodes
        expect(ko.dataFor(testNode.childNodes[0]).name).toEqual("Bert");
        expect(ko.contextFor(testNode.childNodes[0]).$data.name).toEqual("Bert");

        // Can get binding context for descendants of directly bound nodes
        expect(ko.dataFor(testNode.childNodes[0].childNodes[0]).name).toEqual("Bert");
        expect(ko.contextFor(testNode.childNodes[0].childNodes[0]).$data.name).toEqual("Bert");
    });

    it('Should not be allowed to use containerless binding syntax for bindings other than whitelisted ones', function() {
        testNode.innerHTML = "Hello <!-- ko visible: false -->Some text<!-- /ko --> Goodbye"
        var didThrow = false;
        try {
            ko.applyBindings(null, testNode);
        } catch(ex) {
            didThrow = true;
            expect(ex.message).toEqual("The binding 'visible' cannot be used with virtual elements");
        }
        expect(didThrow).toEqual(true);
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

        testNode.innerHTML = "Hello <!-- ko test: false -->Some text<!-- /ko --> Goodbye"
        ko.applyBindings(null, testNode);

        expect(countNodes).toEqual(1);
        expect(testNode).toContainText("Hello new text Goodbye");
    });

    it('Should only bind containerless binding once inside template', function() {
        var initCalls = 0;
        ko.bindingHandlers.test = { init: function () { initCalls++ } };
        ko.virtualElements.allowedBindings['test'] = true;

        testNode.innerHTML = "Hello <!-- ko if: true --><!-- ko test: false -->Some text<!-- /ko --><!-- /ko --> Goodbye"
        ko.applyBindings(null, testNode);

        expect(initCalls).toEqual(1);
        expect(testNode).toContainText("Hello Some text Goodbye");
    });

    it('Should automatically bind virtual descendants of containerless markers if no binding controlsDescendantBindings', function() {
          testNode.innerHTML = "Hello <!-- ko dummy: false --><span data-bind='text: \"WasBound\"'>Some text</span><!-- /ko --> Goodbye";
          ko.applyBindings(null, testNode);
          expect(testNode).toContainText("Hello WasBound Goodbye");
    });

    it('Should be able to set and access correct context in custom containerless binding', function() {
        ko.bindingHandlers.bindChildrenWithCustomContext = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var innerContext = bindingContext.createChildContext({ myCustomData: 123 });
                ko.applyBindingsToDescendants(innerContext, element);
                return { 'controlsDescendantBindings': true };
            }
        };
        ko.virtualElements.allowedBindings['bindChildrenWithCustomContext'] = true;

        testNode.innerHTML = "Hello <!-- ko bindChildrenWithCustomContext: true --><div>Some text</div><!-- /ko --> Goodbye"
        ko.applyBindings(null, testNode);

        expect(ko.dataFor(testNode.childNodes[2]).myCustomData).toEqual(123);
    });

    it('Should be able to set and access correct context in nested containerless binding', function() {
        delete ko.bindingHandlers.nonexistentHandler;
        ko.bindingHandlers.bindChildrenWithCustomContext = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var innerContext = bindingContext.createChildContext({ myCustomData: 123 });
                ko.applyBindingsToDescendants(innerContext, element);
                return { 'controlsDescendantBindings': true };
            }
        };

        testNode.innerHTML = "Hello <div data-bind='bindChildrenWithCustomContext: true'><!-- ko nonexistentHandler: 123 --><div>Some text</div><!-- /ko --></div> Goodbye"
        ko.applyBindings(null, testNode);

        expect(ko.dataFor(testNode.childNodes[1].childNodes[0]).myCustomData).toEqual(123);
        expect(ko.dataFor(testNode.childNodes[1].childNodes[1]).myCustomData).toEqual(123);
    });

    it('Should be able to access custom context variables in child context', function() {
        ko.bindingHandlers.bindChildrenWithCustomContext = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var innerContext = bindingContext.createChildContext({ myCustomData: 123 });
                innerContext.customValue = 'xyz';
                ko.applyBindingsToDescendants(innerContext, element);
                return { 'controlsDescendantBindings': true };
            }
        };

        testNode.innerHTML = "Hello <div data-bind='bindChildrenWithCustomContext: true'><!-- ko with: myCustomData --><div>Some text</div><!-- /ko --></div> Goodbye"
        ko.applyBindings(null, testNode);

        expect(ko.contextFor(testNode.childNodes[1].childNodes[0]).customValue).toEqual('xyz');
        expect(ko.dataFor(testNode.childNodes[1].childNodes[1])).toEqual(123);
        expect(ko.contextFor(testNode.childNodes[1].childNodes[1]).$parent.myCustomData).toEqual(123);
        expect(ko.contextFor(testNode.childNodes[1].childNodes[1]).$parentContext.customValue).toEqual('xyz');
    });

    it('Should not reinvoke init for notifications triggered during first evaluation', function () {
        var observable = ko.observable('A');
        var initCalls = 0;
        ko.bindingHandlers.test = {
            init: function (element, valueAccessor) {
                initCalls++;

                var value = valueAccessor();

                // Read the observable (to set up a dependency on it), and then also write to it (to trigger re-eval of bindings)
                // This logic probably wouldn't be in init but might be indirectly invoked by init
                value();
                value('B');
            }
        };
        testNode.innerHTML = "<div data-bind='test: myObservable'></div>";

        ko.applyBindings({ myObservable: observable }, testNode);
        expect(initCalls).toEqual(1);
    });

    it('Should not run update before init, even if an associated observable is updated by a different binding before init', function() {
        // Represents the "theoretical issue" posed by Ryan in comments on https://github.com/SteveSanderson/knockout/pull/193

        var observable = ko.observable('A'), hasInittedSecondBinding = false, hasUpdatedSecondBinding = false;
        ko.bindingHandlers.test1 = {
            init: function(element, valueAccessor) {
                // Read the observable (to set up a dependency on it), and then also write to it (to trigger re-eval of bindings)
                // This logic probably wouldn't be in init but might be indirectly invoked by init
                var value = valueAccessor();
                value();
                value('B');
            }
        }
        ko.bindingHandlers.test2 = {
            init: function() {
                hasInittedSecondBinding = true;
            },
            update: function() {
                if (!hasInittedSecondBinding)
                    throw new Error("Called 'update' before 'init'");
                hasUpdatedSecondBinding = true;
            }
        }
        testNode.innerHTML = "<div data-bind='test1: myObservable, test2: true'></div>";

        ko.applyBindings({ myObservable: observable }, testNode);
        expect(hasUpdatedSecondBinding).toEqual(true);
    });

    it('Should not allow multiple applyBindings calls for the same element', function() {
        testNode.innerHTML = "<div data-bind='text: \"Some Text\"'></div>";

        // First call is fine
        ko.applyBindings({}, testNode);

        // Second call throws an error
        var didThrow = false;
        try { ko.applyBindings({}, testNode); }
        catch (ex) {
            didThrow = true;
            expect(ex.message).toEqual("You cannot apply bindings multiple times to the same element.");
        }
        if (!didThrow)
            throw new Error("Did not prevent multiple applyBindings calls");
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
});
