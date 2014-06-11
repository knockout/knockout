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

    it('Should be able to apply the numeric value zero to a style', function() {
        // Represents https://github.com/knockout/knockout/issues/972
        testNode.innerHTML = "<div data-bind='style: { width: 0 }'></div>";
        ko.applyBindings(null, testNode);
        expect(testNode.childNodes[0].style.width).toBe("0px");
    });

    it('Should be able to use "false" to remove a style', function() {
        // Verifying that the fix for 972 doesn't break this existing behaviour
        testNode.innerHTML = "<div style='width: 100px' data-bind='style: { width: false }'></div>";
        ko.applyBindings(null, testNode);
        expect(testNode.childNodes[0].style.width).toBe("");
    });
});