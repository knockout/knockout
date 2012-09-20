describe('Binding: Visible', {
    before_each: JSSpec.prepareTestNode,

    'Should display the node only when the value is true': function () {
        var observable = new ko.observable(false);
        testNode.innerHTML = "<input data-bind='visible:myModelProperty()' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);

        value_of(testNode.childNodes[0].style.display).should_be("none");
        observable(true);
        value_of(testNode.childNodes[0].style.display).should_be("");
    },

    'Should unwrap observables implicitly': function () {
        var observable = new ko.observable(false);
        testNode.innerHTML = "<input data-bind='visible:myModelProperty' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);
        value_of(testNode.childNodes[0].style.display).should_be("none");
    }
});