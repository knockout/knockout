describe('Binding: Ifnot', {
    before_each: JSSpec.prepareTestNode,

    'Should remove descendant nodes from the document (and not bind them) if the value is truey': function() {
        testNode.innerHTML = "<div data-bind='ifnot: condition'><span data-bind='text: someItem.nonExistentChildProp'></span></div>";
        value_of(testNode.childNodes[0].childNodes.length).should_be(1);
        ko.applyBindings({ someItem: null, condition: true }, testNode);
        value_of(testNode.childNodes[0].childNodes.length).should_be(0);
    },

    'Should leave descendant nodes in the document (and bind them) if the value is falsey, independently of the active template engine': function() {
        ko.setTemplateEngine(new ko.templateEngine()); // This template engine will just throw errors if you try to use it
        testNode.innerHTML = "<div data-bind='ifnot: condition'><span data-bind='text: someItem.existentChildProp'></span></div>";
        value_of(testNode.childNodes.length).should_be(1);
        ko.applyBindings({ someItem: { existentChildProp: 'Child prop value' }, condition: false }, testNode);
        value_of(testNode.childNodes[0].childNodes.length).should_be(1);
        value_of(testNode.childNodes[0].childNodes[0]).should_contain_text("Child prop value");
    },

    'Should toggle the presence and bindedness of descendant nodes according to the falsiness of the value': function() {
        var someItem = ko.observable(undefined);
        var condition = ko.observable(true);
        testNode.innerHTML = "<div data-bind='ifnot: condition'><span data-bind='text: someItem().occasionallyExistentChildProp'></span></div>";
        ko.applyBindings({ someItem: someItem, condition: condition }, testNode);

        // First it's not there
        value_of(testNode.childNodes[0].childNodes.length).should_be(0);

        // Then it's there
        someItem({ occasionallyExistentChildProp: 'Child prop value' });
        condition(false);
        value_of(testNode.childNodes[0].childNodes.length).should_be(1);
        value_of(testNode.childNodes[0].childNodes[0]).should_contain_text("Child prop value");

        // Then it's gone again
        condition(true);
        someItem(null);
        value_of(testNode.childNodes[0].childNodes.length).should_be(0);
    },

    'Should not interfere with binding context': function() {
        testNode.innerHTML = "<div data-bind='ifnot: false'>Parents: <span data-bind='text: $parents.length'></span></div>";
        ko.applyBindings({ }, testNode);
        value_of(testNode.childNodes[0]).should_contain_text("Parents: 0");
        value_of(ko.contextFor(testNode.childNodes[0].childNodes[1]).$parents.length).should_be(0);
    }
});