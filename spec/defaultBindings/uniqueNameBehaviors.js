describe('Binding: Unique Name', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should apply a different name to each element', function () {
        testNode.innerHTML = "<div data-bind='uniqueName: true'></div><div data-bind='uniqueName: true'></div>";
        ko.applyBindings({}, testNode);

        expect(testNode.childNodes[0].name.length > 0).toEqual(true);
        expect(testNode.childNodes[1].name.length > 0).toEqual(true);
        expect(testNode.childNodes[0].name == testNode.childNodes[1].name).toEqual(false);
    });
});