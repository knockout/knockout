describe('Binding: Ifnot', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should remove descendant nodes from the document (and not bind them) if the value is truey', function() {
        testNode.innerHTML = "<div data-bind='ifnot: condition'><span data-bind='text: someItem.nonExistentChildProp'></span></div>";
        expect(testNode.childNodes[0].childNodes.length).toEqual(1);
        ko.applyBindings({ someItem: null, condition: true }, testNode);
        expect(testNode.childNodes[0].childNodes.length).toEqual(0);
    });

    it('Should leave descendant nodes in the document (and bind them) if the value is falsey, independently of the active template engine', function() {
        this.after(function() { ko.setTemplateEngine(new ko.nativeTemplateEngine()); });

        ko.setTemplateEngine(new ko.templateEngine()); // This template engine will just throw errors if you try to use it
        testNode.innerHTML = "<div data-bind='ifnot: condition'><span data-bind='text: someItem.existentChildProp'></span></div>";
        expect(testNode.childNodes.length).toEqual(1);
        ko.applyBindings({ someItem: { existentChildProp: 'Child prop value' }, condition: false }, testNode);
        expect(testNode.childNodes[0].childNodes.length).toEqual(1);
        expect(testNode.childNodes[0].childNodes[0]).toContainText("Child prop value");
    });

    it('Should leave descendant nodes unchanged if the value is falsey and remains falsey when changed', function() {
        var someItem = ko.observable(false);
        testNode.innerHTML = "<div data-bind='ifnot: someItem'><span data-bind='text: someItem()'></span></div>";
        var originalNode = testNode.childNodes[0].childNodes[0];

        // Value is initially true, so nodes are retained
        ko.applyBindings({ someItem: someItem }, testNode);
        expect(testNode.childNodes[0].childNodes[0]).toContainText("false");
        expect(testNode.childNodes[0].childNodes[0]).toEqual(originalNode);

        // Change the value to a different falsey value
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

    it('Should call an afterRender callback function and not cause updates if an observable accessed in the callback is changed', function () {
        testNode.innerHTML = "<div data-bind='ifnot: condition, afterRender: callback'><span data-bind='text: someText'></span></div>";
        var callbackObservable = ko.observable(1),
            callbacks = 0;
        var viewModel = { condition: ko.observable(false), someText: "hello", callback: function() { callbackObservable(); callbacks++; } };
        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(1);
        expect(testNode.childNodes[0]).toContainText('hello');

        viewModel.someText = "bello";
        // Update callback observable and check that the binding wasn't updated
        callbackObservable(2);
        expect(testNode.childNodes[0]).toContainText('hello');
    });

    it('Should not call an afterRender callback function when data gets cleared', function () {
      testNode.innerHTML = "<div data-bind='ifnot: condition, afterRender: callback'><span data-bind='text: someText'></span></div>";
        var someItem = ko.observable({ childprop: 'child' }),
            callbacks = 0;
        var viewModel = { condition: ko.observable(false), someText: "hello", callback: function () { callbacks++; } };
        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(1);
        expect(testNode.childNodes[0]).toContainText('hello');

        viewModel.condition(true);
        expect(callbacks).toEqual(1);
        expect(testNode.childNodes[0].childNodes.length).toEqual(0);

        viewModel.condition(false);
        expect(callbacks).toEqual(2);
        expect(testNode.childNodes[0]).toContainText('hello');
    });

    it('Should call an afterRender callback, passing all of the rendered nodes, accounting for node preprocessing and virtual element bindings', function () {
        // Set up a binding provider that converts text nodes to expressions
        var originalBindingProvider = ko.bindingProvider.instance,
            preprocessingBindingProvider = function () { };
        preprocessingBindingProvider.prototype = originalBindingProvider;
        ko.bindingProvider.instance = new preprocessingBindingProvider();
        ko.bindingProvider.instance.preprocessNode = function (node) {
            if (node.nodeType === 3 && node.data.charAt(0) === "$") {
                var newNodes = [
                    document.createComment('ko text: ' + node.data),
                    document.createComment('/ko')
                ];
                for (var i = 0; i < newNodes.length; i++) {
                    node.parentNode.insertBefore(newNodes[i], node);
                }
                node.parentNode.removeChild(node);
                return newNodes;
            }
        };

        // Now perform a with binding, and see that afterRender gets the output from the preprocessor and bindings
        testNode.innerHTML = "<div data-bind='ifnot: condition, afterRender: callback'><span>[</span>$data.someText<span>]</span></div>";
        var callbacks = 0;
        var viewModel = {
            condition: ko.observable(false),
            someText: "hello",
            callback: function (nodes, data) {
                expect(nodes.length).toBe(5);
                expect(nodes[0]).toContainText('[');    // <span>[</span>
                expect(nodes[1].nodeType).toBe(8);      // <!-- ko text: $data.childprop -->
                expect(nodes[2].nodeType).toBe(3);      // text node inserted by text binding
                expect(nodes[3].nodeType).toBe(8);      // <!-- /ko -->
                expect(nodes[4]).toContainText(']');    // <span>]</span>
                expect(data).toBe(viewModel);
                callbacks++;
            }
        };

        ko.applyBindings(viewModel, testNode);

        expect(testNode.childNodes[0]).toContainText('[hello]');
        expect(callbacks).toBe(1);

        ko.bindingProvider.instance = originalBindingProvider;
    });
});