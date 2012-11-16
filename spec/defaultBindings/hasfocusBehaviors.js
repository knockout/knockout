describe('Binding: Hasfocus', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should respond to changes on an observable value by blurring or focusing the element', function() {
        var currentState;
        var model = { myVal: ko.observable() }
        testNode.innerHTML = "<input data-bind='hasfocus: myVal' /><input />";
        ko.applyBindings(model, testNode);
        ko.utils.registerEventHandler(testNode.childNodes[0], "focusin", function() { currentState = true });
        ko.utils.registerEventHandler(testNode.childNodes[0], "focusout",  function() { currentState = false });

        // When the value becomes true, we focus
        model.myVal(true);
        expect(currentState).toEqual(true);

        // When the value becomes false, we blur
        model.myVal(false);
        expect(currentState).toEqual(false);
    });

    it('Should set an observable value to be true on focus and false on blur', function() {
        var model = { myVal: ko.observable() }
        testNode.innerHTML = "<input data-bind='hasfocus: myVal' /><input />";
        ko.applyBindings(model, testNode);

        // Need to raise "focusin" and "focusout" manually, because simply calling ".focus()" and ".blur()"
        // in IE doesn't reliably trigger the "focus" and "blur" events synchronously

        testNode.childNodes[0].focus();
        ko.utils.triggerEvent(testNode.childNodes[0], "focusin");
        expect(model.myVal()).toEqual(true);

        // Move the focus elsewhere
        testNode.childNodes[1].focus();
        ko.utils.triggerEvent(testNode.childNodes[0], "focusout");
        expect(model.myVal()).toEqual(false);

        // If the model value becomes true after a blur, we re-focus the element
        // (Represents issue #672, where this wasn't working)
        var didFocusExpectedElement = false;
        ko.utils.registerEventHandler(testNode.childNodes[0], "focusin", function() { didFocusExpectedElement = true });
        model.myVal(true);
        expect(didFocusExpectedElement).toEqual(true);
    });

    it('Should set a non-observable value to be true on focus and false on blur', function() {
        var model = { myVal: null }
        testNode.innerHTML = "<input data-bind='hasfocus: myVal' /><input />";
        ko.applyBindings(model, testNode);

        testNode.childNodes[0].focus();
        ko.utils.triggerEvent(testNode.childNodes[0], "focusin");
        expect(model.myVal).toEqual(true);

        // Move the focus elsewhere
        testNode.childNodes[1].focus();
        ko.utils.triggerEvent(testNode.childNodes[0], "focusout");
        expect(model.myVal).toEqual(false);
    });
});