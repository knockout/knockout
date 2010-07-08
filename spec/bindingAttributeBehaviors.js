/// <reference path="../src/bindingAttributeSyntax.js" />

describe('Binding attribute syntax', {
    before_each: function () {
        var existingNode = document.getElementById("testNode");
        if (existingNode != null)
            existingNode.parentNode.removeChild(existingNode);
        testNode = document.createElement("div");
        testNode.id = "testNode";
        document.body.appendChild(testNode);
    },

    'Should tolerate whitespace and nonexistent handlers': function () {
        testNode.innerHTML = "<div data-bind=' nonexistentHandler : \"Hello\" '></div>";
        ko.applyBindings(testNode); // No exception means success
    },

    'Should tolerate arbitrary literals as the values for a handler': function () {
        testNode.innerHTML = "<div data-bind='stringLiteral: \"hello\", numberLiteral: 123, boolLiteral: true, objectLiteral: {}, functionLiteral: function() { }'></div>";
        ko.applyBindings(testNode); // No exception means success
    },

    'Should invoke registered handlers\' init() then update() methods passing binding data': function () {
        var methodsInvoked = [];
        ko.bindingHandlers.test = {
            init: function (element, value, allBindings) {
                methodsInvoked.push("init");
                value_of(element.id).should_be("testElement");
                value_of(value).should_be("Hello");
                value_of(allBindings.another).should_be(123);
            },
            update: function (element, value, allBindings) {
                methodsInvoked.push("update");
                value_of(element.id).should_be("testElement");
                value_of(value).should_be("Hello");
                value_of(allBindings.another).should_be(123);
            }
        }
        testNode.innerHTML = "<div id='testElement' data-bind='test:\"Hello\", another:123'></div>";
        ko.applyBindings(testNode);
        value_of(methodsInvoked.length).should_be(2);
        value_of(methodsInvoked[0]).should_be("init");
        value_of(methodsInvoked[1]).should_be("update");
    },

    'If the binding handler depends on an observable, invokes the init handler once and the update handler whenever a new value is available': function () {
        var observable = new ko.observable();
        var initPassedValues = [], updatePassedValues = [];
        ko.bindingHandlers.test = {
            init: function (element, observableValue) { initPassedValues.push(observableValue()); },
            update: function (element, observableValue) { updatePassedValues.push(observableValue()); }
        };
        testNode.innerHTML = "<div data-bind='test: myObservable'></div>";

        ko.applyBindings(testNode, { myObservable: observable });
        value_of(initPassedValues.length).should_be(1);
        value_of(updatePassedValues.length).should_be(1);
        value_of(initPassedValues[0]).should_be(undefined);
        value_of(updatePassedValues[0]).should_be(undefined);

        observable("A");
        value_of(initPassedValues.length).should_be(1);
        value_of(updatePassedValues.length).should_be(2);
        value_of(updatePassedValues[1]).should_be("A");
    },

    'If the associated DOM element was removed, handler subscriptions are disposed': function () {
        var observable = new ko.observable("A");
        var passedValues = [];
        ko.bindingHandlers.test = { update: function (element, value) { passedValues.push(value); } };
        testNode.innerHTML = "<div data-bind='test: myObservable()'></div>";

        ko.applyBindings(testNode, { myObservable: observable });
        observable("B");
        value_of(passedValues.length).should_be(2);

        testNode.parentNode.removeChild(testNode);
        observable("C");
        value_of(passedValues.length).should_be(2);
    },

    'If the binding attribute involves an observable, re-invokes the bindings if the observable notifies a change': function () {
        var observable = new ko.observable({ message: "hello" });
        var passedValues = [];
        ko.bindingHandlers.test = { update: function (element, value) { passedValues.push(value); } };
        testNode.innerHTML = "<div data-bind='test: myObservable().message'></div>";

        ko.applyBindings(testNode, { myObservable: observable });
        value_of(passedValues.length).should_be(1);
        value_of(passedValues[0]).should_be("hello");

        observable({ message: "goodbye" });
        value_of(passedValues.length).should_be(2);
        value_of(passedValues[1]).should_be("goodbye");
    }
})