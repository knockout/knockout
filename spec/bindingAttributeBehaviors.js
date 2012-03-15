describe('Binding attribute syntax', {
    before_each: function () {
        var existingNode = document.getElementById("testNode");
        if (existingNode != null)
            existingNode.parentNode.removeChild(existingNode);
        testNode = document.createElement("div");
        testNode.id = "testNode";
        document.body.appendChild(testNode);
    },
    
    'applyBindings should accept no parameters and then act on document.body with undefined model': function() {
        var didInit = false;
        ko.bindingHandlers.test = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
                value_of(element.id).should_be("testElement");
                value_of(viewModel).should_be(undefined);
                didInit = true;
            }
        };
        testNode.innerHTML = "<div id='testElement' data-bind='test:123'></div>";
        ko.applyBindings();
        value_of(didInit).should_be(true);

        // Just to avoid interfering with other specs:
        ko.utils.domData.clear(document.body);        
    },

    'applyBindings should accept one parameter and then act on document.body with parameter as model': function() {
        var didInit = false;
        var suppliedViewModel = {};
        ko.bindingHandlers.test = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
                value_of(element.id).should_be("testElement");
                value_of(viewModel).should_be(suppliedViewModel);
                didInit = true;
            }
        };
        testNode.innerHTML = "<div id='testElement' data-bind='test:123'></div>";
        ko.applyBindings(suppliedViewModel);
        value_of(didInit).should_be(true);

        // Just to avoid interfering with other specs:
        ko.utils.domData.clear(document.body);
    },
    
    'applyBindings should accept two parameters and then act on second param as DOM node with first param as model': function() {
        var didInit = false;
        var suppliedViewModel = {};
        ko.bindingHandlers.test = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
                value_of(element.id).should_be("testElement");
                value_of(viewModel).should_be(suppliedViewModel);
                didInit = true;
            }
        };
        testNode.innerHTML = "<div id='testElement' data-bind='test:123'></div>";
        var shouldNotMatchNode = document.createElement("DIV");
        shouldNotMatchNode.innerHTML = "<div id='shouldNotMatchThisElement' data-bind='test:123'></div>";
        document.body.appendChild(shouldNotMatchNode);
        try {
            ko.applyBindings(suppliedViewModel, testNode);
            value_of(didInit).should_be(true);    	
        } finally {
            shouldNotMatchNode.parentNode.removeChild(shouldNotMatchNode);
        }
    },

    'Should tolerate whitespace and nonexistent handlers': function () {
        testNode.innerHTML = "<div data-bind=' nonexistentHandler : \"Hello\" '></div>";
        ko.applyBindings(null, testNode); // No exception means success
    },

    'Should tolerate arbitrary literals as the values for a handler': function () {
        testNode.innerHTML = "<div data-bind='stringLiteral: \"hello\", numberLiteral: 123, boolLiteral: true, objectLiteral: {}, functionLiteral: function() { }'></div>";
        ko.applyBindings(null, testNode); // No exception means success
    },

    'Should tolerate wacky IE conditional comments': function() {
        // Represents issue https://github.com/SteveSanderson/knockout/issues/186. Would fail on IE9, but work on earlier IE versions.
        testNode.innerHTML = "<div><!--[if IE]><!-->Hello<!--<![endif]--></div>";
        ko.applyBindings(null, testNode); // No exception means success          
    },

    'Should invoke registered handlers\' init() then update() methods passing binding data': function () {
        var methodsInvoked = [];
        ko.bindingHandlers.test = {
            init: function (element, valueAccessor, allBindingsAccessor) {
                methodsInvoked.push("init");
                value_of(element.id).should_be("testElement");
                value_of(valueAccessor()).should_be("Hello");
                value_of(allBindingsAccessor().another).should_be(123);
            },
            update: function (element, valueAccessor, allBindingsAccessor) {
                methodsInvoked.push("update");
                value_of(element.id).should_be("testElement");
                value_of(valueAccessor()).should_be("Hello");
                value_of(allBindingsAccessor().another).should_be(123);
            }
        }
        testNode.innerHTML = "<div id='testElement' data-bind='test:\"Hello\", another:123'></div>";
        ko.applyBindings(null, testNode);
        value_of(methodsInvoked.length).should_be(2);
        value_of(methodsInvoked[0]).should_be("init");
        value_of(methodsInvoked[1]).should_be("update");
    },

    'If the binding handler depends on an observable, invokes the init handler once and the update handler whenever a new value is available': function () {
        var observable = new ko.observable();
        var initPassedValues = [], updatePassedValues = [];
        ko.bindingHandlers.test = {
            init: function (element, valueAccessor) { initPassedValues.push(valueAccessor()()); },
            update: function (element, valueAccessor) { updatePassedValues.push(valueAccessor()()); }
        };
        testNode.innerHTML = "<div data-bind='test: myObservable'></div>";

        ko.applyBindings({ myObservable: observable }, testNode);
        value_of(initPassedValues.length).should_be(1);
        value_of(updatePassedValues.length).should_be(1);
        value_of(initPassedValues[0]).should_be(undefined);
        value_of(updatePassedValues[0]).should_be(undefined);

        observable("A");
        value_of(initPassedValues.length).should_be(1);
        value_of(updatePassedValues.length).should_be(2);
        value_of(updatePassedValues[1]).should_be("A");
    },

    'If the associated DOM element was removed by KO, handler subscriptions are disposed immediately': function () {
        var observable = new ko.observable("A");
        testNode.innerHTML = "<div data-bind='anyHandler: myObservable()'></div>";
        ko.applyBindings({ myObservable: observable }, testNode);
        
        value_of(observable.getSubscriptionsCount()).should_be(1);
        
        ko.removeNode(testNode);
        
        value_of(observable.getSubscriptionsCount()).should_be(0);
    },

    'If the associated DOM element was removed independently of KO, handler subscriptions are disposed on the next evaluation': function () {
        var observable = new ko.observable("A");
        testNode.innerHTML = "<div data-bind='anyHandler: myObservable()'></div>";
        ko.applyBindings({ myObservable: observable }, testNode);
        
        value_of(observable.getSubscriptionsCount()).should_be(1);
        
        testNode.parentNode.removeChild(testNode);
        observable("B"); // Force re-evaluation
        
        value_of(observable.getSubscriptionsCount()).should_be(0);
    },

    'If the binding attribute involves an observable, re-invokes the bindings if the observable notifies a change': function () {
        var observable = new ko.observable({ message: "hello" });
        var passedValues = [];
        ko.bindingHandlers.test = { update: function (element, valueAccessor) { passedValues.push(valueAccessor()); } };
        testNode.innerHTML = "<div data-bind='test: myObservable().message'></div>";

        ko.applyBindings({ myObservable: observable }, testNode);
        value_of(passedValues.length).should_be(1);
        value_of(passedValues[0]).should_be("hello");

        observable({ message: "goodbye" });
        value_of(passedValues.length).should_be(2);
        value_of(passedValues[1]).should_be("goodbye");
    },
    
    'Should be able to refer to the bound object itself (at the root scope, the viewmodel) via $data': function() {
        testNode.innerHTML = "<div data-bind='text: $data.someProp'></div>";
        ko.applyBindings({ someProp: 'My prop value' }, testNode);
        value_of(testNode).should_contain_text("My prop value");
    },
    
    'Bindings can signal that they control descendant bindings by returning a flag from their init function': function() {
        ko.bindingHandlers.test = {  
            init: function() { return { controlsDescendantBindings : true } }
        };
        testNode.innerHTML = "<div data-bind='test: true'>"
                           +     "<div data-bind='text: 123'>456</div>"
                           + "</div>"
                           + "<div data-bind='text: 123'>456</div>";
        ko.applyBindings(null, testNode);
        
        value_of(testNode.childNodes[0].childNodes[0].innerHTML).should_be("456");
        value_of(testNode.childNodes[1].innerHTML).should_be("123");
    },
    
    'Should not be allowed to have multiple bindings on the same element that claim to control descendant bindings': function() {
        ko.bindingHandlers.test1 = {  
            init: function() { return { controlsDescendantBindings : true } }
        };
        ko.bindingHandlers.test2 = ko.bindingHandlers.test1;
        testNode.innerHTML = "<div data-bind='test1: true, test2: true'></div>"
        var didThrow = false;
        
        try { ko.applyBindings(null, testNode) }
        catch(ex) { didThrow = true; value_of(ex.message).should_contain('Multiple bindings (test1 and test2) are trying to control descendant bindings of the same element.') }
        value_of(didThrow).should_be(true);
    },
    
    'Should use properties on the view model in preference to properties on the binding context': function() {
        testNode.innerHTML = "<div data-bind='text: $data.someProp'></div>";
        ko.applyBindings({ '$data': { someProp: 'Inner value'}, someProp: 'Outer value' }, testNode);
        value_of(testNode).should_contain_text("Inner value");
    },

    'Should be able to extend a binding context, adding new custom properties, without mutating the original binding context': function() {
        ko.bindingHandlers.addCustomProperty = {
            init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                ko.applyBindingsToDescendants(bindingContext.extend({ '$customProp': 'my value' }), element);
                return { controlsDescendantBindings : true };
            }
        };
        testNode.innerHTML = "<div data-bind='with: sub'><div data-bind='addCustomProperty: true'><div data-bind='text: $customProp'></div></div></div>";
        var vm = { sub: {} };
        ko.applyBindings(vm, testNode);
        value_of(testNode).should_contain_text("my value");
        value_of(ko.contextFor(testNode.childNodes[0].childNodes[0].childNodes[0]).$customProp).should_be("my value");
        value_of(ko.contextFor(testNode.childNodes[0].childNodes[0]).$customProp).should_be(undefined); // Should not affect original binding context

        // vale of $data and $parent should be unchanged in extended context
        value_of(ko.contextFor(testNode.childNodes[0].childNodes[0].childNodes[0]).$data).should_be(vm.sub);
        value_of(ko.contextFor(testNode.childNodes[0].childNodes[0].childNodes[0]).$parent).should_be(vm);
    },

    'Binding contexts should inherit any custom properties from ancestor binding contexts': function() {
        ko.bindingHandlers.addCustomProperty = {
            init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                ko.applyBindingsToDescendants(bindingContext.extend({ '$customProp': 'my value' }), element);
                return { controlsDescendantBindings : true };
            }
        };
        testNode.innerHTML = "<div data-bind='addCustomProperty: true'><div data-bind='with: true'><div data-bind='text: $customProp'></div></div></div>";
        ko.applyBindings(null, testNode);
        value_of(testNode).should_contain_text("my value");
    },
    
    'Should be able to retrieve the binding context associated with any node': function() {
        testNode.innerHTML = "<div><div data-bind='text: name'></div></div>";
        ko.applyBindings({ name: 'Bert' }, testNode.childNodes[0]);

        value_of(testNode.childNodes[0].childNodes[0]).should_contain_text("Bert");

        // Can't get binding context for unbound nodes
        value_of(ko.dataFor(testNode)).should_be(undefined);
        value_of(ko.contextFor(testNode)).should_be(undefined);

        // Can get binding context for directly bound nodes
        value_of(ko.dataFor(testNode.childNodes[0]).name).should_be("Bert");
        value_of(ko.contextFor(testNode.childNodes[0]).$data.name).should_be("Bert");

        // Can get binding context for descendants of directly bound nodes
        value_of(ko.dataFor(testNode.childNodes[0].childNodes[0]).name).should_be("Bert");
        value_of(ko.contextFor(testNode.childNodes[0].childNodes[0]).$data.name).should_be("Bert");
    },
    
    'Should not be allowed to use containerless binding syntax for bindings other than whitelisted ones': function() {
        testNode.innerHTML = "Hello <!-- ko visible: false -->Some text<!-- /ko --> Goodbye"
        var didThrow = false;
        try {
            ko.applyBindings(null, testNode);
        } catch(ex) {
            didThrow = true;
            value_of(ex.message).should_be("The binding 'visible' cannot be used with virtual elements");
        }
        value_of(didThrow).should_be(true);
    },
    
    'Should be able to set a custom binding to use containerless binding': function() {
        var initCalls = 0;
        ko.bindingHandlers.test = { init: function () { initCalls++ } };
        ko.virtualElements.allowedBindings['test'] = true;

        testNode.innerHTML = "Hello <!-- ko test: false -->Some text<!-- /ko --> Goodbye"
        ko.applyBindings(null, testNode);

        value_of(initCalls).should_be(1);
        value_of(testNode).should_contain_text("Hello Some text Goodbye");
    },
    
    'Should be able to access virtual children in custom containerless binding': function() {
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

        value_of(countNodes).should_be(1);
        value_of(testNode).should_contain_text("Hello new text Goodbye");
    },
    
    'Should only bind containerless binding once inside template': function() {
        var initCalls = 0;
        ko.bindingHandlers.test = { init: function () { initCalls++ } };
        ko.virtualElements.allowedBindings['test'] = true;
        
        testNode.innerHTML = "Hello <!-- ko if: true --><!-- ko test: false -->Some text<!-- /ko --><!-- /ko --> Goodbye"
        ko.applyBindings(null, testNode);

        value_of(initCalls).should_be(1);
        value_of(testNode).should_contain_text("Hello Some text Goodbye");
    },

    'Should automatically bind virtual descendants of containerless markers if no binding controlsDescendantBindings': function() {
          testNode.innerHTML = "Hello <!-- ko dummy: false --><span data-bind='text: \"WasBound\"'>Some text</span><!-- /ko --> Goodbye";
          ko.applyBindings(null, testNode);
          value_of(testNode).should_contain_text("Hello WasBound Goodbye");
    },
    
    'Should be able to set and access correct context in custom containerless binding': function() {
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

        value_of(ko.dataFor(testNode.childNodes[2]).myCustomData).should_be(123);
    },
    
    'Should be able to set and access correct context in nested containerless binding': function() {
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

        value_of(ko.dataFor(testNode.childNodes[1].childNodes[0]).myCustomData).should_be(123);
        value_of(ko.dataFor(testNode.childNodes[1].childNodes[1]).myCustomData).should_be(123);
    },
    
    'Should be able to access custom context variables in child context': function() {
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

        value_of(ko.contextFor(testNode.childNodes[1].childNodes[0]).customValue).should_be('xyz');
        value_of(ko.dataFor(testNode.childNodes[1].childNodes[1])).should_be(123);
        value_of(ko.contextFor(testNode.childNodes[1].childNodes[1]).$parent.myCustomData).should_be(123);
        value_of(ko.contextFor(testNode.childNodes[1].childNodes[1]).$parentContext.customValue).should_be('xyz');
    },
    
    'Should not reinvoke init for notifications triggered during first evaluation': function () {
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
        value_of(initCalls).should_be(1);
    },

    'Should not run update before init, even if an associated observable is updated by a different binding before init': function() {
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
        value_of(hasUpdatedSecondBinding).should_be(true);
    }
});