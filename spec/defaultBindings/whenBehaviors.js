describe('Binding: When', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should bind content if given a true value', function () {
        testNode.innerHTML = "<div data-bind='when: true'><span data-bind='text:\"x\"'></span><span data-bind='text:\"1\"'></span></div>";
        ko.applyBindings({}, testNode);
        expect(testNode).toContainText("x1");
    });

    it('Should clear content if given a false value, then set and bind content when true', function () {
        var observable = ko.observable(false);
        testNode.innerHTML = "<div data-bind='when: condition'><span data-bind='text:\"x\"'></span><span data-bind='text:\"1\"'></span></div>";

        ko.applyBindings({condition: observable}, testNode);
        expect(testNode.childNodes[0].childNodes.length).toBe(0);

        observable(true);
        expect(testNode.childNodes[0].childNodes.length).toBe(2);
        expect(testNode).toContainText("x1");
    });

    it('Should ignore new values after given a true value', function () {
        var observable = ko.observable(false);
        testNode.innerHTML = "<div data-bind='when: condition'><div data-bind='text: \"bound value\"'></div></div>";

        ko.applyBindings({condition: observable}, testNode);
        expect(testNode.childNodes[0].childNodes.length).toBe(0);

        observable(true);
        expect(testNode.childNodes[0].childNodes.length).toBe(1);
        expect(testNode).toContainText("bound value");

        observable(false);
        expect(testNode).toContainText("bound value");
        expect(observable.getSubscriptionsCount()).toBe(0);  // no more subscriptions
    });

    it('Should call a childrenComplete callback function', function () {
        testNode.innerHTML = "<div data-bind='when: condition, childrenComplete: callback'><span data-bind='text: someText'></span></div>";
        var someItem = ko.observable({ childprop: 'child' }),
            callbacks = 0;
        var viewModel = { condition: ko.observable(false), someText: "hello", callback: function () { callbacks++; } };
        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode.childNodes[0]).toContainText('');

        viewModel.condition(true);
        expect(callbacks).toEqual(1);
        expect(testNode.childNodes[0]).toContainText('hello');
    });

    it('Should call descendantsComplete callback function registered with ko.bindingEvent.subscribe', function () {
        testNode.innerHTML = "<div data-bind='when: condition'><span data-bind='text: someText'></span></div>";
        var someItem = ko.observable({ childprop: 'child' }),
            callbacks = 0;
        var viewModel = { condition: ko.observable(false), someText: "hello" };
        ko.bindingEvent.subscribe(testNode.childNodes[0], "descendantsComplete", function () {
            callbacks++;
        });

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode.childNodes[0]).toContainText('');

        viewModel.condition(true);
        expect(callbacks).toEqual(1);
        expect(testNode.childNodes[0]).toContainText('hello');
    });

    it('Should call descendantsComplete callback function after nested \"when\" bindings are complete', function () {
        testNode.innerHTML = "<div data-bind='when: outerCondition'><div data-bind='when: innerCondition'><span data-bind='text: someText'></span></div></div>";
        var someItem = ko.observable({ childprop: 'child' }),
            callbacks = 0;
        var viewModel = { outerCondition: ko.observable(false), innerCondition: ko.observable(false), someText: "hello" };
        ko.bindingEvent.subscribe(testNode.childNodes[0], "descendantsComplete", function () {
            callbacks++;
        });

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode.childNodes[0]).toContainText('');

        // Complete the outer condition first and then the inner one
        viewModel.outerCondition(true);
        expect(callbacks).toEqual(0);
        expect(testNode.childNodes[0]).toContainText('');

        viewModel.innerCondition(true);
        expect(callbacks).toEqual(1);
        expect(testNode.childNodes[0]).toContainText('hello');
    });

    it('Should call descendantsComplete callback function when nested \"when\" bindings are complete', function () {
        testNode.innerHTML = "<div data-bind='when: outerCondition'><div data-bind='when: innerCondition'><span data-bind='text: someText'></span></div></div>";
        var someItem = ko.observable({ childprop: 'child' }),
            callbacks = 0;
        var viewModel = { outerCondition: ko.observable(false), innerCondition: ko.observable(false), someText: "hello" };
        ko.bindingEvent.subscribe(testNode.childNodes[0], "descendantsComplete", function () {
            callbacks++;
        });

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode.childNodes[0]).toContainText('');

        // Complete the inner condition first and then the outer one (reverse order from previous test)
        viewModel.innerCondition(true);
        expect(callbacks).toEqual(0);
        expect(testNode.childNodes[0]).toContainText('');

        viewModel.outerCondition(true);
        expect(callbacks).toEqual(1);
        expect(testNode.childNodes[0]).toContainText('hello');
    });

    it('Should call descendantsComplete callback function if nested \"when\" bindings are disposed before completion', function () {
        testNode.innerHTML = "<div data-bind='when: outerCondition'><div data-bind='when: innerCondition'><span data-bind='text: someText'></span></div></div>";
        var someItem = ko.observable({ childprop: 'child' }),
            callbacks = 0;
        var viewModel = { outerCondition: ko.observable(false), innerCondition: ko.observable(false), someText: "hello" };
        ko.bindingEvent.subscribe(testNode.childNodes[0], "descendantsComplete", function () {
            callbacks++;
        });

        ko.applyBindings(viewModel, testNode);
        expect(callbacks).toEqual(0);
        expect(testNode.childNodes[0]).toContainText('');

        // Complete the outer condition and then dispose the inner one
        viewModel.outerCondition(true);
        expect(callbacks).toEqual(0);
        expect(testNode.childNodes[0]).toContainText('');

        ko.cleanNode(testNode.childNodes[0].childNodes[0]);
        expect(callbacks).toEqual(1);
        expect(testNode.childNodes[0]).toContainText('');
    });

    it('Should not update if node is cleaned before value becomes true', function () {
        var observable = ko.observable(false);
        testNode.innerHTML = "<div data-bind='when: condition'><div data-bind='text: \"bound value\"'></div></div>";

        ko.applyBindings({condition: observable}, testNode);
        expect(testNode.childNodes[0].childNodes.length).toBe(0);
        expect(observable.getSubscriptionsCount()).toBe(1);

        ko.cleanNode(testNode);
        expect(observable.getSubscriptionsCount()).toBe(0);  // no more subscriptions
        observable(true);
        expect(testNode.childNodes[0].childNodes.length).toBe(0);
    });
});
