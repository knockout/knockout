
describe('Binding: CSS classes', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should give the element the specific CSS class only when the specified value is true', function () {
        var observable1 = new ko.observable();
        var observable2 = new ko.observable(true);
        testNode.innerHTML = "<div class='unrelatedClass1 unrelatedClass2' data-bind='css: { myRule: someModelProperty, anotherRule: anotherModelProperty }'>Hallo</div>";
        ko.applyBindings({ someModelProperty: observable1, anotherModelProperty: observable2 }, testNode);

        expect(testNode.childNodes[0].className).toEqual("unrelatedClass1 unrelatedClass2 anotherRule");
        observable1(true);
        expect(testNode.childNodes[0].className).toEqual("unrelatedClass1 unrelatedClass2 anotherRule myRule");
        observable2(false);
        expect(testNode.childNodes[0].className).toEqual("unrelatedClass1 unrelatedClass2 myRule");
    });

    it('Should give the element a single CSS class without a leading space when the specified value is true', function() {
        var observable1 = new ko.observable();
        testNode.innerHTML = "<div data-bind='css: { myRule: someModelProperty }'>Hallo</div>";
        ko.applyBindings({ someModelProperty: observable1 }, testNode);

        expect(testNode.childNodes[0].className).toEqual("");
        observable1(true);
        expect(testNode.childNodes[0].className).toEqual("myRule");
    });

    it('Should toggle multiple CSS classes if specified as a single string separated by spaces', function() {
        var observable1 = new ko.observable();
        testNode.innerHTML = "<div class='unrelatedClass1' data-bind='css: { \"myRule _another-Rule123\": someModelProperty }'>Hallo</div>";
        ko.applyBindings({ someModelProperty: observable1 }, testNode);

        expect(testNode.childNodes[0].className).toEqual("unrelatedClass1");
        observable1(true);
        expect(testNode.childNodes[0].className).toEqual("unrelatedClass1 myRule _another-Rule123");
        observable1(false);
        expect(testNode.childNodes[0].className).toEqual("unrelatedClass1");
    });

    it('Should set/change dynamic CSS class(es) if string is specified', function() {
        var observable1 = new ko.observable("");
        testNode.innerHTML = "<div class='unrelatedClass1' data-bind='css: someModelProperty'>Hallo</div>";
        ko.applyBindings({ someModelProperty: observable1 }, testNode);

        expect(testNode.childNodes[0].className).toEqual("unrelatedClass1");
        observable1("my-Rule");
        expect(testNode.childNodes[0].className).toEqual("unrelatedClass1 my-Rule");
        observable1("another_Rule  my-Rule");
        expect(testNode.childNodes[0].className).toEqual("unrelatedClass1 another_Rule my-Rule");
        observable1(undefined);
        expect(testNode.childNodes[0].className).toEqual("unrelatedClass1");
    });

    it('Should work with any arbitrary class names', function() {
        // See https://github.com/SteveSanderson/knockout/issues/704
        var observable1 = new ko.observable();
        testNode.innerHTML = "<div data-bind='css: { \"complex/className complex.className\" : someModelProperty }'>Something</div>";
        ko.applyBindings({ someModelProperty: observable1 }, testNode);

        expect(testNode.childNodes[0].className).toEqual("");
        observable1(true);
        expect(testNode.childNodes[0].className).toEqual("complex/className complex.className");
    });

    // When there is SVG support in the browser, we want to ensure the CSS binding works with Knockout.
    // 
    // According to http://caniuse.com/ 
    //  - IE9+ supports SVG (http://caniuse.com/#search=svg)
    //  - IE10+ supports classList (http://caniuse.com/#search=classList)
    // So we run the following test for SVG from
    // - http://stackoverflow.com/questions/4118254
    // See also:
    // - http://voormedia.com/blog/2012/10/displaying-and-detecting-support-for-svg-images
    // - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/svg.js
    it("should change the class of an SVG tag if classList is supported", function () {
        if ('classList' in document.createElement('div')) {
            var observable = ko.observable();
            testNode.innerHTML = "<svg class='Y' data-bind='css: {x: someModelProperty}'></svg>";
            ko.applyBindings({someModelProperty: observable}, testNode);
            expect(testNode.childNodes[0].getAttribute('class')).toEqual("Y");
            observable(true);
            expect(testNode.childNodes[0].getAttribute('class')).toEqual("Y x");
        }
    });

    it('Should change dynamic CSS class(es) if null is specified', function() {
        // See https://github.com/knockout/knockout/issues/1468
        var observable1 = new ko.observable({});
        testNode.innerHTML = "<div class='unrelatedClass1' data-bind='css: someModelProperty'>Hallo</div>";
        ko.applyBindings({ someModelProperty: observable1 }, testNode);
        expect(testNode.childNodes[0].className).toEqual("unrelatedClass1");
        observable1("my-Rule");
        expect(testNode.childNodes[0].className).toEqual("unrelatedClass1 my-Rule");
        observable1(null);
        expect(testNode.childNodes[0].className).toEqual("unrelatedClass1");
        observable1("my-Rule");
        expect(testNode.childNodes[0].className).toEqual("unrelatedClass1 my-Rule");
    });
});
