describe('Binding: Click', {
    // This is just a special case of the "event" binding, so not necessary to respecify all its behaviours
    before_each: JSSpec.prepareTestNode,

    'Should invoke the supplied function on click, using model as \'this\' param and first arg, and event as second arg': function () {
        var model = {
            wasCalled: false,
            doCall: function (arg1, arg2) {
                this.wasCalled = true;
                value_of(arg1).should_be(model);
                value_of(arg2.type).should_be("click");
            }
        };
        testNode.innerHTML = "<button data-bind='click:doCall'>hey</button>";
        ko.applyBindings(model, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        value_of(model.wasCalled).should_be(true);
    }
});
