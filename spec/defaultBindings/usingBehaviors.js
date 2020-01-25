describe('Binding: Using', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should leave descendant nodes in the document (and bind them in the context of the supplied value) if the value is truthy', function() {
        testNode.innerHTML = "<div data-bind='using: someItem'><span data-bind='text: existentChildProp'></span></div>";
        expect(testNode.childNodes.length).toEqual(1);
        ko.applyBindings({ someItem: { existentChildProp: 'Child prop value' } }, testNode);
        expect(testNode.childNodes[0].childNodes.length).toEqual(1);
        expect(testNode.childNodes[0].childNodes[0]).toContainText("Child prop value");
    });

    it('Should leave descendant nodes in the document (and bind them) if the value is falsy', function() {
        testNode.innerHTML = "<div data-bind='using: someItem'><span data-bind='text: $data'></span></div>";
        ko.applyBindings({ someItem: null }, testNode);
        expect(testNode.childNodes[0].childNodes.length).toEqual(1);
        expect(testNode.childNodes[0].childNodes[0]).toContainText("");
    });

    it('Should leave descendant nodes unchanged and not bind them more than once if the supplied value notifies a change', function() {
        var countedClicks = 0;
        var someItem = ko.observable({
            childProp: ko.observable('Hello'),
            handleClick: function() { countedClicks++ }
        });

        testNode.innerHTML = "<div data-bind='using: someItem'><span data-bind='text: childProp, click: handleClick'></span></div>";
        var originalNode = testNode.childNodes[0].childNodes[0];

        ko.applyBindings({ someItem: someItem }, testNode);
        expect(testNode.childNodes[0].childNodes[0]).toEqual(originalNode);

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

        // and the node is still the same
        expect(testNode.childNodes[0].childNodes[0]).toEqual(originalNode);
    });

    it('Should be able to access parent binding context via $parent', function() {
        testNode.innerHTML = "<div data-bind='using: someItem'><span data-bind='text: $parent.parentProp'></span></div>";
        ko.applyBindings({ someItem: { }, parentProp: 'Parent prop value' }, testNode);
        expect(testNode.childNodes[0].childNodes[0]).toContainText("Parent prop value");
    });

    it('Should update descendant bindings when observable viewmodel changes', function() {
        var vm = ko.observable({ parentItem: "first parent", childItem: "child value" });
        testNode.innerHTML = "<div data-bind='using: childItem'><span data-bind='text: $parent.parentItem'></span> <span data-bind='text: $data'></span></div>";
        ko.applyBindings(vm, testNode);
        expect(testNode.childNodes[0]).toContainText("first parent child value", /* ignoreSpaces */ true);

        vm({parentItem: "second parent", childItem: "child value"});
        expect(testNode.childNodes[0]).toContainText("second parent child value", /* ignoreSpaces */ true);
    });

    it('Should be able to access all parent binding contexts via $parents, and root context via $root', function() {
        testNode.innerHTML = "<div data-bind='using: topItem'>" +
                                "<div data-bind='using: middleItem'>" +
                                    "<div data-bind='using: bottomItem'>" +
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

    it('Should be able to define a \"using\" region using a containerless binding', function() {
        var someitem = ko.observable({someItem: 'first value'});
        testNode.innerHTML = "xxx <!-- ko using: someitem --><span data-bind=\"text: someItem\"></span><!-- /ko -->";
        ko.applyBindings({ someitem: someitem }, testNode);

        expect(testNode).toContainText("xxx first value");

        someitem({ someItem: 'second value' });
        expect(testNode).toContainText("xxx second value");
    });

    it('Should be able to use \"using\" within an observable top-level view model', function() {
        var vm = ko.observable({someitem: ko.observable({someItem: 'first value'})});
        testNode.innerHTML = "xxx <!-- ko using: someitem --><span data-bind=\"text: someItem\"></span><!-- /ko -->";
        ko.applyBindings(vm, testNode);

        expect(testNode).toContainText("xxx first value");

        vm({someitem: ko.observable({ someItem: 'second value' })});
        expect(testNode).toContainText("xxx second value");
    });

    it('Should be able to nest a template within \"using\"', function() {
        testNode.innerHTML = "<div data-bind='using: someitem'>" +
            "<div data-bind='foreach: childprop'><span data-bind='text: $data'></span></div></div>";

        var childprop = ko.observableArray([]);
        var someitem = ko.observable({childprop: childprop});
        var viewModel = {someitem: someitem};
        ko.applyBindings(viewModel, testNode);

        // First it's not there (by template)
        var container = testNode.childNodes[0];
        expect(container).toContainHtml('<div data-bind="foreach: childprop"></div>');

        // Then it's there
        childprop.push('me')
        expect(container).toContainHtml('<div data-bind="foreach: childprop"><span data-bind=\"text: $data\">me</span></div>');

        // Then there's a second one
        childprop.push('me2')
        expect(container).toContainHtml('<div data-bind="foreach: childprop"><span data-bind=\"text: $data\">me</span><span data-bind=\"text: $data\">me2</span></div>');

        // Then it changes
        someitem({childprop: ['notme']});
        expect(container).toContainHtml('<div data-bind="foreach: childprop"><span data-bind=\"text: $data\">notme</span></div>');
    });

    it('Should be able to nest a containerless template within \"using\"', function() {
        testNode.innerHTML = "<div data-bind='using: someitem'>text" +
            "<!-- ko foreach: childprop --><span data-bind='text: $data'></span><!-- /ko --></div>";

        var childprop = ko.observableArray([]);
        var someitem = ko.observable({childprop: childprop});
        var viewModel = {someitem: someitem};
        ko.applyBindings(viewModel, testNode);

        // First it's not there (by template)
        var container = testNode.childNodes[0];
        expect(container).toContainHtml("text<!-- ko foreach: childprop --><!-- /ko -->");

        // Then it's there
        childprop.push('me')
        expect(container).toContainHtml("text<!-- ko foreach: childprop --><span data-bind=\"text: $data\">me</span><!-- /ko -->");

        // Then there's a second one
        childprop.push('me2')
        expect(container).toContainHtml("text<!-- ko foreach: childprop --><span data-bind=\"text: $data\">me</span><span data-bind=\"text: $data\">me2</span><!-- /ko -->");

        // Then it changes
        someitem({childprop: ['notme']});
        container = testNode.childNodes[0];
        expect(container).toContainHtml("text<!-- ko foreach: childprop --><span data-bind=\"text: $data\">notme</span><!-- /ko -->");
    });

    it('Should provide access to an observable viewModel through $rawData', function() {
        testNode.innerHTML = "<div data-bind='using: item'><input data-bind='value: $rawData'/></div>";
        var item = ko.observable('one');
        ko.applyBindings({ item: item }, testNode);
        expect(item.getSubscriptionsCount('change')).toEqual(2);    // only subscriptions are the using and value bindings
        expect(testNode.childNodes[0]).toHaveValues(['one']);

        // Should update observable when input is changed
        testNode.childNodes[0].childNodes[0].value = 'two';
        ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], "change");
        expect(item()).toEqual('two');

        // Should update the input when the observable changes
        item('three');
        expect(testNode.childNodes[0]).toHaveValues(['three']);
    });

    it('Should minimize binding updates with nested bindings', function() {
        testNode.innerHTML = "<div data-bind='using: topLevel'><div data-bind='using: secondLevel'>Renders: <span data-bind='text: ++$root.countRenders'></span> <span data-bind='text: $data'></span></div></div>";

        var topLevel = ko.observable({ secondLevel: "first value" });
        ko.applyBindings({ topLevel: topLevel, countRenders: 0 }, testNode);

        topLevel({ secondLevel: "second value" })
        expect(testNode.childNodes[0]).toContainText("Renders: 2 second value", /* ignoreSpaces */ true);
    });

    describe('With "noChildContext = true" and "as"', function () {
        it('Should not create a child context', function () {
            testNode.innerHTML = "<div data-bind='using: someItem, as: \"item\", noChildContext: true'><span data-bind='text: item.childProp'></span></div>";
            var someItem = { childProp: 'Hello' };
            ko.applyBindings({ someItem: someItem }, testNode);

            expect(testNode.childNodes[0].childNodes[0]).toContainText('Hello');
            expect(ko.dataFor(testNode.childNodes[0].childNodes[0])).toEqual(ko.dataFor(testNode));
        });

        it('Should provide access to observable value', function() {
            testNode.innerHTML = "<div data-bind='using: someItem, as: \"item\", noChildContext: true'><input data-bind='value: item'/></div>";
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

        it('Should update descendant bindings when observable viewmodel changes', function() {
            var vm = ko.observable({ parentItem: "first parent", childItem: "child value" });
            testNode.innerHTML = "<div data-bind='using: childItem, as: \"item\", noChildContext: true'><span data-bind='text: parentItem'></span> <span data-bind='text: item'></span></div>";
            ko.applyBindings(vm, testNode);
            expect(testNode.childNodes[0]).toContainText("first parent child value", /* ignoreSpaces */ true);

            vm({parentItem: "second parent", childItem: "child value"});
            expect(testNode.childNodes[0]).toContainText("second parent child value", /* ignoreSpaces */ true);
        });
    });

    describe('With "noChildContext = false" and "as"', function () {
        it('Should create a child context', function () {
            testNode.innerHTML = "<div data-bind='using: someItem, as: \"item\", noChildContext: false'><span data-bind='text: item.childProp'></span></div>";
            var someItem = { childProp: 'Hello' };
            ko.applyBindings({ someItem: someItem }, testNode);

            expect(testNode.childNodes[0].childNodes[0]).toContainText('Hello');
            expect(ko.dataFor(testNode.childNodes[0].childNodes[0])).toEqual(someItem);
        });

        it('Should unwrap observable value', function() {
            testNode.innerHTML = "<div data-bind='using: someItem, as: \"item\", noChildContext: false'><input data-bind='value: item'/><input data-bind='value: $rawData'/></div>";
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

        it('Should update descendant bindings when observable viewmodel changes', function() {
            var vm = ko.observable({ parentItem: "first parent", childItem: "child value" });
            testNode.innerHTML = "<div data-bind='using: childItem, as: \"item\", noChildContext: false'><span data-bind='text: $parent.parentItem'></span> <span data-bind='text: item'></span></div>";
            ko.applyBindings(vm, testNode);
            expect(testNode.childNodes[0]).toContainText("first parent child value", /* ignoreSpaces */ true);

            vm({parentItem: "second parent", childItem: "child value"});
            expect(testNode.childNodes[0]).toContainText("second parent child value", /* ignoreSpaces */ true);
        });
    });
});
