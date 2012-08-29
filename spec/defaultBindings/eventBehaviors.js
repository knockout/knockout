describe('Binding: Event', {
    before_each: JSSpec.prepareTestNode,

    'Should invoke the supplied function when the event occurs, using model as \'this\' param and first arg, and event as second arg': function () {
        var model = {
            firstWasCalled: false,
            firstHandler: function (passedModel, evt) {
                value_of(evt.type).should_be("click");
                value_of(this).should_be(model);
                value_of(passedModel).should_be(model);

                value_of(model.firstWasCalled).should_be(false);
                model.firstWasCalled = true;
            },

            secondWasCalled: false,
            secondHandler: function (passedModel, evt) {
                value_of(evt.type).should_be("mouseover");
                value_of(this).should_be(model);
                value_of(passedModel).should_be(model);

                value_of(model.secondWasCalled).should_be(false);
                model.secondWasCalled = true;
            }
        };
        testNode.innerHTML = "<button data-bind='event:{click:firstHandler, mouseover:secondHandler, mouseout:null}'>hey</button>";
        ko.applyBindings(model, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        value_of(model.firstWasCalled).should_be(true);
        value_of(model.secondWasCalled).should_be(false);
        ko.utils.triggerEvent(testNode.childNodes[0], "mouseover");
        value_of(model.secondWasCalled).should_be(true);
        ko.utils.triggerEvent(testNode.childNodes[0], "mouseout"); // Shouldn't do anything (specifically, shouldn't throw)
    },

    'Should prevent default action': function () {
        testNode.innerHTML = "<a href='http://www.example.com/' data-bind='event: { click: function() { } }'>hey</button>";
        ko.applyBindings(null, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        // Assuming we haven't been redirected to http://www.example.com/, this spec has now passed
    },

    'Should let bubblable events bubble to parent elements by default': function() {
        var model = {
            innerWasCalled: false, innerDoCall: function () { this.innerWasCalled = true; },
            outerWasCalled: false, outerDoCall: function () { this.outerWasCalled = true; }
        };
        testNode.innerHTML = "<div data-bind='event:{click:outerDoCall}'><button data-bind='event:{click:innerDoCall}'>hey</button></div>";
        ko.applyBindings(model, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], "click");
        value_of(model.innerWasCalled).should_be(true);
        value_of(model.outerWasCalled).should_be(true);
    },

    'Should be able to prevent bubbling of bubblable events using the (eventname)Bubble:false option': function() {
        var model = {
            innerWasCalled: false, innerDoCall: function () { this.innerWasCalled = true; },
            outerWasCalled: false, outerDoCall: function () { this.outerWasCalled = true; }
        };
        testNode.innerHTML = "<div data-bind='event:{click:outerDoCall}'><button data-bind='event:{click:innerDoCall}, clickBubble:false'>hey</button></div>";
        ko.applyBindings(model, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], "click");
        value_of(model.innerWasCalled).should_be(true);
        value_of(model.outerWasCalled).should_be(false);
    },

    'Should be able to supply handler params using "bind" helper': function() {
        // Using "bind" like this just eliminates the function literal wrapper - it's purely stylistic
        var didCallHandler = false, someObj = {};
        var myHandler = function() {
            value_of(this).should_be(someObj);
            value_of(arguments.length).should_be(5);

            // First x args will be the ones you bound
            value_of(arguments[0]).should_be(123);
            value_of(arguments[1]).should_be("another");
            value_of(arguments[2].something).should_be(true);

            // Then you get the args we normally pass to handlers, i.e., the model then the event
            value_of(arguments[3]).should_be(viewModel);
            value_of(arguments[4].type).should_be("mouseover");

            didCallHandler = true;
        };
        testNode.innerHTML = "<button data-bind='event:{ mouseover: myHandler.bind(someObj, 123, \"another\", { something: true }) }'>hey</button>";
        var viewModel = { myHandler: myHandler, someObj: someObj };
        ko.applyBindings(viewModel, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "mouseover");
        value_of(didCallHandler).should_be(true);
    }
});