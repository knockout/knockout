describe('Binding: Let', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should be able to add custom properties that will be available to all child contexts', function() {
        testNode.innerHTML = "<div data-bind=\"let: { '$customProp': 'my value' }\"><div data-bind='with: true'><div data-bind='text: $customProp'></div></div></div>";
        ko.applyBindings(null, testNode);
        expect(testNode).toContainText("my value");
    });

    it('Should update all child contexts when custom properties are updated', function() {
        var observable = ko.observable(1);
        testNode.innerHTML = "<div data-bind='let: { prop1 : prop()*2 }'><div data-bind='text: prop1'></div></div>";
        ko.applyBindings({prop: observable}, testNode);
        expect(testNode).toContainText("2");

        // change observable
        observable(2);
        expect(testNode).toContainText("4");
    });

    it('Should update all custom properties when the parent context is updated', function() {
        testNode.innerHTML = "<div data-bind='let: {obj1: $data}'><span data-bind='text:obj1.prop1'></span><span data-bind='text:prop2'></span></div>";
        var vm = ko.observable({prop1: "First ", prop2: "view model"});
        ko.applyBindings(vm, testNode);
        expect(testNode).toContainText("First view model");

        // change view model to new object
        vm({prop1: "Second view ", prop2: "model"});
        expect(testNode).toContainText("Second view model");

        // change it again
        vm({prop1: "Third view model", prop2: ""});
        expect(testNode).toContainText("Third view model");
    });
});
