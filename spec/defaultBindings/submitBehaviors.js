describe('Binding: Submit', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should invoke the supplied function on submit and prevent default action, using model as \'this\' param and the form node as a param to the handler', function () {
        var firstParamStored;
        var model = { wasCalled: false, doCall: function (firstParam) { this.wasCalled = true; firstParamStored = firstParam; } };
        testNode.innerHTML = "<form data-bind='submit:doCall' />";
        var formNode = testNode.childNodes[0];
        ko.applyBindings(model, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "submit");
        expect(model.wasCalled).toEqual(true);
        expect(firstParamStored).toEqual(formNode);
    });

    it('Should be able to prevent bubbling of submit event using the submitBubble:false option', function() {
        var model = {
            innerWasCalled: false, innerDoCall: function () { this.innerWasCalled = true; },
            outerWasCalled: false, outerDoCall: function () { this.outerWasCalled = true; }
        };
        testNode.innerHTML = "<div data-bind='event:{submit:outerDoCall}'><form data-bind='submit:innerDoCall,submitBubble:false' /></div>";
        var formNode = testNode.childNodes[0].childNodes[0];
        ko.applyBindings(model, testNode);
        ko.utils.triggerEvent(formNode, "submit");
        expect(model.innerWasCalled).toEqual(true);
        expect(model.outerWasCalled).toEqual(false);
    });
});