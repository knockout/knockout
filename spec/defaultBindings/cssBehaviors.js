describe('Binding: CSS class name', {
    before_each: JSSpec.prepareTestNode,

    'Should give the element the specific CSS class only when the specified value is true': function () {
        var observable1 = new ko.observable();
        var observable2 = new ko.observable(true);
        testNode.innerHTML = "<div class='unrelatedClass1 unrelatedClass2' data-bind='css: { myRule: someModelProperty, anotherRule: anotherModelProperty }'>Hallo</div>";
        ko.applyBindings({ someModelProperty: observable1, anotherModelProperty: observable2 }, testNode);

        value_of(testNode.childNodes[0].className).should_be("unrelatedClass1 unrelatedClass2 anotherRule");
        observable1(true);
        value_of(testNode.childNodes[0].className).should_be("unrelatedClass1 unrelatedClass2 anotherRule myRule");
        observable2(false);
        value_of(testNode.childNodes[0].className).should_be("unrelatedClass1 unrelatedClass2 myRule");
    },

    'Should give the element a single CSS class without a leading space when the specified value is true': function() {
        var observable1 = new ko.observable();
        testNode.innerHTML = "<div data-bind='css: { myRule: someModelProperty }'>Hallo</div>";
        ko.applyBindings({ someModelProperty: observable1 }, testNode);

        value_of(testNode.childNodes[0].className).should_be("");
        observable1(true);
        value_of(testNode.childNodes[0].className).should_be("myRule");
    },

    'Should toggle multiple CSS classes if specified as a single string separated by spaces': function() {
        var observable1 = new ko.observable();
        testNode.innerHTML = "<div class='unrelatedClass1' data-bind='css: { \"myRule _another-Rule123\": someModelProperty }'>Hallo</div>";
        ko.applyBindings({ someModelProperty: observable1 }, testNode);

        value_of(testNode.childNodes[0].className).should_be("unrelatedClass1");
        observable1(true);
        value_of(testNode.childNodes[0].className).should_be("unrelatedClass1 myRule _another-Rule123");
        observable1(false);
        value_of(testNode.childNodes[0].className).should_be("unrelatedClass1");
    },

    'Should set/change dynamic CSS class(es) if string is specified': function() {
        var observable1 = new ko.observable("");
        testNode.innerHTML = "<div class='unrelatedClass1' data-bind='css: someModelProperty'>Hallo</div>";
        ko.applyBindings({ someModelProperty: observable1 }, testNode);

        value_of(testNode.childNodes[0].className).should_be("unrelatedClass1");
        observable1("my-Rule");
        value_of(testNode.childNodes[0].className).should_be("unrelatedClass1 my-Rule");
        observable1("another_Rule  my-Rule");
        value_of(testNode.childNodes[0].className).should_be("unrelatedClass1 another_Rule my-Rule");
        observable1(undefined);
        value_of(testNode.childNodes[0].className).should_be("unrelatedClass1");
    }
});