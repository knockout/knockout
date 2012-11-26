describe('Binding: Enable/Disable', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Enable means the node is enabled only when the value is true', function () {
        var observable = new ko.observable();
        testNode.innerHTML = "<input data-bind='enable:myModelProperty()' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);

        expect(testNode.childNodes[0].disabled).toEqual(true);
        observable(1);
        expect(testNode.childNodes[0].disabled).toEqual(false);
    });

    it('Disable means the node is enabled only when the value is false', function () {
        var observable = new ko.observable();
        testNode.innerHTML = "<input data-bind='disable:myModelProperty()' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);

        expect(testNode.childNodes[0].disabled).toEqual(false);
        observable(1);
        expect(testNode.childNodes[0].disabled).toEqual(true);
    });

    it('Enable should unwrap observables implicitly', function () {
        var observable = new ko.observable(false);
        testNode.innerHTML = "<input data-bind='enable:myModelProperty' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);
        expect(testNode.childNodes[0].disabled).toEqual(true);
    });

    it('Disable should unwrap observables implicitly', function () {
        var observable = new ko.observable(false);
        testNode.innerHTML = "<input data-bind='disable:myModelProperty' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);
        expect(testNode.childNodes[0].disabled).toEqual(false);
    });
});