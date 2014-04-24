describe('Components: Custom elements', function() {
    beforeEach(function() {
        jasmine.prepareTestNode();
        jasmine.Clock.useMock();
    });

    afterEach(function() {
        jasmine.Clock.reset();
        ko.components.unregister('test-component');
    });

    it('Inserts components into custom elements with matching names', function() {
        ko.components.register('test-component', {
            template: 'custom element <span data-bind="text: 123"></span>'
        });
        var initialMarkup = '<div>hello <test-component></test-component></div>';
        testNode.innerHTML = initialMarkup;

        // Since components are loaded asynchronously, it doesn't show up synchronously
        ko.applyBindings(null, testNode);
        expect(testNode).toContainHtml(initialMarkup);

        // ... but when the component is loaded, it does show up
        jasmine.Clock.tick(1);
        expect(testNode).toContainHtml('<div>hello <test-component>custom element <span data-bind="text: 123">123</span></test-component></div>');
    });

    it('Is possible to override getComponentNameForNode to determine which component goes into which element', function() {
        ko.components.register('test-component', { template: 'custom element'});
        this.restoreAfter(ko.components, 'getComponentNameForNode');

        // Set up a getComponentNameForNode function that maps "A" tags to test-component
        testNode.innerHTML = '<div>hello <a></a> <b>ignored</b></div>';
        ko.components.getComponentNameForNode = function(node) {
            return node.tagName === 'A' ? 'test-component' : null;
        }

        // See the component show up
        ko.applyBindings(null, testNode);
        jasmine.Clock.tick(1);
        expect(testNode).toContainHtml('<div>hello <a>custom element</a> <b>ignored</b></div>');
    });

    it('Is possible to have regular data-bind bindings on a custom element, as long as they don\'t attempt to control descendants', function() {
        ko.components.register('test-component', { template: 'custom element'});
        testNode.innerHTML = '<test-component data-bind="visible: shouldshow"></test-component>';

        // Bind with a viewmodel that controls visibility
        var viewModel = { shouldshow: ko.observable(true) };
        ko.applyBindings(viewModel, testNode);
        jasmine.Clock.tick(1);
        expect(testNode).toContainHtml('<test-component data-bind="visible: shouldshow">custom element</test-component>');
        expect(testNode.childNodes[0].style.display).not.toBe('none');

        // See that the 'visible' binding still works
        viewModel.shouldshow(false);
        expect(testNode.childNodes[0].style.display).toBe('none');
        expect(testNode.childNodes[0].innerHTML).toBe('custom element');
    });

    it('Is not possible to have regular data-bind bindings on a custom element if they also attempt to control descendants', function() {
        ko.components.register('test-component', { template: 'custom element'});
        testNode.innerHTML = '<test-component data-bind="if: true"></test-component>';

        expect(function() { ko.applyBindings(null, testNode); })
            .toThrowContaining('Multiple bindings (if and component) are trying to control descendant bindings of the same element.');
    });

    it('Is possible to call applyBindings directly on a custom element', function() {
        ko.components.register('test-component', { template: 'custom element'});
        testNode.innerHTML = '<test-component></test-component>';
        var customElem = testNode.childNodes[0];
        expect(customElem.tagName).toBe('TEST-COMPONENT');

        ko.applyBindings(null, customElem);
        jasmine.Clock.tick(1);
        expect(customElem.innerHTML).toBe('custom element');
    });

    it('Throws if you try to duplicate the \'component\' binding on a custom element that matches a component', function() {
        ko.components.register('test-component', { template: 'custom element'});
        testNode.innerHTML = '<test-component data-bind="component: {}"></test-component>';

        expect(function() { ko.applyBindings(null, testNode); })
            .toThrowContaining('Cannot use the "component" binding on a custom element matching a component');
    });

    it('Is possible to pass literal values', function() {
        var suppliedParams = [];
        ko.components.register('test-component', {
            template: 'Ignored',
            viewModel: function(params) {
                suppliedParams.push(params);

                // The raw value for each param is a computed giving the literal value
                ko.utils.objectForEach(params, function(key, value) {
                    if (key !== '$raw') {
                        expect(ko.isComputed(params.$raw[key])).toBe(true);
                        expect(params.$raw[key]()).toBe(value);
                    }
                });
            }
        });

        testNode.innerHTML = '<test-component params="nothing: null, num: 123, bool: true, obj: { abc: 123 }, str: \'mystr\'"></test-component>';
        ko.applyBindings(null, testNode);
        jasmine.Clock.tick(1);

        delete suppliedParams[0].$raw; // Don't include '$raw' in the following assertion, as we only want to compare supplied values
        expect(suppliedParams).toEqual([{ nothing: null, num: 123, bool: true, obj: { abc: 123 }, str: 'mystr' }]);
    });

    it('Should not confuse parameters with bindings', function() {
        this.restoreAfter(ko, 'getBindingHandler');
        var bindings = [];
        ko.getBindingHandler = function(bindingKey) {
            bindings.push(bindingKey);
        };

        ko.components.register('test-component', {});
        testNode.innerHTML = '<test-component params="value: value"></test-component>';
        ko.applyBindings({value: 123}, testNode);

        // The only binding it should look up is "component"
        expect(bindings).toEqual(['component']);
    });

    it('Should update component when observable view model changes', function() {
        ko.components.register('test-component', {
            template: '<p>the value: <span data-bind="text: textToShow"></span></p>'
        });

        testNode.innerHTML = '<test-component params="textToShow: value"></test-component>';
        var vm = ko.observable({ value: 'A' });
        ko.applyBindings(vm, testNode);
        jasmine.Clock.tick(1);
        expect(testNode).toContainText("the value: A");

        vm({ value: 'Z' });
        jasmine.Clock.tick(1);
        expect(testNode).toContainText("the value: Z");
    });

    it('Is possible to pass observable instances', function() {
        ko.components.register('test-component', {
            template: '<p>the observable: <span data-bind="text: receivedobservable"></span></p>',
            viewModel: function(params) {
                this.receivedobservable = params.suppliedobservable;
                expect(this.receivedobservable.subprop).toBe('subprop');
                this.dispose = function() { this.wasDisposed = true; };

                // The $raw value for this param is a computed giving the observable instance
                expect(ko.isComputed(params.$raw.suppliedobservable)).toBe(true);
                expect(params.$raw.suppliedobservable()).toBe(params.suppliedobservable);
            }
        });

        // See we can supply an observable instance, which is received with no wrapper around it
        var myobservable = ko.observable(1);
        myobservable.subprop = 'subprop';
        testNode.innerHTML = '<test-component params="suppliedobservable: myobservable"></test-component>';
        ko.applyBindings({ myobservable: myobservable }, testNode);
        jasmine.Clock.tick(1);
        var viewModelInstance = ko.dataFor(testNode.firstChild.firstChild);
        expect(testNode.firstChild).toContainText('the observable: 1');

        // See the observable instance can mutate, without causing the component to tear down
        myobservable(2);
        expect(testNode.firstChild).toContainText('the observable: 2');
        expect(ko.dataFor(testNode.firstChild.firstChild)).toBe(viewModelInstance); // Didn't create a new instance
        expect(viewModelInstance.wasDisposed).not.toBe(true);
    });

    it('Is possible to pass expressions that can vary observably', function() {
        var rootViewModel = {
                myobservable: ko.observable('Alpha')
            },
            constructorCallCount = 0;

        ko.components.register('test-component', {
            template: '<p>the string reversed: <span data-bind="text: receivedobservable"></span></p>',
            viewModel: function(params) {
                constructorCallCount++;
                this.receivedobservable = params.suppliedobservable;
                this.dispose = function() { this.wasDisposed = true; };

                // See we didn't get the original observable instance. Instead we got a computed property.
                expect(this.receivedobservable).not.toBe(rootViewModel.myobservable);
                expect(ko.isComputed(this.receivedobservable)).toBe(true);

                // The $raw value for this param is a computed property whose value is raw result
                // of evaluating the binding value. Since the raw result in this case is itself not
                // observable, it's the same value as the regular (non-$raw) supplied parameter.
                expect(ko.isComputed(params.$raw.suppliedobservable)).toBe(true);
                expect(params.$raw.suppliedobservable()).toBe(params.suppliedobservable());
            }
        });

        // Bind, using an expression that evaluates the observable during binding
        testNode.innerHTML = '<test-component params=\'suppliedobservable: myobservable().split("").reverse().join("")\'></test-component>';
        ko.applyBindings(rootViewModel, testNode);
        jasmine.Clock.tick(1);
        expect(testNode.firstChild).toContainText('the string reversed: ahplA');
        var componentViewModelInstance = ko.dataFor(testNode.firstChild.firstChild);
        expect(constructorCallCount).toBe(1);
        expect(rootViewModel.myobservable.getSubscriptionsCount()).toBe(1);

        // See that mutating the underlying observable modifies the supplied computed property,
        // but doesn't cause the component to tear down
        rootViewModel.myobservable('Beta');
        expect(testNode.firstChild).toContainText('the string reversed: ateB');
        expect(constructorCallCount).toBe(1);
        expect(ko.dataFor(testNode.firstChild.firstChild)).toBe(componentViewModelInstance); // No new viewmodel needed
        expect(componentViewModelInstance.wasDisposed).not.toBe(true);
        expect(rootViewModel.myobservable.getSubscriptionsCount()).toBe(1); // No extra subscription needed

        // See also that subscriptions to the evaluated observables are disposed
        // when the custom element is cleaned
        ko.cleanNode(testNode);
        expect(componentViewModelInstance.wasDisposed).toBe(true);
        expect(rootViewModel.myobservable.getSubscriptionsCount()).toBe(0);
    });

    it('Is possible to pass expressions that can vary observably and evaluate as observable instances', function() {
        var constructorCallCount = 0;
        ko.components.register('test-component', {
            template: '<p>the value: <span data-bind="text: myval"></span></p>',
            viewModel: function(params) {
                constructorCallCount++;
                this.myval = params.somevalue;

                // See we received a computed, not either of the original observables
                expect(ko.isComputed(this.myval)).toBe(true);

                // See we can reach the original inner observable directly if needed via $raw
                // (e.g., because it has subobservables or similar)
                var originalObservable = params.$raw.somevalue();
                expect(ko.isObservable(originalObservable)).toBe(true);
                expect(ko.isComputed(originalObservable)).toBe(false);
                if (originalObservable() === 'inner1') {
                    expect(originalObservable).toBe(innerObservable); // See there's no wrapper
                }
            }
        });

        // Bind to a viewmodel with nested observables; see the expression is evaluated as expected
        // The component itself doesn't have to know or care that the supplied value is nested - the
        // custom element syntax takes care of producing a single computed property that gives the
        // unwrapped inner value.
        var innerObservable = ko.observable('inner1'),
            outerObservable = ko.observable({ inner: innerObservable });
        testNode.innerHTML = '<test-component params="somevalue: outer().inner"></test-component>';
        ko.applyBindings({ outer: outerObservable }, testNode);
        jasmine.Clock.tick(1);
        expect(testNode).toContainText('the value: inner1');
        expect(outerObservable.getSubscriptionsCount()).toBe(1);
        expect(innerObservable.getSubscriptionsCount()).toBe(1);
        expect(constructorCallCount).toBe(1);

        // See we can mutate the inner value and see the result show up
        innerObservable('inner2');
        expect(testNode).toContainText('the value: inner2');
        expect(outerObservable.getSubscriptionsCount()).toBe(1);
        expect(innerObservable.getSubscriptionsCount()).toBe(1);
        expect(constructorCallCount).toBe(1);

        // See we can mutate the outer value and see the result show up (cleaning subscriptions to the old inner value)
        var newInnerObservable = ko.observable('newinner');
        outerObservable({ inner: newInnerObservable });
        expect(testNode).toContainText('the value: newinner');
        expect(outerObservable.getSubscriptionsCount()).toBe(1);
        expect(innerObservable.getSubscriptionsCount()).toBe(0);
        expect(newInnerObservable.getSubscriptionsCount()).toBe(1);
        expect(constructorCallCount).toBe(1);

        // See that subscriptions are disposed when the component is
        ko.cleanNode(testNode);
        expect(outerObservable.getSubscriptionsCount()).toBe(0);
        expect(innerObservable.getSubscriptionsCount()).toBe(0);
        expect(newInnerObservable.getSubscriptionsCount()).toBe(0);
    });

    it('Supplies any custom parameter called "$raw" in preference to the function that yields raw parameter values', function() {
        var constructorCallCount = 0,
            suppliedValue = {};
        ko.components.register('test-component', {
            template: 'Ignored',
            viewModel: function(params) {
                constructorCallCount++;
                expect(params.$raw).toBe(suppliedValue);
            }
        });

        testNode.innerHTML = '<test-component params="$raw: suppliedValue"></test-component>';
        ko.applyBindings({ suppliedValue: suppliedValue }, testNode);
        jasmine.Clock.tick(1);
        expect(constructorCallCount).toBe(1);
    });

    it('Disposes the component when the custom element is cleaned', function() {
        // This is really a behavior of the component binding, not custom elements.
        // This spec just shows that custom elements don't break it for any reason.
        var componentViewModel = {
            dispose: function() {
                this.wasDisposed = true;
            }
        };
        ko.components.register('test-component', {
            template: 'custom element',
            viewModel: { instance: componentViewModel }
        });
        testNode.innerHTML = '<test-component></test-component>';

        // See it binds properly
        ko.applyBindings(null, testNode);
        jasmine.Clock.tick(1);
        expect(testNode.firstChild).toContainHtml('custom element');

        // See the viewmodel is disposed when the corresponding DOM element is
        expect(componentViewModel.wasDisposed).not.toBe(true);
        ko.cleanNode(testNode.firstChild);
        expect(componentViewModel.wasDisposed).toBe(true);
    });
});
