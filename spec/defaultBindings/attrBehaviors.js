describe('Binding: Attr', {
    before_each: JSSpec.prepareTestNode,

    'Should be able to set arbitrary attribute values': function() {
        var model = { myValue: "first value" };
        testNode.innerHTML = "<div data-bind='attr: {firstAttribute: myValue, \"second-attribute\": true}'></div>";
        ko.applyBindings(model, testNode);
        value_of(testNode.childNodes[0].getAttribute("firstAttribute")).should_be("first value");
        value_of(testNode.childNodes[0].getAttribute("second-attribute")).should_be("true");
    },

    'Should be able to set \"name\" attribute, even on IE6-7': function() {
        var myValue = ko.observable("myName");
        testNode.innerHTML = "<input data-bind='attr: { name: myValue }' />";
        ko.applyBindings({ myValue: myValue }, testNode);
        value_of(testNode.childNodes[0].name).should_be("myName");
        if (testNode.childNodes[0].outerHTML) { // Old Firefox doesn't support outerHTML
            value_of(testNode.childNodes[0].outerHTML).should_match('name="?myName"?');
        }
        value_of(testNode.childNodes[0].getAttribute("name")).should_be("myName");

        // Also check we can remove it (which, for a name attribute, means setting it to an empty string)
        myValue(false);
        value_of(testNode.childNodes[0].name).should_be("");
        if (testNode.childNodes[0].outerHTML) { // Old Firefox doesn't support outerHTML
            value_of(testNode.childNodes[0].outerHTML).should_not_match('name="?([^">]+)');
        }
        value_of(testNode.childNodes[0].getAttribute("name")).should_be("");
    },

    'Should respond to changes in an observable value': function() {
        var model = { myprop : ko.observable("initial value") };
        testNode.innerHTML = "<div data-bind='attr: { someAttrib: myprop }'></div>";
        ko.applyBindings(model, testNode);
        value_of(testNode.childNodes[0].getAttribute("someAttrib")).should_be("initial value");

        // Change the observable; observe it reflected in the DOM
        model.myprop("new value");
        value_of(testNode.childNodes[0].getAttribute("someAttrib")).should_be("new value");
    },

    'Should remove the attribute if the value is strictly false, null, or undefined': function() {
        var model = { myprop : ko.observable() };
        testNode.innerHTML = "<div data-bind='attr: { someAttrib: myprop }'></div>";
        ko.applyBindings(model, testNode);
        ko.utils.arrayForEach([false, null, undefined], function(testValue) {
            model.myprop("nonempty value");
            value_of(testNode.childNodes[0].getAttribute("someAttrib")).should_be("nonempty value");
            model.myprop(testValue);
            value_of(testNode.childNodes[0].getAttribute("someAttrib")).should_be(null);
        });
    },

    'Should be able to set class attribute and access it using className property': function() {
        var model = { myprop : ko.observable("newClass") };
        testNode.innerHTML = "<div class='oldClass' data-bind=\"attr: {'class': myprop}\"></div>";
        value_of(testNode.childNodes[0].className).should_be("oldClass");
        ko.applyBindings(model, testNode);
        value_of(testNode.childNodes[0].className).should_be("newClass");
        // Should be able to clear class also
        model.myprop(undefined);
        value_of(testNode.childNodes[0].className).should_be("");
        value_of(testNode.childNodes[0].getAttribute("class")).should_be(null);
    }
});