describe('Binding: Event', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should invoke the supplied function when the event occurs, using model as \'this\' param and first arg, and event as second arg', function () {
        var model = {
            firstWasCalled: false,
            firstHandler: function (passedModel, evt) {
                expect(evt.type).toEqual("click");
                expect(this).toEqual(model);
                expect(passedModel).toEqual(model);

                expect(model.firstWasCalled).toEqual(false);
                model.firstWasCalled = true;
            },

            secondWasCalled: false,
            secondHandler: function (passedModel, evt) {
                expect(evt.type).toEqual("mouseover");
                expect(this).toEqual(model);
                expect(passedModel).toEqual(model);

                expect(model.secondWasCalled).toEqual(false);
                model.secondWasCalled = true;
            }
        };
        testNode.innerHTML = "<button data-bind='event:{click:firstHandler, mouseover:secondHandler, mouseout:null}'>hey</button>";
        ko.applyBindings(model, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        expect(model.firstWasCalled).toEqual(true);
        expect(model.secondWasCalled).toEqual(false);
        ko.utils.triggerEvent(testNode.childNodes[0], "mouseover");
        expect(model.secondWasCalled).toEqual(true);
        ko.utils.triggerEvent(testNode.childNodes[0], "mouseout"); // Shouldn't do anything (specifically, shouldn't throw)
    });

    it('Should prevent default action', function () {
        testNode.innerHTML = "<a href='http://www.example.com/' data-bind='event: { click: function() { } }'>hey</button>";
        ko.applyBindings(null, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "click");
        // Assuming we haven't been redirected to http://www.example.com/, this spec has now passed
    });

    it('Should let bubblable events bubble to parent elements by default', function() {
        var model = {
            innerWasCalled: false, innerDoCall: function () { this.innerWasCalled = true; },
            outerWasCalled: false, outerDoCall: function () { this.outerWasCalled = true; }
        };
        testNode.innerHTML = "<div data-bind='event:{click:outerDoCall}'><button data-bind='event:{click:innerDoCall}'>hey</button></div>";
        ko.applyBindings(model, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], "click");
        expect(model.innerWasCalled).toEqual(true);
        expect(model.outerWasCalled).toEqual(true);
    });

    it('Should be able to prevent bubbling of bubblable events using the (eventname)Bubble:false option', function() {
        var model = {
            innerWasCalled: false, innerDoCall: function () { this.innerWasCalled = true; },
            outerWasCalled: false, outerDoCall: function () { this.outerWasCalled = true; }
        };
        testNode.innerHTML = "<div data-bind='event:{click:outerDoCall}'><button data-bind='event:{click:innerDoCall}, clickBubble:false'>hey</button></div>";
        ko.applyBindings(model, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], "click");
        expect(model.innerWasCalled).toEqual(true);
        expect(model.outerWasCalled).toEqual(false);
    });

    it('Should be able to supply handler params using "bind" helper', function() {
        // Using "bind" like this just eliminates the function literal wrapper - it's purely stylistic
        var didCallHandler = false, someObj = {};
        var myHandler = function() {
            expect(this).toEqual(someObj);
            expect(arguments.length).toEqual(5);

            // First x args will be the ones you bound
            expect(arguments[0]).toEqual(123);
            expect(arguments[1]).toEqual("another");
            expect(arguments[2].something).toEqual(true);

            // Then you get the args we normally pass to handlers, i.e., the model then the event
            expect(arguments[3]).toEqual(viewModel);
            expect(arguments[4].type).toEqual("mouseover");

            didCallHandler = true;
        };
        testNode.innerHTML = "<button data-bind='event:{ mouseover: myHandler.bind(someObj, 123, \"another\", { something: true }) }'>hey</button>";
        var viewModel = { myHandler: myHandler, someObj: someObj };
        ko.applyBindings(viewModel, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "mouseover");
        expect(didCallHandler).toEqual(true);
    });
});