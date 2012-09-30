describe('Binding: If', {
    before_each: JSSpec.prepareTestNode,

    'Should remove descendant nodes from the document (and not bind them) if the value is falsey': function() {
        testNode.innerHTML = "<div data-bind='if: someItem'><span data-bind='text: someItem.nonExistentChildProp'></span></div>";
        value_of(testNode.childNodes[0].childNodes.length).should_be(1);
        ko.applyBindings({ someItem: null }, testNode);
        value_of(testNode.childNodes[0].childNodes.length).should_be(0);
    },

    'Should leave descendant nodes in the document (and bind them) if the value is truthy, independently of the active template engine': function() {
        ko.setTemplateEngine(new ko.templateEngine()); // This template engine will just throw errors if you try to use it
        testNode.innerHTML = "<div data-bind='if: someItem'><span data-bind='text: someItem.existentChildProp'></span></div>";
        value_of(testNode.childNodes.length).should_be(1);
        ko.applyBindings({ someItem: { existentChildProp: 'Child prop value' } }, testNode);
        value_of(testNode.childNodes[0].childNodes.length).should_be(1);
        value_of(testNode.childNodes[0].childNodes[0]).should_contain_text("Child prop value");
    },

    'Should leave descendant nodes unchanged if the value is truthy and remains truthy when changed': function() {
        var someItem = ko.observable(true);
        testNode.innerHTML = "<div data-bind='if: someItem'><span></span></div>";
        var originalNode = testNode.childNodes[0].childNodes[0];

        // Value is initially true, so nodes are retained
        ko.applyBindings({ someItem: someItem }, testNode);
        value_of(testNode.childNodes[0].childNodes[0].tagName.toLowerCase()).should_be("span");
        value_of(testNode.childNodes[0].childNodes[0]).should_be(originalNode);

        // Change the value to a different truthy value; see the previous SPAN remains
        someItem('different truthy value');
        value_of(testNode.childNodes[0].childNodes[0].tagName.toLowerCase()).should_be("span");
        value_of(testNode.childNodes[0].childNodes[0]).should_be(originalNode);
    },

    'Should toggle the presence and bindedness of descendant nodes according to the truthiness of the value': function() {
        var someItem = ko.observable(undefined);
        testNode.innerHTML = "<div data-bind='if: someItem'><span data-bind='text: someItem().occasionallyExistentChildProp'></span></div>";
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

    'Should not interfere with binding context': function() {
        testNode.innerHTML = "<div data-bind='if: true'>Parents: <span data-bind='text: $parents.length'></span></div>";
        ko.applyBindings({ }, testNode);
        value_of(testNode.childNodes[0]).should_contain_text("Parents: 0");
        value_of(ko.contextFor(testNode.childNodes[0].childNodes[1]).$parents.length).should_be(0);
    },

    'Should be able to define an \"if\" region using a containerless template': function() {
        var someitem = ko.observable(undefined);
        testNode.innerHTML = "hello <!-- ko if: someitem --><span data-bind=\"text: someitem().occasionallyexistentchildprop\"></span><!-- /ko --> goodbye";
        ko.applyBindings({ someitem: someitem }, testNode);

        // First it's not there
        value_of(testNode).should_contain_html("hello <!-- ko if: someitem --><!-- /ko --> goodbye");

        // Then it's there
        someitem({ occasionallyexistentchildprop: 'child prop value' });
        value_of(testNode).should_contain_html("hello <!-- ko if: someitem --><span data-bind=\"text: someitem().occasionallyexistentchildprop\">child prop value</span><!-- /ko --> goodbye");

        // Then it's gone again
        someitem(null);
        value_of(testNode).should_contain_html("hello <!-- ko if: someitem --><!-- /ko --> goodbye");
    },

    'Should be able to nest \"if\" regions defined by containerless templates': function() {
        var condition1 = ko.observable(false);
        var condition2 = ko.observable(false);
        testNode.innerHTML = "hello <!-- ko if: condition1 -->First is true<!-- ko if: condition2 -->Both are true<!-- /ko --><!-- /ko -->";
        ko.applyBindings({ condition1: condition1, condition2: condition2 }, testNode);

        // First neither are there
        value_of(testNode).should_contain_html("hello <!-- ko if: condition1 --><!-- /ko -->");

        // Make outer appear
        condition1(true);
        value_of(testNode).should_contain_html("hello <!-- ko if: condition1 -->first is true<!-- ko if: condition2 --><!-- /ko --><!-- /ko -->");

        // Make inner appear
        condition2(true);
        value_of(testNode).should_contain_html("hello <!-- ko if: condition1 -->first is true<!-- ko if: condition2 -->both are true<!-- /ko --><!-- /ko -->");
    }
});
