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
        var someItem = ko.observable({ childprop: 'child' }),
            callbacks = 0;
        var viewModel = { condition: ko.observable(true), someText: "hello", callback: function () { callbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(1);
        expect(testNode.childNodes[0]).toContainText('hello');

        viewModel.condition(false);
        expect(callbacks).toEqual(1);
        expect(testNode.childNodes[0].childNodes.length).toEqual(0);

        viewModel.condition(true);
        expect(callbacks).toEqual(2);
        expect(testNode.childNodes[0]).toContainText('hello');
    });

    it('Should call a descendantsComplete callback function', function () {
        testNode.innerHTML = "<div data-bind='if: condition, descendantsComplete: callback'><span data-bind='text: someText'></span></div>";
        var someItem = ko.observable({ childprop: 'child' }),
            callbacks = 0;
        var viewModel = { condition: ko.observable(false), someText: "hello", callback: function () { callbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode.childNodes[0]).toContainText('');

        viewModel.condition(true);
        expect(callbacks).toEqual(1);
        expect(testNode.childNodes[0]).toContainText('hello');
    });

    it('Should call a descendantsComplete callback function after nested \"if\" bindings are complete', function () {
        testNode.innerHTML = "<div data-bind='if: outerCondition, descendantsComplete: callback'><div data-bind='if: innerCondition, descendantsComplete'><span data-bind='text: someText'></span></div></div>";
        var someItem = ko.observable({ childprop: 'child' }),
            callbacks = 0;
        var viewModel = { outerCondition: ko.observable(false), innerCondition: ko.observable(false), someText: "hello", callback: function () { callbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode.childNodes[0]).toContainText('');

        // Complete the outer condition first and then the inner one
        viewModel.outerCondition(true);
        expect(callbacks).toEqual(0);
        expect(testNode.childNodes[0]).toContainText('');

        viewModel.innerCondition(true);
        expect(callbacks).toEqual(1);
        expect(testNode.childNodes[0]).toContainText('hello');
    });

    it('Should call descendantsComplete callback function when nested \"if\" bindings are complete', function () {
        testNode.innerHTML = "<div data-bind='if: outerCondition, descendantsComplete: callback'><div data-bind='if: innerCondition, descendantsComplete'><span data-bind='text: someText'></span></div></div>";
        var someItem = ko.observable({ childprop: 'child' }),
            callbacks = 0;
        var viewModel = { outerCondition: ko.observable(false), innerCondition: ko.observable(false), someText: "hello", callback: function () { callbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode.childNodes[0]).toContainText('');

        // Complete the inner condition first and then the outer one (reverse order from previous test)
        viewModel.innerCondition(true);
        expect(callbacks).toEqual(0);
        expect(testNode.childNodes[0]).toContainText('');

        viewModel.outerCondition(true);
        expect(callbacks).toEqual(1);
        expect(testNode.childNodes[0]).toContainText('hello');
    });

    it('Should call descendantsComplete callback function if nested \"if\" bindings are disposed before completion', function () {
        testNode.innerHTML = "<div data-bind='if: outerCondition, descendantsComplete: callback'><div data-bind='if: innerCondition, descendantsComplete'><span data-bind='text: someText'></span></div></div>";
        var someItem = ko.observable({ childprop: 'child' }),
            callbacks = 0;
        var viewModel = { outerCondition: ko.observable(false), innerCondition: ko.observable(false), someText: "hello", callback: function () { callbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode.childNodes[0]).toContainText('');

        // Complete the outer condition and then dispose the inner one
        viewModel.outerCondition(true);
        expect(callbacks).toEqual(0);
        expect(testNode.childNodes[0]).toContainText('');

        ko.cleanNode(testNode.childNodes[0].childNodes[0]);
        expect(callbacks).toEqual(1);
        expect(testNode.childNodes[0]).toContainText('');
    });
});
