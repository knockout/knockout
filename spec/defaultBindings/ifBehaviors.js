describe('Binding: If', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should remove descendant nodes from the document (and not bind them) if the value is falsey', function() {
        testNode.innerHTML = "<div data-bind='if: someItem'><span data-bind='text: someItem.nonExistentChildProp'></span></div>";
        expect(testNode.childNodes[0].childNodes.length).toEqual(1);
        ko.applyBindings({ someItem: null }, testNode);
        expect(testNode.childNodes[0].childNodes.length).toEqual(0);
    });

    it('Should leave descendant nodes in the document (and bind them) if the value is truthy, independently of the active template engine', function() {
        ko.setTemplateEngine(new ko.templateEngine()); // This template engine will just throw errors if you try to use it
        testNode.innerHTML = "<div data-bind='if: someItem'><span data-bind='text: someItem.existentChildProp'></span></div>";
        expect(testNode.childNodes.length).toEqual(1);
        ko.applyBindings({ someItem: { existentChildProp: 'Child prop value' } }, testNode);
        expect(testNode.childNodes[0].childNodes.length).toEqual(1);
        expect(testNode.childNodes[0].childNodes[0]).toContainText("Child prop value");
    });

    it('Should leave descendant nodes unchanged if the value is truthy and remains truthy when changed', function() {
        var someItem = ko.observable(true);
        testNode.innerHTML = "<div data-bind='if: someItem'><span></span></div>";
        var originalNode = testNode.childNodes[0].childNodes[0];

        // Value is initially true, so nodes are retained
        ko.applyBindings({ someItem: someItem }, testNode);
        expect(testNode.childNodes[0].childNodes[0].tagName.toLowerCase()).toEqual("span");
        expect(testNode.childNodes[0].childNodes[0]).toEqual(originalNode);

        // Change the value to a different truthy value; see the previous SPAN remains
        someItem('different truthy value');
        expect(testNode.childNodes[0].childNodes[0].tagName.toLowerCase()).toEqual("span");
        expect(testNode.childNodes[0].childNodes[0]).toEqual(originalNode);
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
});
