
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
    }
})