describe('Binding: Click', function() {
    // This is just a special case of the "event" binding, so not necessary to respecify all its behaviours
    beforeEach(jasmine.prepareTestNode);

    it('Should invoke the supplied function on click, using model as \'this\' param and first arg, and event as second arg', function () {
        var model = {
            wasCalled: false,
            doCall: function (arg1, arg2) {
                this.wasCalled = true;
                expect(arg1).toEqual(model);
                expect(arg2.type).toEqual("click");
            }
        };
        testNode.innerHTML = "<button data-bind='click:doCall'>hey</button>";
        ko.applyBindings(model, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        expect(model.wasCalled).toEqual(true);
    });
});
