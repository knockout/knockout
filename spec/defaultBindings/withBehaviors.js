describe('Binding: With', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should remove descendant nodes from the document (and not bind them) if the value is falsy', function() {
        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: someItem.nonExistentChildProp'></span></div>";
        expect(testNode.childNodes[0].childNodes.length).toEqual(1);
        ko.applyBindings({ someItem: null }, testNode);
        expect(testNode.childNodes[0].childNodes.length).toEqual(0);
    });

    it('Should leave descendant nodes in the document (and bind them in the context of the supplied value) if the value is truthy', function() {
        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: existentChildProp'></span></div>";
        expect(testNode.childNodes.length).toEqual(1);
        ko.applyBindings({ someItem: { existentChildProp: 'Child prop value' } }, testNode);
        expect(testNode.childNodes[0].childNodes.length).toEqual(1);
        expect(testNode.childNodes[0].childNodes[0]).toContainText("Child prop value");
    });

    it('Should leave descendant nodes unchanged if the value is truthy', function() {
        var someItem = ko.observable({ childProp: 'child prop value' });
        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: childProp'></span></div>";
        var originalNode = testNode.childNodes[0].childNodes[0];

        // Value is initially true, so nodes are retained
        ko.applyBindings({ someItem: someItem }, testNode);
        expect(testNode.childNodes[0].childNodes[0]).toContainText("child prop value");
        expect(testNode.childNodes[0].childNodes[0]).toEqual(originalNode);
    });

    it('Should toggle the presence and bindedness of descendant nodes according to the truthiness of the value, performing binding in the context of the value', function() {
        var someItem = ko.observable(undefined);
        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: occasionallyExistentChildProp'></span></div>";
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

    it('Should reconstruct and bind descendants when the data item notifies about mutation', function() {
        var someItem = ko.observable({ childProp: 'Hello' });

        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: childProp'></span></div>";
        ko.applyBindings({ someItem: someItem }, testNode);
        expect(testNode.childNodes[0].childNodes[0]).toContainText("Hello");

        // Force "update" binding handler to fire, then check the DOM changed
        someItem().childProp = 'Goodbye';
        someItem.valueHasMutated();
        expect(testNode.childNodes[0].childNodes[0]).toContainText("Goodbye");
    });

    it('Should not bind the same elements more than once even if the supplied value notifies a change', function() {
        var countedClicks = 0;
        var someItem = ko.observable({
            childProp: ko.observable('Hello'),
            handleClick: function() { countedClicks++ }
        });

        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: childProp, click: handleClick'></span></div>";
        ko.applyBindings({ someItem: someItem }, testNode);

        // Initial state is one subscriber, one click handler
        expect(testNode.childNodes[0].childNodes[0]).toContainText("Hello");
        expect(someItem().childProp.getSubscriptionsCount()).toEqual(1);
        ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], "click");
        expect(countedClicks).toEqual(1);

        // Force "update" binding handler to fire, then check we still have one subscriber...
        someItem.valueHasMutated();
        expect(someItem().childProp.getSubscriptionsCount()).toEqual(1);

        // ... and one click handler
        countedClicks = 0;
        ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], "click");
        expect(countedClicks).toEqual(1);
    });

    it('Should be able to access parent binding context via $parent', function() {
        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: $parent.parentProp'></span></div>";
        ko.applyBindings({ someItem: { }, parentProp: 'Parent prop value' }, testNode);
        expect(testNode.childNodes[0].childNodes[0]).toContainText("Parent prop value");
    });

    it('Should be able to access all parent binding contexts via $parents, and root context via $root', function() {
        testNode.innerHTML = "<div data-bind='with: topItem'>" +
                                "<div data-bind='with: middleItem'>" +
                                    "<div data-bind='with: bottomItem'>" +
                                        "<span data-bind='text: name'></span>" +
                                        "<span data-bind='text: $parent.name'></span>" +
                                        "<span data-bind='text: $parents[1].name'></span>" +
                                        "<span data-bind='text: $parents[2].name'></span>" +
                                        "<span data-bind='text: $root.name'></span>" +
                                    "</div>" +
                                "</div>" +
                              "</div>";
        ko.applyBindings({
            name: 'outer',
            topItem: {
                name: 'top',
                middleItem: {
                    name: 'middle',
                    bottomItem: {
                        name: "bottom"
                    }
                }
            }
        }, testNode);
        var finalContainer = testNode.childNodes[0].childNodes[0].childNodes[0];
        expect(finalContainer.childNodes[0]).toContainText("bottom");
        expect(finalContainer.childNodes[1]).toContainText("middle");
        expect(finalContainer.childNodes[2]).toContainText("top");
        expect(finalContainer.childNodes[3]).toContainText("outer");
        expect(finalContainer.childNodes[4]).toContainText("outer");

        // Also check that, when we later retrieve the binding contexts, we get consistent results
        expect(ko.contextFor(testNode).$data.name).toEqual("outer");
        expect(ko.contextFor(testNode.childNodes[0]).$data.name).toEqual("outer");
        expect(ko.contextFor(testNode.childNodes[0].childNodes[0]).$data.name).toEqual("top");
        expect(ko.contextFor(testNode.childNodes[0].childNodes[0].childNodes[0]).$data.name).toEqual("middle");
        expect(ko.contextFor(testNode.childNodes[0].childNodes[0].childNodes[0].childNodes[0]).$data.name).toEqual("bottom");
        var firstSpan = testNode.childNodes[0].childNodes[0].childNodes[0].childNodes[0];
        expect(firstSpan.tagName).toEqual("SPAN");
        expect(ko.contextFor(firstSpan).$data.name).toEqual("bottom");
        expect(ko.contextFor(firstSpan).$root.name).toEqual("outer");
        expect(ko.contextFor(firstSpan).$parents[1].name).toEqual("top");
    });

    it('Should be able to access all parent bindings when using "as"', function() {
        testNode.innerHTML = "<div data-bind='with: topItem'>" +
                                "<div data-bind='with: middleItem, as: \"middle\"'>" +
                                    "<div data-bind='with: bottomItem'>" +
                                        "<span data-bind='text: name'></span>" +
                                        "<span data-bind='text: $parent.name'></span>" +
                                        "<span data-bind='text: middle.name'></span>" +
                                        "<span data-bind='text: $parents[1].name'></span>" +
                                        "<span data-bind='text: $parents[2].name'></span>" +
                                        "<span data-bind='text: $root.name'></span>" +
                                    "</div>" +
                                "</div>" +
                              "</div>";
        ko.applyBindings({
            name: 'outer',
            topItem: {
                name: 'top',
                middleItem: {
                    name: 'middle',
                    bottomItem: {
                        name: "bottom"
                    }
                }
            }
        }, testNode);
        var finalContainer = testNode.childNodes[0].childNodes[0].childNodes[0];
        expect(finalContainer.childNodes[0]).toContainText("bottom");
        expect(finalContainer.childNodes[1]).toContainText("middle");
        expect(finalContainer.childNodes[2]).toContainText("middle");
        expect(finalContainer.childNodes[3]).toContainText("top");
        expect(finalContainer.childNodes[4]).toContainText("outer");
        expect(finalContainer.childNodes[5]).toContainText("outer");
    });

    it('Should be able to define an \"with\" region using a containerless template', function() {
        var someitem = ko.observable(undefined);
        testNode.innerHTML = "hello <!-- ko with: someitem --><span data-bind=\"text: occasionallyexistentchildprop\"></span><!-- /ko --> goodbye";
        ko.applyBindings({ someitem: someitem }, testNode);

        // First it's not there
        expect(testNode).toContainHtml("hello <!-- ko with: someitem --><!-- /ko --> goodbye");

        // Then it's there
        someitem({ occasionallyexistentchildprop: 'child prop value' });
        expect(testNode).toContainHtml("hello <!-- ko with: someitem --><span data-bind=\"text: occasionallyexistentchildprop\">child prop value</span><!-- /ko --> goodbye");

        // Then it's gone again
        someitem(null);
        expect(testNode).toContainHtml("hello <!-- ko with: someitem --><!-- /ko --> goodbye");
    });

    it('Should be able to nest \"with\" regions defined by containerless templates', function() {
        testNode.innerHTML = "hello <!-- ko with: topitem -->"
                               + "Got top: <span data-bind=\"text: topprop\"></span>"
                               + "<!-- ko with: childitem -->"
                                   + "Got child: <span data-bind=\"text: childprop\"></span>"
                               + "<!-- /ko -->"
                           + "<!-- /ko -->";
        var viewModel = { topitem: ko.observable(null) };
        ko.applyBindings(viewModel, testNode);

        // First neither are there
        expect(testNode).toContainHtml("hello <!-- ko with: topitem --><!-- /ko -->");

        // Make top appear
        viewModel.topitem({ topprop: 'property of top', childitem: ko.observable() });
        expect(testNode).toContainHtml("hello <!-- ko with: topitem -->got top: <span data-bind=\"text: topprop\">property of top</span><!-- ko with: childitem --><!-- /ko --><!-- /ko -->");

        // Make child appear
        viewModel.topitem().childitem({ childprop: 'property of child' });
        expect(testNode).toContainHtml("hello <!-- ko with: topitem -->got top: <span data-bind=\"text: topprop\">property of top</span><!-- ko with: childitem -->got child: <span data-bind=\"text: childprop\">property of child</span><!-- /ko --><!-- /ko -->");

        // Make top disappear
        viewModel.topitem(null);
        expect(testNode).toContainHtml("hello <!-- ko with: topitem --><!-- /ko -->");
    });

    it('Should provide access to an observable viewModel through $rawData', function() {
        testNode.innerHTML = "<div data-bind='with: item'><input data-bind='value: $rawData'/><div data-bind='text: $data'></div></div>";
        var item = ko.observable('one');
        ko.applyBindings({ item: item }, testNode);
        expect(item.getSubscriptionsCount('change')).toEqual(2);    // subscriptions are the with and value bindings
        expect(testNode.childNodes[0]).toHaveValues(['one']);
        expect(testNode.childNodes[0].childNodes[1]).toContainText('one');

        // Should update observable when input is changed
        testNode.childNodes[0].childNodes[0].value = 'two';
        ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], "change");
        expect(item()).toEqual('two');
        expect(testNode.childNodes[0].childNodes[1]).toContainText('two');

        // Should update the input when the observable changes
        item('three');
        expect(testNode.childNodes[0]).toHaveValues(['three']);
        expect(testNode.childNodes[0].childNodes[1]).toContainText('three');

        // subscription count is stable
        expect(item.getSubscriptionsCount('change')).toEqual(2);
    });

    it('Should update if given a function', function () {
        // See knockout/knockout#2285
        testNode.innerHTML = '<div data-bind="with: getTotal"><div data-bind="text: $data"></div>';

        function ViewModel() {
            var self = this;
            self.items = ko.observableArray([{ x: ko.observable(4) }])
            self.getTotal = function() {
                var total = 0;
                ko.utils.arrayForEach(self.items(), function(item) { total += item.x();});
                return total;
            }
        }

        var model = new ViewModel();
        ko.applyBindings(model, testNode);
        expect(testNode).toContainText("4");

        model.items.push({ x: ko.observable(15) });
        expect(testNode).toContainText("19");

        model.items()[0].x(10);
        expect(testNode).toContainText("25");
    });

    it('Should call a childrenComplete callback function', function () {
        testNode.innerHTML = "<div data-bind='with: someItem, childrenComplete: callback'><span data-bind='text: childprop'></span></div>";
        var someItem = ko.observable({ childprop: 'child' }),
            callbacks = 0;
        ko.applyBindings({ someItem: someItem, callback: function () { callbacks++; } }, testNode);
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('child');

        someItem(null);
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('');

        someItem({ childprop: "new child" });
        expect(callbacks).toEqual(2);
        expect(testNode).toContainText('new child');
    });

    it('Should call a descendantsComplete callback function', function () {
        testNode.innerHTML = "<div data-bind='with: someItem, descendantsComplete: callback'><span data-bind='text: childprop'></span></div>";
        var someItem = ko.observable(),
            callbacks = 0;
        var viewModel = { someItem: someItem, callback: function () { callbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('');

        someItem({ childprop: 'child' });
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('child');
    });

    it('Should call a descendantsComplete callback function each time the binding is updated with a truthy value', function () {
        testNode.innerHTML = "<div data-bind='with: someItem, descendantsComplete: callback'><span data-bind='text: childprop'></span></div>";
        var someItem = ko.observable(),
            callbacks = 0;
        var viewModel = { someItem: someItem, callback: function () { callbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('');

        someItem({ childprop: 'child' });
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('child');

        someItem(null);
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('');

        someItem({ childprop: 'new child' });
        expect(callbacks).toEqual(2);
        expect(testNode).toContainText('new child');

        someItem({ childprop: 'another child' });
        expect(callbacks).toEqual(3);
        expect(testNode).toContainText('another child');
    });

    it('Should call a descendantsComplete callback function after nested \"with\" binding with completeOn: \"render\" is complete', function () {
        testNode.innerHTML = "<div data-bind='with: outerCondition, descendantsComplete: callback'><div data-bind='with: innerCondition, completeOn: \"render\"'><span data-bind='text: childprop'></span></div></div>";
        var outerCondition = ko.observable(),
            innerCondition = ko.observable(),
            callbacks = 0;
        var viewModel = { outerCondition: outerCondition, callback: function () { callbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('');

        // Complete the outer condition first and then the inner one
        outerCondition({ innerCondition: innerCondition });
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('');

        innerCondition({ childprop: 'child' });
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('child');
    });

    it('Should call a descendantsComplete callback function after nested \"with\" binding with completeOn: \"render\" is complete using a containerless template', function () {
        testNode.innerHTML = "xx<!-- ko with: outerCondition, descendantsComplete: callback --><!-- ko with: innerCondition, completeOn: \"render\" --><span data-bind='text: childprop'></span><!--/ko--><!--/ko-->";
        var outerCondition = ko.observable(),
            innerCondition = ko.observable(),
            callbacks = 0;
        var viewModel = { outerCondition: outerCondition, callback: function () { callbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('xx');

        // Complete the outer condition first and then the inner one
        outerCondition({ innerCondition: innerCondition });
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('xx');

        innerCondition({ childprop: 'child' });
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('xxchild');
    });

    it('Should call a descendantsComplete callback function when nested \"with\" binding with completeOn: \"render\" is complete', function () {
        testNode.innerHTML = "<div data-bind='with: outerCondition, descendantsComplete: callback'><div data-bind='with: innerCondition, completeOn: \"render\"'><span data-bind='text: childprop'></span></div></div>";
        var outerCondition = ko.observable(),
            innerCondition = ko.observable(),
            callbacks = 0;
        var viewModel = { outerCondition: outerCondition, callback: function () { callbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('');

        // Complete the inner condition first and then the outer one (reverse order from previous test)
        innerCondition({ childprop: 'child' });
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('');

        outerCondition({ innerCondition: innerCondition });
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('child');
    });

    it('Should not delay descendantsComplete callback if nested \"with\" binding also has descendantsComplete', function () {
        testNode.innerHTML = "<div data-bind='with: outerCondition, descendantsComplete: callback'><div data-bind='with: innerCondition, descendantsComplete: callback'><span data-bind='text: childprop'></span></div></div>";
        var outerCondition = ko.observable(),
            innerCondition = ko.observable(),
            outerCallbacks = 0,
            innerCallbacks = 0;
        var viewModel = { outerCondition: outerCondition, callback: function () { outerCallbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(outerCallbacks).toEqual(0);
        expect(innerCallbacks).toEqual(0);
        expect(testNode).toContainText('');

        // Callback is called when content is rendered
        outerCondition({ innerCondition: innerCondition, callback: function () { innerCallbacks++; } });
        expect(outerCallbacks).toEqual(1);
        expect(innerCallbacks).toEqual(0);
        expect(testNode).toContainText('');

        // Rendering inner content doesn't affect outer callback
        innerCondition({ childprop: 'child' });
        expect(outerCallbacks).toEqual(1);
        expect(innerCallbacks).toEqual(1);
        expect(testNode).toContainText('child');
    });

    it('Should call a descendantsComplete callback function if nested \"with\" binding with completeOn: \"render\" is disposed before completion', function () {
        testNode.innerHTML = "<div data-bind='with: outerCondition, descendantsComplete: callback'><div data-bind='with: innerCondition, completeOn: \"render\"'><span data-bind='text: childprop'></span></div></div>";
        var outerCondition = ko.observable(),
            innerCondition = ko.observable(),
            callbacks = 0;
        var viewModel = { outerCondition: outerCondition, callback: function () { callbacks++; } };

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('');

        // Complete the outer condition and then dispose the inner one
        outerCondition({ innerCondition: innerCondition });
        expect(callbacks).toEqual(0);
        expect(testNode).toContainText('');

        ko.cleanNode(testNode.childNodes[0].childNodes[0]);
        expect(callbacks).toEqual(1);
        expect(testNode).toContainText('');
    });

    describe('With "noChildContext = true" and "as"', function () {
        it('Should not create a child context', function () {
            testNode.innerHTML = "<div data-bind='with: someItem, as: \"item\", noChildContext: true'><span data-bind='text: item.childProp'></span></div>";
            var someItem = { childProp: 'Hello' };
            ko.applyBindings({ someItem: someItem }, testNode);

            expect(testNode.childNodes[0].childNodes[0]).toContainText('Hello');
            expect(ko.dataFor(testNode.childNodes[0].childNodes[0])).toEqual(ko.dataFor(testNode));
        });

        it('Should provide access to observable value', function() {
            testNode.innerHTML = "<div data-bind='with: someItem, as: \"item\", noChildContext: true'><input data-bind='value: item'/></div>";
            var someItem = ko.observable('Hello');
            ko.applyBindings({ someItem: someItem }, testNode);
            expect(testNode.childNodes[0].childNodes[0].value).toEqual('Hello');

            expect(ko.dataFor(testNode.childNodes[0].childNodes[0])).toEqual(ko.dataFor(testNode));

            // Should update observable when input is changed
            testNode.childNodes[0].childNodes[0].value = 'Goodbye';
            ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], "change");
            expect(someItem()).toEqual('Goodbye');

            // Should update the input when the observable changes
            someItem('Hello again');
            expect(testNode.childNodes[0].childNodes[0].value).toEqual('Hello again');
        });

        it('Should not re-render the nodes when an observable value changes', function() {
            testNode.innerHTML = "<div data-bind='with: someItem, as: \"item\", noChildContext: true'><span data-bind='text: item'></span></div>";
            var someItem = ko.observable('first');
            ko.applyBindings({ someItem: someItem }, testNode);
            expect(testNode.childNodes[0]).toContainText('first');

            var saveNode = testNode.childNodes[0].childNodes[0];
            someItem('second');
            expect(testNode.childNodes[0]).toContainText('second');
            expect(testNode.childNodes[0].childNodes[0]).toEqual(saveNode);
        });

        it('Should remove nodes when an observable value become falsy', function() {
            var someItem = ko.observable(undefined);
            testNode.innerHTML = "<div data-bind='with: someItem, as: \"item\", noChildContext: true'><span data-bind='text: item().occasionallyExistentChildProp'></span></div>";
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
    });

    describe('With "noChildContext = false" and "as"', function () {
        it('Should create a child context', function () {
            testNode.innerHTML = "<div data-bind='with: someItem, as: \"item\", noChildContext: false'><span data-bind='text: item.childProp'></span></div>";
            var someItem = { childProp: 'Hello' };
            ko.applyBindings({ someItem: someItem }, testNode);

            expect(testNode.childNodes[0].childNodes[0]).toContainText('Hello');
            expect(ko.dataFor(testNode.childNodes[0].childNodes[0])).toEqual(someItem);
        });

        it('Should unwrap observable value', function() {
            testNode.innerHTML = "<div data-bind='with: someItem, as: \"item\", noChildContext: false'><input data-bind='value: item'/><input data-bind='value: $rawData'/></div>";
            var someItem = ko.observable('Hello');
            ko.applyBindings({ someItem: someItem }, testNode);
            expect(testNode.childNodes[0]).toHaveValues(['Hello', 'Hello']);

            // Should not update observable when input bound to named item is changed
            testNode.childNodes[0].childNodes[0].value = 'Goodbye';
            ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], "change");
            expect(someItem()).toEqual('Hello');

            // Should update observable when input bound to $rawData is changed
            testNode.childNodes[0].childNodes[1].value = 'Goodbye';
            ko.utils.triggerEvent(testNode.childNodes[0].childNodes[1], "change");
            expect(someItem()).toEqual('Goodbye');

            // Should update the input when the observable changes
            someItem('Hello again');
            expect(testNode.childNodes[0].childNodes[0].value).toEqual('Hello again');
        });

        it('Should re-render the nodes when an observable value changes', function() {
            testNode.innerHTML = "<div data-bind='with: someItem, as: \"item\", noChildContext: false'><span data-bind='text: item'></span></div>";
            var someItem = ko.observable('first');
            ko.applyBindings({ someItem: someItem }, testNode);
            expect(testNode.childNodes[0]).toContainText('first');

            var saveNode = testNode.childNodes[0].childNodes[0];
            someItem('second');
            expect(testNode.childNodes[0]).toContainText('second');
            expect(testNode.childNodes[0].childNodes[0]).not.toEqual(saveNode);
        });

        it('Should remove nodes when an observable value become falsy', function() {
            var someItem = ko.observable(undefined);
            testNode.innerHTML = "<div data-bind='with: someItem, as: \"item\", noChildContext: false'><span data-bind='text: item.occasionallyExistentChildProp'></span></div>";
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
    });
});
