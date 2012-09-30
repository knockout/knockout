describe('Binding: With', {
    before_each: JSSpec.prepareTestNode,

    'Should remove descendant nodes from the document (and not bind them) if the value is falsey': function() {
        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: someItem.nonExistentChildProp'></span></div>";
        value_of(testNode.childNodes[0].childNodes.length).should_be(1);
        ko.applyBindings({ someItem: null }, testNode);
        value_of(testNode.childNodes[0].childNodes.length).should_be(0);
    },

    'Should leave descendant nodes in the document (and bind them in the context of the supplied value) if the value is truthy': function() {
        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: existentChildProp'></span></div>";
        value_of(testNode.childNodes.length).should_be(1);
        ko.applyBindings({ someItem: { existentChildProp: 'Child prop value' } }, testNode);
        value_of(testNode.childNodes[0].childNodes.length).should_be(1);
        value_of(testNode.childNodes[0].childNodes[0]).should_contain_text("Child prop value");
    },

    'Should leave descendant nodes unchanged if the value is truthy': function() {
        var someItem = ko.observable({ childProp: 'child prop value' });
        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: childProp'></span></div>";
        var originalNode = testNode.childNodes[0].childNodes[0];

        // Value is initially true, so nodes are retained
        ko.applyBindings({ someItem: someItem }, testNode);
        value_of(testNode.childNodes[0].childNodes[0]).should_contain_text("child prop value");
        value_of(testNode.childNodes[0].childNodes[0]).should_be(originalNode);
    },

    'Should toggle the presence and bindedness of descendant nodes according to the truthiness of the value, performing binding in the context of the value': function() {
        var someItem = ko.observable(undefined);
        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: occasionallyExistentChildProp'></span></div>";
        ko.applyBindings({ someItem: someItem }, testNode);

        // First it's not there
        value_of(testNode.childNodes[0].childNodes.length).should_be(0);

        // Then it's there
        someItem({ occasionallyExistentChildProp: 'Child prop value' });
        value_of(testNode.childNodes[0].childNodes.length).should_be(1);
        value_of(testNode.childNodes[0].childNodes[0]).should_contain_text("Child prop value");

        // Then it's gone again
        someItem(null);
        value_of(testNode.childNodes[0].childNodes.length).should_be(0);
    },

    'Should reconstruct and bind descendants when the data item notifies about mutation': function() {
        var someItem = ko.observable({ childProp: 'Hello' });

        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: childProp'></span></div>";
        ko.applyBindings({ someItem: someItem }, testNode);
        value_of(testNode.childNodes[0].childNodes[0]).should_contain_text("Hello");

        // Force "update" binding handler to fire, then check the DOM changed
        someItem().childProp = 'Goodbye';
        someItem.valueHasMutated();
        value_of(testNode.childNodes[0].childNodes[0]).should_contain_text("Goodbye");
    },

    'Should not bind the same elements more than once even if the supplied value notifies a change': function() {
        var countedClicks = 0;
        var someItem = ko.observable({
            childProp: ko.observable('Hello'),
            handleClick: function() { countedClicks++ }
        });

        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: childProp, click: handleClick'></span></div>";
        ko.applyBindings({ someItem: someItem }, testNode);

        // Initial state is one subscriber, one click handler
        value_of(testNode.childNodes[0].childNodes[0]).should_contain_text("Hello");
        value_of(someItem().childProp.getSubscriptionsCount()).should_be(1);
        ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], "click");
        value_of(countedClicks).should_be(1);

        // Force "update" binding handler to fire, then check we still have one subscriber...
        someItem.valueHasMutated();
        value_of(someItem().childProp.getSubscriptionsCount()).should_be(1);

        // ... and one click handler
        countedClicks = 0;
        ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], "click");
        value_of(countedClicks).should_be(1);
    },

    'Should be able to access parent binding context via $parent': function() {
        testNode.innerHTML = "<div data-bind='with: someItem'><span data-bind='text: $parent.parentProp'></span></div>";
        ko.applyBindings({ someItem: { }, parentProp: 'Parent prop value' }, testNode);
        value_of(testNode.childNodes[0].childNodes[0]).should_contain_text("Parent prop value");
    },

    'Should be able to access all parent binding contexts via $parents, and root context via $root': function() {
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
        value_of(finalContainer.childNodes[0]).should_contain_text("bottom");
        value_of(finalContainer.childNodes[1]).should_contain_text("middle");
        value_of(finalContainer.childNodes[2]).should_contain_text("top");
        value_of(finalContainer.childNodes[3]).should_contain_text("outer");
        value_of(finalContainer.childNodes[4]).should_contain_text("outer");

        // Also check that, when we later retrieve the binding contexts, we get consistent results
        value_of(ko.contextFor(testNode).$data.name).should_be("outer");
        value_of(ko.contextFor(testNode.childNodes[0]).$data.name).should_be("outer");
        value_of(ko.contextFor(testNode.childNodes[0].childNodes[0]).$data.name).should_be("top");
        value_of(ko.contextFor(testNode.childNodes[0].childNodes[0].childNodes[0]).$data.name).should_be("middle");
        value_of(ko.contextFor(testNode.childNodes[0].childNodes[0].childNodes[0].childNodes[0]).$data.name).should_be("bottom");
        var firstSpan = testNode.childNodes[0].childNodes[0].childNodes[0].childNodes[0];
        value_of(firstSpan.tagName).should_be("SPAN");
        value_of(ko.contextFor(firstSpan).$data.name).should_be("bottom");
        value_of(ko.contextFor(firstSpan).$root.name).should_be("outer");
        value_of(ko.contextFor(firstSpan).$parents[1].name).should_be("top");
    },

    'Should be able to define an \"with\" region using a containerless template': function() {
        var someitem = ko.observable(undefined);
        testNode.innerHTML = "hello <!-- ko with: someitem --><span data-bind=\"text: occasionallyexistentchildprop\"></span><!-- /ko --> goodbye";
        ko.applyBindings({ someitem: someitem }, testNode);

        // First it's not there
        value_of(testNode).should_contain_html("hello <!-- ko with: someitem --><!-- /ko --> goodbye");

        // Then it's there
        someitem({ occasionallyexistentchildprop: 'child prop value' });
        value_of(testNode).should_contain_html("hello <!-- ko with: someitem --><span data-bind=\"text: occasionallyexistentchildprop\">child prop value</span><!-- /ko --> goodbye");

        // Then it's gone again
        someitem(null);
        value_of(testNode).should_contain_html("hello <!-- ko with: someitem --><!-- /ko --> goodbye");
    },

    'Should be able to nest \"with\" regions defined by containerless templates': function() {
        testNode.innerHTML = "hello <!-- ko with: topitem -->"
                               + "Got top: <span data-bind=\"text: topprop\"></span>"
                               + "<!-- ko with: childitem -->"
                                   + "Got child: <span data-bind=\"text: childprop\"></span>"
                               + "<!-- /ko -->"
                           + "<!-- /ko -->";
        var viewModel = { topitem: ko.observable(null) };
        ko.applyBindings(viewModel, testNode);

        // First neither are there
        value_of(testNode).should_contain_html("hello <!-- ko with: topitem --><!-- /ko -->");

        // Make top appear
        viewModel.topitem({ topprop: 'property of top', childitem: ko.observable() });
        value_of(testNode).should_contain_html("hello <!-- ko with: topitem -->got top: <span data-bind=\"text: topprop\">property of top</span><!-- ko with: childitem --><!-- /ko --><!-- /ko -->");

        // Make child appear
        viewModel.topitem().childitem({ childprop: 'property of child' });
        value_of(testNode).should_contain_html("hello <!-- ko with: topitem -->got top: <span data-bind=\"text: topprop\">property of top</span><!-- ko with: childitem -->got child: <span data-bind=\"text: childprop\">property of child</span><!-- /ko --><!-- /ko -->");

        // Make top disappear
        viewModel.topitem(null);
        value_of(testNode).should_contain_html("hello <!-- ko with: topitem --><!-- /ko -->");
    }
});