describe('Binding: Submit', {
    before_each: JSSpec.prepareTestNode,

    'Should invoke the supplied function on submit and prevent default action, using model as \'this\' param and the form node as a param to the handler': function () {
        var firstParamStored;
        var model = { wasCalled: false, doCall: function (firstParam) { this.wasCalled = true; firstParamStored = firstParam; } };
        testNode.innerHTML = "<form data-bind='submit:doCall' />";
        var formNode = testNode.childNodes[0];
        ko.applyBindings(model, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "submit");
        value_of(model.wasCalled).should_be(true);
        value_of(firstParamStored).should_be(formNode);
    }
});