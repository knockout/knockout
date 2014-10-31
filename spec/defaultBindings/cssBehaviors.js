
describe('Binding: CSS classes', function() {
    var originalClassToggleFn = ko.utils.toggleDomNodeCssClass;

    beforeEach(jasmine.prepareTestNode);
    afterEach(function () {
        ko.utils.toggleDomNodeCssClass = originalClassToggleFn;
    });

    function CssToggleTestCases() {
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
    }

    describe("toggle with className", function () {
        beforeEach(function() {
            ko.utils.toggleDomNodeCssClass = ko.utils.toggleDomNodeClassWithClassName;
        });

        CssToggleTestCases();
    });

    // We skip this for environments/browser that do not support classList.
    if (ko.utils.nodesSupportClassList)
    describe("toggle with classList", function() {
        it("Uses the classList function by default", function () {
            expect(ko.utils.toggleDomNodeCssClass).toEqual(ko.utils.toggleDomNodeClassWithClassList);
        });

        CssToggleTestCases();
    });
});
