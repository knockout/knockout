describe('Binding: Ifnot', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should remove descendant nodes from the document (and not bind them) if the value is truey', function() {
        testNode.innerHTML = "<div data-bind='ifnot: condition'><span data-bind='text: someItem.nonExistentChildProp'></span></div>";
        expect(testNode.childNodes[0].childNodes.length).toEqual(1);
        ko.applyBindings({ someItem: null, condition: true }, testNode);
        expect(testNode.childNodes[0].childNodes.length).toEqual(0);
    });

    it('Should leave descendant nodes in the document (and bind them) if the value is falsy, independently of the active template engine', function() {
        this.after(function() { ko.setTemplateEngine(new ko.nativeTemplateEngine()); });

        ko.setTemplateEngine(new ko.templateEngine()); // This template engine will just throw errors if you try to use it
        testNode.innerHTML = "<div data-bind='ifnot: condition'><span data-bind='text: someItem.existentChildProp'></span></div>";
        expect(testNode.childNodes.length).toEqual(1);
        ko.applyBindings({ someItem: { existentChildProp: 'Child prop value' }, condition: false }, testNode);
        expect(testNode.childNodes[0].childNodes.length).toEqual(1);
        expect(testNode.childNodes[0].childNodes[0]).toContainText("Child prop value");
    });

    it('Should leave descendant nodes unchanged if the value is falsy and remains falsy when changed', function() {
        var someItem = ko.observable(false);
        testNode.innerHTML = "<div data-bind='ifnot: someItem'><span data-bind='text: someItem()'></span></div>";
        var originalNode = testNode.childNodes[0].childNodes[0];

        // Value is initially true, so nodes are retained
        ko.applyBindings({ someItem: someItem }, testNode);
        expect(testNode.childNodes[0].childNodes[0]).toContainText("false");
        expect(testNode.childNodes[0].childNodes[0]).toEqual(originalNode);

        // Change the value to a different falsy value
        someItem(0);
        expect(testNode.childNodes[0].childNodes[0]).toContainText("0");
        expect(testNode.childNodes[0].childNodes[0]).toEqual(originalNode);
    });

    it('Should toggle the presence and bindedness of descendant nodes according to the falsiness of the value', function() {
        var someItem = ko.observable(undefined);
        var condition = ko.observable(true);
        testNode.innerHTML = "<div data-bind='ifnot: condition'><span data-bind='text: someItem().occasionallyExistentChildProp'></span></div>";
        ko.applyBindings({ someItem: someItem, condition: condition }, testNode);

        // First it's not there
        expect(testNode.childNodes[0].childNodes.length).toEqual(0);

        // Then it's there
        someItem({ occasionallyExistentChildProp: 'Child prop value' });
        condition(false);
        expect(testNode.childNodes[0].childNodes.length).toEqual(1);
        expect(testNode.childNodes[0].childNodes[0]).toContainText("Child prop value");

        // Then it's gone again
        condition(true);
        someItem(null);
        expect(testNode.childNodes[0].childNodes.length).toEqual(0);
    });

    it('Should not interfere with binding context', function() {
        testNode.innerHTML = "<div data-bind='ifnot: false'>Parents: <span data-bind='text: $parents.length'></span></div>";
        ko.applyBindings({ }, testNode);
        expect(testNode.childNodes[0]).toContainText("Parents: 0");
        expect(ko.contextFor(testNode.childNodes[0].childNodes[1]).$parents.length).toEqual(0);
    });

    it('Should call a childrenComplete callback function', function () {
        testNode.innerHTML = "<div data-bind='ifnot: condition, childrenComplete: callback'><span data-bind='text: someText'></span></div>";
        var callbacks = 0;
        var viewModel = { condition: ko.observable(false), someText: "hello", callback: function () { callbacks++; } };
        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('hello');

        viewModel.condition(true);
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('');

        viewModel.condition(false);
        expect(callbacks).toEqual(2);
        expect(testNode).toContainText('hello');
    });

    it('Should call a descendantsComplete callback function', function () {
        testNode.innerHTML = "<div data-bind='ifnot: condition, descendantsComplete: callback'><span data-bind='text: someText'></span></div>";
        var callbacks = 0;
        var viewModel = { condition: ko.observable(true), someText: "hello", callback: function () { callbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('');

        viewModel.condition(false);
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('hello');
    });

    it('Should call a descendantsComplete callback function each time the binding switches between false and true', function () {
        testNode.innerHTML = "<div data-bind='ifnot: condition, descendantsComplete: callback'><span data-bind='text: someText'></span></div>";
        var callbacks = 0;
        var viewModel = { condition: ko.observable(true), someText: "hello", callback: function () { callbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('');

        viewModel.condition(false);
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('hello');

        viewModel.condition(true);
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('');

        viewModel.condition(false);
        expect(callbacks).toEqual(2);
        expect(testNode).toContainText('hello');

        // Should not call if value remains falsy (no re-render)
        viewModel.condition('');
        expect(callbacks).toEqual(2);
        expect(testNode).toContainText('hello');
    });

    it('Should call a descendantsComplete callback function after nested \"ifno\" binding with completeOn: \"render\" is complete', function () {
        testNode.innerHTML = "<div data-bind='ifnot: outerCondition, descendantsComplete: callback'><div data-bind='ifnot: innerCondition, completeOn: \"render\"'><span data-bind='text: someText'></span></div></div>";
        var callbacks = 0;
        var viewModel = { outerCondition: ko.observable(true), innerCondition: ko.observable(true), someText: "hello", callback: function () { callbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('');

        // Complete the outer condition first and then the inner one
        viewModel.outerCondition(false);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('');

        viewModel.innerCondition(false);
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('hello');
    });

    it('Should call a descendantsComplete callback function after nested \"ifnot\" binding with completeOn: \"render\" is complete using a containerless template', function () {
        testNode.innerHTML = "xx<!-- ko ifnot: outerCondition, descendantsComplete: callback --><!-- ko ifnot: innerCondition, completeOn: \"render\" --><span data-bind='text: someText'></span><!--/ko--><!--/ko-->";
        var callbacks = 0;
        var viewModel = { outerCondition: ko.observable(true), innerCondition: ko.observable(true), someText: "hello", callback: function () { callbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('xx');

        // Complete the outer condition first and then the inner one
        viewModel.outerCondition(false);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('xx');

        viewModel.innerCondition(false);
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('xxhello');
    });

    it('Should call a descendantsComplete callback function when nested \"ifnot\" binding with completeOn: \"render\" is complete', function () {
        testNode.innerHTML = "<div data-bind='ifnot: outerCondition, descendantsComplete: callback'><div data-bind='ifnot: innerCondition, completeOn: \"render\"'><span data-bind='text: someText'></span></div></div>";
        var callbacks = 0;
        var viewModel = { outerCondition: ko.observable(true), innerCondition: ko.observable(true), someText: "hello", callback: function () { callbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('');

        // Complete the inner condition first and then the outer one (reverse order from previous test)
        viewModel.innerCondition(false);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('');

        viewModel.outerCondition(false);
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('hello');
    });

    it('Should not delay descendantsComplete callback if nested \"ifnot\" binding also has descendantsComplete', function () {
        testNode.innerHTML = "<div data-bind='ifnot: outerCondition, descendantsComplete: outerCallback'><div data-bind='ifnot: innerCondition, descendantsComplete: innerCallback'><span data-bind='text: someText'></span></div></div>";
        var outerCallbacks = 0, innerCallbacks = 0;
        var viewModel = {
            outerCondition: ko.observable(true),
            innerCondition: ko.observable(true),
            someText: "hello",
            outerCallback: function () { outerCallbacks++; },
            innerCallback: function () { innerCallbacks++; }
        };

        ko.applyBindings(viewModel, testNode);
        expect(outerCallbacks).toEqual(0);
        expect(innerCallbacks).toEqual(0);
        expect(testNode).toContainText('');

        // Callback is called when content is rendered
        viewModel.outerCondition(false);
        expect(outerCallbacks).toEqual(1);
        expect(innerCallbacks).toEqual(0);
        expect(testNode).toContainText('');

        // Rendering inner content doesn't affect outer callback
        viewModel.innerCondition(false);
        expect(outerCallbacks).toEqual(1);
        expect(innerCallbacks).toEqual(1);
        expect(testNode).toContainText('hello');
    });

    it('Should call a descendantsComplete callback function if nested \"ifnot\" binding with completeOn: \"render\" is disposed before completion', function () {
        testNode.innerHTML = "<div data-bind='ifnot: outerCondition, descendantsComplete: callback'><div data-bind='ifnot: innerCondition, completeOn: \"render\"'><span data-bind='text: someText'></span></div></div>";
        var callbacks = 0;
        var viewModel = { outerCondition: ko.observable(true), innerCondition: ko.observable(true), someText: "hello", callback: function () { callbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('');

        // Complete the outer condition and then dispose the inner one
        viewModel.outerCondition(false);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('');

        ko.cleanNode(testNode.childNodes[0].childNodes[0]);
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('');
    });
});