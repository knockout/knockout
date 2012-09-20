describe('Binding: Enable/Disable', {
    before_each: JSSpec.prepareTestNode,

    'Enable means the node is enabled only when the value is true': function () {
        var observable = new ko.observable();
        testNode.innerHTML = "<input data-bind='enable:myModelProperty()' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);

        value_of(testNode.childNodes[0].disabled).should_be(true);
        observable(1);
        value_of(testNode.childNodes[0].disabled).should_be(false);
    },

    'Disable means the node is enabled only when the value is false': function () {
        var observable = new ko.observable();
        testNode.innerHTML = "<input data-bind='disable:myModelProperty()' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);

        value_of(testNode.childNodes[0].disabled).should_be(false);
        observable(1);
        value_of(testNode.childNodes[0].disabled).should_be(true);
    },

    'Enable should unwrap observables implicitly': function () {
        var observable = new ko.observable(false);
        testNode.innerHTML = "<input data-bind='enable:myModelProperty' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);
        value_of(testNode.childNodes[0].disabled).should_be(true);
    },

    'Disable should unwrap observables implicitly': function () {
        var observable = new ko.observable(false);
        testNode.innerHTML = "<input data-bind='disable:myModelProperty' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);
        value_of(testNode.childNodes[0].disabled).should_be(false);
    }
});