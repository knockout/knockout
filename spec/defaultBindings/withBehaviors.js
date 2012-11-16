describe('Binding: With', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should remove descendant nodes from the document (and not bind them) if the value is falsey', function() {
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
});