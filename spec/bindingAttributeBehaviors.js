
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
    
    'Should use supplied viewModel as "this" when evaluating binding attribute': function() {
        var initValue, updateValue;
        ko.bindingHandlers.test = {
            init: function (element, valueAccessor) { initValue = valueAccessor() },
            update: function (element, valueAccessor) { updateValue = valueAccessor() }
        };    	
        testNode.innerHTML = "<div data-bind='test: this.someProp'></div>";
        ko.applyBindings({ someProp: 123 }, testNode);
        value_of(initValue).should_be(123);
        value_of(updateValue).should_be(123);
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
    
    'Should provide a separate datastore to each binding on each node': function() {
        var acceptedValues = [];
        ko.bindingHandlers.test1 = {
            init: function (element, valueAccessor, allBindings, viewModel, options) { options.dataStore.myValue = valueAccessor() },
            update: function (element, valueAccessor, allBindings, viewModel, options) { value_of(options.dataStore.myValue).should_be(valueAccessor()); acceptedValues.push(valueAccessor()); }
        };    	
        ko.bindingHandlers.test2 = ko.bindingHandlers.test1;
        testNode.innerHTML = "<div data-bind='test1: 123, test2: 456'></div><div data-bind='test1: 789'></div>";
        ko.applyBindings(null, testNode);
        acceptedValues.sort();
        value_of(acceptedValues[0]).should_be(123);
        value_of(acceptedValues[1]).should_be(456);
        value_of(acceptedValues[2]).should_be(789);
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
    
    'Should be able to supply an additional scope variable whose properties are accessible in binding attributes': function() {
        testNode.innerHTML = "<div data-bind='text: someExtraScopeValue'></div><div data-bind='text: myViewModelProperty'></div>"
        var additionalScope = { someExtraScopeValue: 'scopePropVal' };
        ko.applyBindings({ myViewModelProperty: 'viewModelPropVal' }, testNode, { extraScope: additionalScope });
        
        value_of(testNode.childNodes[1].innerHTML).should_be('viewModelPropVal');
        value_of(testNode.childNodes[0].innerHTML).should_be('scopePropVal');
    },
    
    'Should use properties on the view model in preference to properties on the additional scope object': function() {
        testNode.innerHTML = "<div data-bind='text: viewModelProp'></div><div data-bind='text: sharedProp'></div><div data-bind='text: additionalProp'></div>"
        var additionalScope = { additionalProp: 'additionalPropVal', sharedProp: 'valueFromAdditionalScope' };
        var viewModel =       { viewModelProp:  'viewModelPropVal',  sharedProp: 'valueFromViewModel' };
        ko.applyBindings(viewModel, testNode, { extraScope: additionalScope });
        
        value_of(testNode.childNodes[0].innerHTML).should_be('viewModelPropVal');
        value_of(testNode.childNodes[1].innerHTML).should_be('valueFromViewModel');
        value_of(testNode.childNodes[2].innerHTML).should_be('additionalPropVal');
    }    
})