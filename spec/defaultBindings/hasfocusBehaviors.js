describe('Binding: Hasfocus', function() {
    beforeEach(jasmine.prepareTestNode);
    beforeEach(function() { waits(1); }); // Workaround for spurious focus-timing-related failures on IE8 (issue #736)

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

    it('Should be aliased as hasFocus as well as hasfocus', function() {
        expect(ko.bindingHandlers.hasFocus).toEqual(ko.bindingHandlers.hasfocus);
    });

    it('Should not unnecessarily focus or blur an element that is already focused/blurred', function() {
        // This is the closest we can get to representing issue #698 as a spec
        var model = { isFocused: ko.observable({}) };
        testNode.innerHTML = "<input data-bind='hasfocus: isFocused' />";
        ko.applyBindings(model, testNode);

        // The elem is already focused, so changing the model value to a different truthy value
        // shouldn't cause any additional focus events
        var didFocusAgain = false;
        ko.utils.registerEventHandler(testNode.childNodes[0], "focusin", function() { didFocusAgain = true });
        model.isFocused.valueHasMutated();
        expect(didFocusAgain).toEqual(false);

        // Similarly, when the elem is already blurred, changing the model value to a different
        // falsey value shouldn't cause any additional blur events
        model.isFocused(false);
        var didBlurAgain = false;
        ko.utils.registerEventHandler(testNode.childNodes[0], "focusout", function() { didBlurAgain = true });
        model.isFocused(null);
        expect(didBlurAgain).toEqual(false);
    });

    it('Should not cause unrelated items to lose focus when initialized with false', function () {
        // See #1893
        testNode.innerHTML = '<input data-bind="hasFocus: true" value="This should be focused initially" /><input data-bind="hasFocus: false" value="This should not be focused" />';
        ko.applyBindings({}, testNode);

        // Can only test for focus in browsers that support it
        if ("activeElement" in document) {
            expect(document.activeElement).toBe(testNode.childNodes[0]);
        }
    });
});