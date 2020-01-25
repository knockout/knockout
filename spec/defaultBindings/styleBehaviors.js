describe('Binding: CSS style', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should give the element the specified CSS style value', function () {
        var myObservable = new ko.observable("red");
        testNode.innerHTML = "<div data-bind='style: { backgroundColor: colorValue }'>Hallo</div>";
        ko.applyBindings({ colorValue: myObservable }, testNode);

        expect(testNode.childNodes[0].style.backgroundColor).toEqualOneOf(["red", "#ff0000"]); // Opera returns style color values in #rrggbb notation, unlike other browsers
        myObservable("green");
        expect(testNode.childNodes[0].style.backgroundColor).toEqualOneOf(["green", "#008000"]);
        myObservable(undefined);
        expect(testNode.childNodes[0].style.backgroundColor).toEqual("");
    });

    it('Should be able to use standard CSS style name (rather than JavaScript name)', function () {
        var myObservable = new ko.observable("red");
        testNode.innerHTML = "<div data-bind='style: { \"background-color\": colorValue }'>Hallo</div>";
        ko.applyBindings({ colorValue: myObservable }, testNode);

        expect(testNode.childNodes[0].style.backgroundColor).toEqualOneOf(["red", "#ff0000"]); // Opera returns style color values in #rrggbb notation, unlike other browsers
        myObservable("green");
        expect(testNode.childNodes[0].style.backgroundColor).toEqualOneOf(["green", "#008000"]);
        myObservable(undefined);
        expect(testNode.childNodes[0].style.backgroundColor).toEqual("");
    });

    it('Should be able to apply the numeric value to a style and have it converted to px', function() {
        // See https://github.com/knockout/knockout/issues/231
        testNode.innerHTML = "<div data-bind='style: { width: 10 }'></div>";
        ko.applyBindings(null, testNode);
        expect(testNode.childNodes[0].style.width).toBe("10px");
    });

    it('Should be able to apply the numeric value zero to a style', function() {
        // Represents https://github.com/knockout/knockout/issues/972
        testNode.innerHTML = "<div data-bind='style: { width: 0 }'></div>";
        ko.applyBindings(null, testNode);
        expect(testNode.childNodes[0].style.width).toEqualOneOf(["0px", "0pt"]);
    });

    it('Should be able to apply the numeric value to a style that doesn\'t accept pixels', function() {
        testNode.innerHTML = "<div data-bind='style: { zIndex: 10 }'></div>";
        ko.applyBindings(null, testNode);
        expect(testNode.childNodes[0].style.zIndex).toEqualOneOf(["10", 10]);
    });

    it('Should be able to use "false" to remove a style', function() {
        // Verifying that the fix for 972 doesn't break this existing behaviour
        testNode.innerHTML = "<div style='width: 100px' data-bind='style: { width: false }'></div>";
        ko.applyBindings(null, testNode);
        expect(testNode.childNodes[0].style.width).toBe("");
    });

    if (window.CSS && window.CSS.supports && window.CSS.supports('--a', 0)) {
        it('Should be able to assign values to custom CSS properties', function() {
            var customWidth = ko.observable();
            testNode.innerHTML = "<div style=\"width: var(--custom-width)\" data-bind=\"style: {'--custom-width': customWidth}\"></div>";

            ko.applyBindings({customWidth: customWidth}, testNode);
            expect(testNode.childNodes[0].style.getPropertyValue("--custom-width")).toBe("");

            customWidth("100px");
            expect(testNode.childNodes[0].style.getPropertyValue("--custom-width")).toBe("100px");

            customWidth(false);
            expect(testNode.childNodes[0].style.getPropertyValue("--custom-width")).toBe("");
        });
    }

    it('Should properly respond to changes in the observable, adding px when appropriate', function() {
        var width = ko.observable();
        testNode.innerHTML = "<div data-bind='style: { width: width }'></div>";

        ko.applyBindings({width: width}, testNode);
        expect(testNode.childNodes[0].style.width).toBe("");

        width(10);
        expect(testNode.childNodes[0].style.width).toBe("10px");

        width(20);
        expect(testNode.childNodes[0].style.width).toBe("20px");

        width(false);
        expect(testNode.childNodes[0].style.width).toBe("");
    });
});
