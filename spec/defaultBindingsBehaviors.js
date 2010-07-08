/// <reference path="../src/subscribables/observable.js" />

function prepareTestNode() {
    var existingNode = document.getElementById("testNode");
    if (existingNode != null)
        existingNode.parentNode.removeChild(existingNode);
    testNode = document.createElement("div");
    testNode.id = "testNode";
    document.body.appendChild(testNode);
}

function getSelectedValuesFromSelectNode(selectNode) {
    var selectedNodes = ko.utils.arrayFilter(selectNode.childNodes, function (node) { return node.selected; });
    return ko.utils.arrayMap(selectedNodes, function (node) { return node.value; });
}

describe('Binding: Enable/Disable', {
    before_each: prepareTestNode,

    'Enable means the node is enabled only when the value is true': function () {
        var observable = new ko.observable();
        testNode.innerHTML = "<input data-bind='enable:myModelProperty()' />";
        ko.applyBindings(testNode, { myModelProperty: observable });

        value_of(testNode.childNodes[0].disabled).should_be(true);
        observable(1);
        value_of(testNode.childNodes[0].disabled).should_be(false);
    },

    'Disable means the node is enabled only when the value is false': function () {
        var observable = new ko.observable();
        testNode.innerHTML = "<input data-bind='disable:myModelProperty()' />";
        ko.applyBindings(testNode, { myModelProperty: observable });

        value_of(testNode.childNodes[0].disabled).should_be(false);
        observable(1);
        value_of(testNode.childNodes[0].disabled).should_be(true);
    },

    'Enable should unwrap observables implicitly': function () {
        var observable = new ko.observable(false);
        testNode.innerHTML = "<input data-bind='enable:myModelProperty' />";
        ko.applyBindings(testNode, { myModelProperty: observable });
        value_of(testNode.childNodes[0].disabled).should_be(true);
    },

    'Disable should unwrap observables implicitly': function () {
        var observable = new ko.observable(false);
        testNode.innerHTML = "<input data-bind='disable:myModelProperty' />";
        ko.applyBindings(testNode, { myModelProperty: observable });
        value_of(testNode.childNodes[0].disabled).should_be(false);
    }
});

describe('Binding: Visible', {
    before_each: prepareTestNode,

    'Should display the node only when the value is true': function () {
        var observable = new ko.observable(false);
        testNode.innerHTML = "<input data-bind='visible:myModelProperty()' />";
        ko.applyBindings(testNode, { myModelProperty: observable });

        value_of(testNode.childNodes[0].style.display).should_be("none");
        observable(true);
        value_of(testNode.childNodes[0].style.display).should_be("");
    },

    'Should unwrap observables implicitly': function () {
        var observable = new ko.observable(false);
        testNode.innerHTML = "<input data-bind='visible:myModelProperty' />";
        ko.applyBindings(testNode, { myModelProperty: observable });
        value_of(testNode.childNodes[0].style.display).should_be("none");
    }
});

describe('Binding: Value', {
    before_each: prepareTestNode,

    'Should assign the value to the node': function () {
        testNode.innerHTML = "<input data-bind='value:123' />";
        ko.applyBindings(testNode);
        value_of(testNode.childNodes[0].value).should_be(123);
    },

    'For observable values, should unwrap the value and update on change': function () {
        var myobservable = new ko.observable(123);
        testNode.innerHTML = "<input data-bind='value:someProp' />";
        ko.applyBindings(testNode, { someProp: myobservable });
        value_of(testNode.childNodes[0].value).should_be(123);
        myobservable(456);
        value_of(testNode.childNodes[0].value).should_be(456);
    },

    'For writeable observable values, should catch the node\'s onchange and write values back to the observable': function () {
        var myobservable = new ko.observable(123);
        testNode.innerHTML = "<input data-bind='value:someProp' />";
        ko.applyBindings(testNode, { someProp: myobservable });
        testNode.childNodes[0].value = "some user-entered value";
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        value_of(myobservable()).should_be("some user-entered value");
    },

    'For non-observable property values, should catch the node\'s onchange and write values back to the property': function () {
        var model = { modelProperty: 123 };
        testNode.innerHTML = "<input data-bind='value: modelProperty' />";
        ko.applyBindings(testNode, model);
        value_of(testNode.childNodes[0].value).should_be(123);

        testNode.childNodes[0].value = 456;
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        value_of(model.modelProperty).should_be(456);
    },

    'Should only register one single onchange handler': function () {
        var notifiedValues = [];
        var myobservable = new ko.observable(123);
        myobservable.subscribe(function (value) { notifiedValues.push(value); });
        value_of(notifiedValues.length).should_be(0);

        testNode.innerHTML = "<input data-bind='value:someProp' />";
        ko.applyBindings(testNode, { someProp: myobservable });

        // Implicitly observe the number of handlers by seeing how many times "myobservable"
        // receives a new value for each onchange on the text box. If there's just one handler,
        // we'll see one new value per onchange event. More handlers cause more notifications.
        testNode.childNodes[0].value = "ABC";
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        value_of(notifiedValues.length).should_be(1);

        testNode.childNodes[0].value = "DEF";
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        value_of(notifiedValues.length).should_be(2);
    }
})

