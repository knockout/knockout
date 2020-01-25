describe('Binding: If', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should remove descendant nodes from the document (and not bind them) if the value is falsy', function() {
        testNode.innerHTML = "<div data-bind='if: someItem'><span data-bind='text: someItem.nonExistentChildProp'></span></div>";
        expect(testNode.childNodes[0].childNodes.length).toEqual(1);
        ko.applyBindings({ someItem: null }, testNode);
        expect(testNode.childNodes[0].childNodes.length).toEqual(0);
    });

    it('Should leave descendant nodes in the document (and bind them) if the value is truthy, independently of the active template engine', function() {
        this.after(function() { ko.setTemplateEngine(new ko.nativeTemplateEngine()); });

        ko.setTemplateEngine(new ko.templateEngine()); // This template engine will just throw errors if you try to use it
        testNode.innerHTML = "<div data-bind='if: someItem'><span data-bind='text: someItem.existentChildProp'></span></div>";
        expect(testNode.childNodes.length).toEqual(1);
        ko.applyBindings({ someItem: { existentChildProp: 'Child prop value' } }, testNode);
        expect(testNode.childNodes[0].childNodes.length).toEqual(1);
        expect(testNode.childNodes[0].childNodes[0]).toContainText("Child prop value");
    });

    it('Should leave descendant nodes unchanged if the value is truthy and remains truthy when changed', function() {
        var someItem = ko.observable(true);
        testNode.innerHTML = "<div data-bind='if: someItem'><span data-bind='text: (++counter)'></span></div>";
        var originalNode = testNode.childNodes[0].childNodes[0];

        // Value is initially true, so nodes are retained
        ko.applyBindings({ someItem: someItem, counter: 0 }, testNode);
        expect(testNode.childNodes[0].childNodes[0].tagName.toLowerCase()).toEqual("span");
        expect(testNode.childNodes[0].childNodes[0]).toEqual(originalNode);
        expect(testNode).toContainText("1");

        // Change the value to a different truthy value; see the previous SPAN remains
        someItem('different truthy value');
        expect(testNode.childNodes[0].childNodes[0].tagName.toLowerCase()).toEqual("span");
        expect(testNode.childNodes[0].childNodes[0]).toEqual(originalNode);
        expect(testNode).toContainText("1");
    });

    it('Should toggle the presence and bindedness of descendant nodes according to the truthiness of the value', function() {
        var someItem = ko.observable(undefined);
        testNode.innerHTML = "<div data-bind='if: someItem'><span data-bind='text: someItem().occasionallyExistentChildProp'></span></div>";
        ko.applyBindings({ someItem: someItem }, testNode);

        // First it's not there
        expect(testNode.childNodes[0].childNodes.length).toEqual(0);

        // Then it's there
        someItem({ occasionallyExistentChildProp: 'Child prop value' });
        expect(testNode.childNodes[0].childNodes.length).toEqual(1);
        expect(testNode.childNodes[0].childNodes[0]).toContainText("Child prop value");

        // Then it's gone again
        someItem(null);
        expect(testNode.childNodes[0].childNodes.length).toEqual(0);
    });

    it('Should not interfere with binding context', function() {
        testNode.innerHTML = "<div data-bind='if: true'>Parents: <span data-bind='text: $parents.length'></span></div>";
        ko.applyBindings({ }, testNode);
        expect(testNode.childNodes[0]).toContainText("Parents: 0");
        expect(ko.contextFor(testNode.childNodes[0].childNodes[1]).$parents.length).toEqual(0);
    });

    it('Should update descendant bindings when observable viewmodel changes', function() {
        var vm = ko.observable({ someItem: "first value" });
        testNode.innerHTML = "<div data-bind='if: true'><span data-bind='text: someItem'></span></div>";
        ko.applyBindings(vm, testNode);
        expect(testNode.childNodes[0]).toContainText("first value");

        vm({someItem: "second value"});
        expect(testNode.childNodes[0]).toContainText("second value");
    });

    it('Should be able to define an \"if\" region using a containerless template', function() {
        var someitem = ko.observable(undefined);
        testNode.innerHTML = "hello <!-- ko if: someitem --><span data-bind=\"text: someitem().occasionallyexistentchildprop\"></span><!-- /ko --> goodbye";
        ko.applyBindings({ someitem: someitem }, testNode);

        // First it's not there
        expect(testNode).toContainHtml("hello <!-- ko if: someitem --><!-- /ko --> goodbye");

        // Then it's there
        someitem({ occasionallyexistentchildprop: 'child prop value' });
        expect(testNode).toContainHtml("hello <!-- ko if: someitem --><span data-bind=\"text: someitem().occasionallyexistentchildprop\">child prop value</span><!-- /ko --> goodbye");

        // Then it's gone again
        someitem(null);
        expect(testNode).toContainHtml("hello <!-- ko if: someitem --><!-- /ko --> goodbye");
    });

    it('Should be able to nest \"if\" regions defined by containerless templates', function() {
        var condition1 = ko.observable(false);
        var condition2 = ko.observable(false);
        testNode.innerHTML = "hello <!-- ko if: condition1 -->First is true<!-- ko if: condition2 -->Both are true<!-- /ko --><!-- /ko -->";
        ko.applyBindings({ condition1: condition1, condition2: condition2 }, testNode);

        // First neither are there
        expect(testNode).toContainHtml("hello <!-- ko if: condition1 --><!-- /ko -->");

        // Make outer appear
        condition1(true);
        expect(testNode).toContainHtml("hello <!-- ko if: condition1 -->first is true<!-- ko if: condition2 --><!-- /ko --><!-- /ko -->");

        // Make inner appear
        condition2(true);
        expect(testNode).toContainHtml("hello <!-- ko if: condition1 -->first is true<!-- ko if: condition2 -->both are true<!-- /ko --><!-- /ko -->");
    });

    it('Should call a childrenComplete callback function', function () {
        testNode.innerHTML = "<div data-bind='if: condition, childrenComplete: callback'><span data-bind='text: someText'></span></div>";
        var callbacks = 0;
        var viewModel = { condition: ko.observable(true), someText: "hello", callback: function () { callbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('hello');

        viewModel.condition(false);
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('');

        viewModel.condition(true);
        expect(callbacks).toEqual(2);
        expect(testNode).toContainText('hello');
    });

    it('Should call a descendantsComplete callback function', function () {
        testNode.innerHTML = "<div data-bind='if: condition, descendantsComplete: callback'><span data-bind='text: someText'></span></div>";
        var callbacks = 0;
        var viewModel = { condition: ko.observable(false), someText: "hello", callback: function () { callbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('');

        viewModel.condition(true);
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('hello');
    });

    it('Should call a descendantsComplete callback function each time the binding switches between false and true', function () {
        testNode.innerHTML = "<div data-bind='if: condition, descendantsComplete: callback'><span data-bind='text: someText'></span></div>";
        var callbacks = 0;
        var viewModel = { condition: ko.observable(false), someText: "hello", callback: function () { callbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('');

        viewModel.condition(true);
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('hello');

        viewModel.condition(false);
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('');

        viewModel.condition(true);
        expect(callbacks).toEqual(2);
        expect(testNode).toContainText('hello');

        // Should not call if value remains truthy (no re-render)
        viewModel.condition(1);
        expect(callbacks).toEqual(2);
        expect(testNode).toContainText('hello');
    });

    it('Should call a descendantsComplete callback function after nested \"if\" binding with completeOn: \"render\" is complete', function () {
        testNode.innerHTML = "<div data-bind='if: outerCondition, descendantsComplete: callback'><div data-bind='if: innerCondition, completeOn: \"render\"'><span data-bind='text: someText'></span></div></div>";
        var callbacks = 0;
        var viewModel = { outerCondition: ko.observable(false), innerCondition: ko.observable(false), someText: "hello", callback: function () { callbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('');

        // Complete the outer condition first and then the inner one
        viewModel.outerCondition(true);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('');

        viewModel.innerCondition(true);
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('hello');
    });

    it('Should call a descendantsComplete callback function after nested \"if\" binding with completeOn: \"render\" is complete using a containerless template', function () {
        testNode.innerHTML = "xx<!-- ko if: outerCondition, descendantsComplete: callback --><!-- ko if: innerCondition, completeOn: \"render\" --><span data-bind='text: someText'></span><!--/ko--><!--/ko-->";
        var callbacks = 0;
        var viewModel = { outerCondition: ko.observable(false), innerCondition: ko.observable(false), someText: "hello", callback: function () { callbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('xx');

        // Complete the outer condition first and then the inner one
        viewModel.outerCondition(true);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('xx');

        viewModel.innerCondition(true);
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('xxhello');
    });

    it('Should call a descendantsComplete callback function when nested \"if\" binding with completeOn: \"render\" is complete', function () {
        testNode.innerHTML = "<div data-bind='if: outerCondition, descendantsComplete: callback'><div data-bind='if: innerCondition, completeOn: \"render\"'><span data-bind='text: someText'></span></div></div>";
        var callbacks = 0;
        var viewModel = { outerCondition: ko.observable(false), innerCondition: ko.observable(false), someText: "hello", callback: function () { callbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('');

        // Complete the inner condition first and then the outer one (reverse order from previous test)
        viewModel.innerCondition(true);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('');

        viewModel.outerCondition(true);
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('hello');
    });

    it('Should not delay descendantsComplete callback if nested \"if\" binding also has descendantsComplete', function () {
        testNode.innerHTML = "<div data-bind='if: outerCondition, descendantsComplete: outerCallback'><div data-bind='if: innerCondition, descendantsComplete: innerCallback'><span data-bind='text: someText'></span></div></div>";
        var outerCallbacks = 0, innerCallbacks = 0;
        var viewModel = {
            outerCondition: ko.observable(false),
            innerCondition: ko.observable(false),
            someText: "hello",
            outerCallback: function () { outerCallbacks++; },
            innerCallback: function () { innerCallbacks++; }
        };

        ko.applyBindings(viewModel, testNode);
        expect(outerCallbacks).toEqual(0);
        expect(innerCallbacks).toEqual(0);
        expect(testNode).toContainText('');

        // Callback is called when content is rendered
        viewModel.outerCondition(true);
        expect(outerCallbacks).toEqual(1);
        expect(innerCallbacks).toEqual(0);
        expect(testNode).toContainText('');

        // Rendering inner content doesn't affect outer callback
        viewModel.innerCondition(true);
        expect(outerCallbacks).toEqual(1);
        expect(innerCallbacks).toEqual(1);
        expect(testNode).toContainText('hello');
    });

    it('Should call a descendantsComplete callback function if nested \"if\" binding with completeOn: \"render\" is disposed before completion', function () {
        testNode.innerHTML = "<div data-bind='if: outerCondition, descendantsComplete: callback'><div data-bind='if: innerCondition, completeOn: \"render\"'><span data-bind='text: someText'></span></div></div>";
        var callbacks = 0;
        var viewModel = { outerCondition: ko.observable(false), innerCondition: ko.observable(false), someText: "hello", callback: function () { callbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('');

        // Complete the outer condition and then dispose the inner one
        viewModel.outerCondition(true);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('');

        ko.cleanNode(testNode.childNodes[0].childNodes[0]);
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('');
    });
});
