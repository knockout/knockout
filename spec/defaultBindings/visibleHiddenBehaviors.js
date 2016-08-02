describe('Binding: Visible/Hidden', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Visible means the node is only visible when the value is true', function () {
        var observable = new ko.observable(false);
        testNode.innerHTML = "<input data-bind='visible:myModelProperty()' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);

        expect(testNode.childNodes[0].style.display).toEqual("none");
        observable(true);
        expect(testNode.childNodes[0].style.display).toEqual("");
    });

    it('Visible should unwrap observables implicitly', function () {
        var observable = new ko.observable(false);
        testNode.innerHTML = "<input data-bind='visible:myModelProperty' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);
        expect(testNode.childNodes[0].style.display).toEqual("none");
    });

    it('Hidden means the node is only visible when the value is false', function () {
        var observable = new ko.observable(false);
        testNode.innerHTML = "<input data-bind='hidden:myModelProperty()' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);

        expect(testNode.childNodes[0].style.display).toEqual("");
        observable(true);
        expect(testNode.childNodes[0].style.display).toEqual("none");
    });

    it('Hidden should unwrap observables implicitly', function () {
        var observable = new ko.observable(true);
        testNode.innerHTML = "<input data-bind='hidden:myModelProperty' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);
        expect(testNode.childNodes[0].style.display).toEqual("none");
    });
});