describe('Binding: Options', {
    before_each: prepareTestNode,

    'Should only be applicable to SELECT nodes': function () {
        var threw = false;
        testNode.innerHTML = "<input data-bind='options:{}' />";
        try { ko.applyBindings(testNode, {}); }
        catch (ex) { threw = true; }
        value_of(threw).should_be(true);
    },

    'Should set the SELECT node\'s options set to match the model value': function () {
        var observable = new ko.observableArray(["A", "B", "C"]);
        testNode.innerHTML = "<select data-bind='options:myValues'><option>should be deleted</option></select>";
        ko.applyBindings(testNode, { myValues: observable });
        var displayedOptions = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.innerHTML; });
        value_of(displayedOptions).should_be(["A", "B", "C"]);
    },

    'Should update the SELECT node\'s options if the model changes': function () {
        var observable = new ko.observableArray(["A", "B", "C"]);
        testNode.innerHTML = "<select data-bind='options:myValues'><option>should be deleted</option></select>";
        ko.applyBindings(testNode, { myValues: observable });
        observable.splice(1, 1);
        var displayedOptions = ko.utils.arrayMap(testNode.childNodes[0].childNodes, function (node) { return node.innerHTML; });
        value_of(displayedOptions).should_be(["A", "C"]);
    },

    'Should retain as much selection as possible when changing the SELECT node\'s options': function () {
        var observable = new ko.observableArray(["A", "B", "C"]);
        testNode.innerHTML = "<select data-bind='options:myValues' multiple='multiple'><option>A</option><option selected='selected'>B</option><option selected='selected'>X</option></select>";
        ko.applyBindings(testNode, { myValues: observable });
        value_of(getSelectedValuesFromSelectNode(testNode.childNodes[0])).should_be(["B"]);
    }
});

describe('Binding: Selected Options', {
    before_each: prepareTestNode,

    'Should only be applicable to SELECT nodes': function () {
        var threw = false;
        testNode.innerHTML = "<input data-bind='selectedOptions:[]' />";
        try { ko.applyBindings(testNode, {}); }
        catch (ex) { threw = true; }
        value_of(threw).should_be(true);
    },

    'Should set selection in the SELECT node to match the model': function () {
        var values = new ko.observableArray(["A", "B", "C"]);
        var selection = new ko.observableArray(["B"]);
        testNode.innerHTML = "<select multiple='multiple' data-bind='options:myValues, selectedOptions:mySelection'></select>";
        ko.applyBindings(testNode, { myValues: values, mySelection: selection });

        value_of(getSelectedValuesFromSelectNode(testNode.childNodes[0])).should_be(["B"]);
        selection.push("C");
        value_of(getSelectedValuesFromSelectNode(testNode.childNodes[0])).should_be(["B", "C"]);
    },

    'Should update the model when selection in the SELECT node changes': function () {
        var values = new ko.observableArray(["A", "B", "C"]);
        var selection = new ko.observableArray(["B"]);
        testNode.innerHTML = "<select multiple='multiple' data-bind='options:myValues, selectedOptions:mySelection'></select>";
        ko.applyBindings(testNode, { myValues: values, mySelection: selection });

        value_of(selection()).should_be(["B"]);
        testNode.childNodes[0].childNodes[0].selected = true;
        testNode.childNodes[0].childNodes[1].selected = false;
        testNode.childNodes[0].childNodes[2].selected = true;
        ko.utils.triggerEvent(testNode.childNodes[0], "change");
        value_of(selection()).should_be(["A", "C"]);
    }
});

describe('Binding: Submit', {
    before_each: prepareTestNode,

    'Should invoke the supplied function on submit and prevent default action, using model as \'this\' param': function () {
        var model = { wasCalled: false, doCall: function () { this.wasCalled = true; } };
        testNode.innerHTML = "<form data-bind='submit:doCall' />";
        ko.applyBindings(testNode, model);
        ko.utils.triggerEvent(testNode.childNodes[0], "submit");
        value_of(model.wasCalled).should_be(true);
    }
});

describe('Binding: Click', {
    before_each: prepareTestNode,

    'Should invoke the supplied function on click, using model as \'this\' param': function () {
        var model = { wasCalled: false, doCall: function () { this.wasCalled = true; } };
        testNode.innerHTML = "<button data-bind='click:doCall'>hey</button>";
        ko.applyBindings(testNode, model);
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        value_of(model.wasCalled).should_be(true);
    },

    'Should prevent default action': function () {
        testNode.innerHTML = "<a href='http://www.example.com/' data-bind='click: function() { }'>hey</button>";
        ko.applyBindings(testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        // Assuming we haven't been redirected to http://www.example.com/, this spec has now passed
    }
});

describe('Binding: CSS rule', {
    before_each: prepareTestNode,

    'Should give the element the specific CSS class only when the specified value is true': function () {
        var observable1 = new ko.observable();
        var observable2 = new ko.observable(true);
        testNode.innerHTML = "<div class='unrelatedClass1 unrelatedClass2' data-bind='css: { myRule: someModelProperty, anotherRule: anotherModelProperty }'>Hallo</div>";
        ko.applyBindings(testNode, { someModelProperty: observable1, anotherModelProperty: observable2 });

        value_of(testNode.childNodes[0].className).should_be("unrelatedClass1 unrelatedClass2 anotherRule");
        observable1(true);
        value_of(testNode.childNodes[0].className).should_be("unrelatedClass1 unrelatedClass2 anotherRule myRule");
        observable2(false);
        value_of(testNode.childNodes[0].className).should_be("unrelatedClass1 unrelatedClass2 myRule");
    }
});

describe('Binding: Unique Name', {
    before_each: prepareTestNode,

    'Should apply a different name to each element': function () {
        testNode.innerHTML = "<div data-bind='uniqueName: true'></div><div data-bind='uniqueName: true'></div>";
        ko.applyBindings(testNode, { });

        value_of(testNode.childNodes[0].name.length > 0).should_be(true);
        value_of(testNode.childNodes[1].name.length > 0).should_be(true);
        value_of(testNode.childNodes[0].name == testNode.childNodes[1].name).should_be(false);
    }
});