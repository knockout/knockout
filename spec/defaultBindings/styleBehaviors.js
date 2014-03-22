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

    it('Should respect numeric 0 values', function () {
        var myObservable = new ko.observable(20);
        testNode.innerHTML = "<div data-bind='style: { opacity: opacityValue }'>Hallo</div>";
        ko.applyBindings({ opacityValue: myObservable }, testNode);

        expect(testNode.childNodes[0].style.opacity).toBe("20");
        myObservable(0);
        expect(testNode.childNodes[0].style.opacity).toBe("0");
    });

    it('Should infer numeric unit when not provided for appropriate styles', function () {
        var myObservable = new ko.observable(200);
        testNode.innerHTML = "<div data-bind='style: { width: widthValue }'>Hallo</div>";
        ko.applyBindings({ widthValue: myObservable }, testNode);

        expect(testNode.childNodes[0].style.width).toBe("200px");
        myObservable(50);
        expect(testNode.childNodes[0].style.width).toBe("50px");
    });
});