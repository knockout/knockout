describe('Binding: Visible', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should display the node only when the value is true', function () {
        var observable = new ko.observable(false);
        testNode.innerHTML = "<input data-bind='visible:myModelProperty()' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);

        expect(testNode.childNodes[0].style.display).toEqual("none");
        observable(true);
        expect(testNode.childNodes[0].style.display).toEqual("");
    });

    it('Should unwrap observables implicitly', function () {
        var observable = new ko.observable(false);
        testNode.innerHTML = "<input data-bind='visible:myModelProperty' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);
        expect(testNode.childNodes[0].style.display).toEqual("none");
    });
});