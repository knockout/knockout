describe('Components: Component binding', function() {

    var testComponentName = 'test-component',
        testComponentBindingValue,
        testComponentParams,
        outerViewModel;

    beforeEach(function() {
        jasmine.Clock.useMock();
        jasmine.prepareTestNode();
        testComponentParams = {};
        testComponentBindingValue = { name: testComponentName, params: testComponentParams };
        outerViewModel = { testComponentBindingValue: testComponentBindingValue, isOuterViewModel: true };
        testNode.innerHTML = '<div data-bind="component: testComponentBindingValue"></div>';
    });

    afterEach(function() {
        jasmine.Clock.reset();
        ko.components.unregister(testComponentName);
    });

    it('Controls descendant bindings', function() {
        testNode.innerHTML = '<div data-bind="if: true, component: \'dummy\'"></div>';
        expect(function() { ko.applyBindings(null, testNode); })
            .toThrowContaining('Multiple bindings (if and component) are trying to control descendant bindings of the same element.');
    });

    it('Throws if no name is specified (name provided directly)', function() {
        testNode.innerHTML = '<div data-bind="component: \'\'"></div>';
        expect(function() { ko.applyBindings(null, testNode); })
            .toThrowContaining('No component name specified');
    });

    it('Throws if no name is specified (using options object)', function() {
        delete testComponentBindingValue.name;
        expect(function() { ko.applyBindings(outerViewModel, testNode); })
            .toThrowContaining('No component name specified');
    });

    it('Throws if the component name is unknown', function() {
        expect(function() {
            ko.applyBindings(outerViewModel, testNode);
            jasmine.Clock.tick(1);
        }).toThrow("Unknown component 'test-component'");
    });

    it('Throws if the component definition has no template', function() {
        ko.components.register(testComponentName, {});
        expect(function() {
            ko.applyBindings(outerViewModel, testNode);
            jasmine.Clock.tick(1);
        }).toThrow("Component 'test-component' has no template");
    });

    it('Replaces the element\'s contents with a clone of the template', function() {
        var testTemplate = document.createDocumentFragment();
        testTemplate.appendChild(document.createElement('div'));
        testTemplate.appendChild(document.createTextNode(' '));
        testTemplate.appendChild(document.createElement('span'));
        testTemplate.childNodes[0].innerHTML = 'Hello';
        testTemplate.childNodes[2].innerHTML = 'World';
        ko.components.register(testComponentName, { template: testTemplate });

        // Bind using just the component name since we're not setting any params
        ko.applyBindings({ testComponentBindingValue: testComponentName }, testNode);

        // See the template asynchronously shows up
        jasmine.Clock.tick(1);
        expect(testNode.childNodes[0].innerHTML).toBe('<div>Hello</div> <span>World</span>');

        // Also be sure it's a clone
        expect(testNode.childNodes[0].childNodes[0]).not.toBe(testTemplate[0]);
    });

    it('Passes componentInfo (with prepopulated element) and params to the component\'s viewmodel factory', function() {
        var componentConfig = {
            template: '<div data-bind="text: 123">I have been prepopulated and not bound yet</div>',
            viewModel: {
                createViewModel: function(componentInfo, params) {
                    expect(componentInfo.element).toContainText('I have been prepopulated and not bound yet');
                    expect(params).toBe(testComponentParams);

                    //verify that createViewModel is the same function and was called with the component definition as the context
                    expect(this.createViewModel).toBe(componentConfig.viewModel.createViewModel);
                    expect(this.template).toBeDefined();

                    componentInfo.element.childNodes[0].setAttribute('data-bind', 'text: someValue');
                    return { someValue: 'From the viewmodel' };
                }
            }
        };

        ko.components.register(testComponentName, componentConfig);
        ko.applyBindings(outerViewModel, testNode);
        jasmine.Clock.tick(1);

        expect(testNode).toContainText('From the viewmodel');
    });

    it('Handles absence of viewmodel by using the params', function() {
        ko.components.register(testComponentName, { template: '<div data-bind="text: myvalue"></div>' });
        testComponentParams.myvalue = 'some parameter value';
        ko.applyBindings(outerViewModel, testNode);
        jasmine.Clock.tick(1);

        expect(testNode.childNodes[0]).toContainHtml('<div data-bind="text: myvalue">some parameter value</div>');
    });

    it('Creates a binding context with the correct parent', function() {
        ko.components.register(testComponentName, {
            template: 'Parent is outer view model: <span data-bind="text: $parent.isOuterViewModel"></span>'
        });
        ko.applyBindings(outerViewModel, testNode);
        jasmine.Clock.tick(1);

        expect(testNode.childNodes[0]).toContainText('Parent is outer view model: true');
    });

    it('Passes nonobservable params to the component', function() {
        // Set up a component that logs its constructor params
        var receivedParams = [];
        ko.components.register(testComponentName, {
            viewModel: function(params) { receivedParams.push(params); },
            template: 'Ignored'
        });
        testComponentParams.someValue = 123;

        // Instantiate it
        ko.applyBindings(outerViewModel, testNode);
        jasmine.Clock.tick(1);

        // See the params arrived as expected
        expect(receivedParams).toEqual([testComponentParams]);
        expect(testComponentParams.someValue).toBe(123); // Just to be sure it doesn't get mutated
    });

    it('Passes through observable params without unwrapping them (so a given component instance can observe them changing)', function() {
        // Set up a component that logs its constructor params
        var receivedParams = [];
        ko.components.register(testComponentName, {
            viewModel: function(params) {
                receivedParams.push(params);
                this.someValue = params.someValue;
            },
            template: 'The value is <span data-bind="text: someValue"></span>.'
        });
        testComponentParams.someValue = ko.observable(123);

        // Instantiate it
        ko.applyBindings(outerViewModel, testNode);
        jasmine.Clock.tick(1);

        // See the params arrived as expected
        expect(receivedParams).toEqual([testComponentParams]);
        expect(testNode).toContainText('The value is 123.');

        // Mutating the observable doesn't trigger creation of a new component
        testComponentParams.someValue(456);
        expect(receivedParams.length).toBe(1); // i.e., no additional constructor call occurred
        expect(testNode).toContainText('The value is 456.');
    });

    it('Supports observable component names, rebuilding the component if the name changes, disposing the old viewmodel and nodes', function() {
        this.after(function() {
            ko.components.unregister('component-alpha');
            ko.components.unregister('component-beta');
        });

        function alphaViewModel(params) { this.alphaValue = params.suppliedValue; }
        function betaViewModel(params)  { this.betaValue  = params.suppliedValue; }

        alphaViewModel.prototype.dispose = function() {
            expect(arguments.length).toBe(0);
            this.alphaWasDisposed = true;

            // Disposal happens *before* the DOM is torn down, in case some custom cleanup is required
            // Note that you'd have to have captured the element via createViewModel, so this is only
            // for extensibility scenarios - we don't generally recommend that component viewmodels
            // should interact directly with their DOM, as that breaks MVVM encapsulation.
            expect(testNode).toContainText('Alpha value is 234.');
        };

        ko.components.register('component-alpha', {
            viewModel: alphaViewModel,
            template: '<div class="alpha">Alpha value is <span data-bind="text: alphaValue"></span>.</div>'
        });

        ko.components.register('component-beta', {
            viewModel: betaViewModel,
            template: '<div class="beta">Beta value is <span data-bind="text: betaValue"></span>.</div>'
        });

        // Instantiate the first component
        testComponentBindingValue.name = ko.observable('component-alpha');
        testComponentParams.suppliedValue = ko.observable(123);
        ko.applyBindings(outerViewModel, testNode);
        jasmine.Clock.tick(1);

        // See it appeared, and the expected subscriptions were registered
        var firstAlphaTemplateNode = testNode.firstChild.firstChild,
            alphaViewModelInstance = ko.dataFor(firstAlphaTemplateNode);
        expect(firstAlphaTemplateNode.className).toBe('alpha');
        expect(testNode).toContainText('Alpha value is 123.');
        expect(testComponentBindingValue.name.getSubscriptionsCount()).toBe(1);
        expect(testComponentParams.suppliedValue.getSubscriptionsCount()).toBe(1);
        expect(alphaViewModelInstance.alphaWasDisposed).not.toBe(true);

        // Store some data on a DOM node so we can check it was cleaned later
        ko.utils.domData.set(firstAlphaTemplateNode, 'TestValue', 'Hello');

        // Mutating an observable param doesn't change the set of subscriptions or replace the DOM nodes
        testComponentParams.suppliedValue(234);
        expect(testNode).toContainText('Alpha value is 234.');
        expect(testComponentBindingValue.name.getSubscriptionsCount()).toBe(1);
        expect(testComponentParams.suppliedValue.getSubscriptionsCount()).toBe(1);
        expect(testNode.firstChild.firstChild).toBe(firstAlphaTemplateNode); // Same node
        expect(ko.utils.domData.get(firstAlphaTemplateNode, 'TestValue')).toBe('Hello'); // Not cleaned
        expect(alphaViewModelInstance.alphaWasDisposed).not.toBe(true);

        // Can switch to the other component by observably changing the component name,
        // but it happens asynchronously (because the component has to be loaded)
        testComponentBindingValue.name('component-beta');
        expect(testNode).toContainText('Alpha value is 234.');
        jasmine.Clock.tick(1);
        expect(testNode).toContainText('Beta value is 234.');

        // Cleans up by disposing obsolete subscriptions, viewmodels, and cleans DOM nodes
        expect(testComponentBindingValue.name.getSubscriptionsCount()).toBe(1);
        expect(testComponentParams.suppliedValue.getSubscriptionsCount()).toBe(1);
        expect(ko.utils.domData.get(firstAlphaTemplateNode, 'TestValue')).toBe(undefined); // Got cleaned
        expect(alphaViewModelInstance.alphaWasDisposed).toBe(true);
    });

    it('Supports binding to an observable that contains name/params, rebuilding the component if that observable changes, disposing the old viewmodel and nodes', function() {
        this.after(function() {
            ko.components.unregister('component-alpha');
            ko.components.unregister('component-beta');
        });

        function alphaViewModel(params) { this.alphaValue = params.suppliedValue; }
        function betaViewModel(params)  { this.betaValue  = params.suppliedValue; }

        alphaViewModel.prototype.dispose = function() {
            expect(arguments.length).toBe(0);
            this.alphaWasDisposed = true;

            // Disposal happens *before* the DOM is torn down, in case some custom cleanup is required
            // Note that you'd have to have captured the element via createViewModel, so this is only
            // for extensibility scenarios - we don't generally recommend that component viewmodels
            // should interact directly with their DOM, as that breaks MVVM encapsulation.
            expect(testNode).toContainText('Alpha value is 123.');
        };

        ko.components.register('component-alpha', {
            viewModel: alphaViewModel,
            template: '<div class="alpha">Alpha value is <span data-bind="text: alphaValue"></span>.</div>'
        });

        ko.components.register('component-beta', {
            viewModel: betaViewModel,
            template: '<div class="beta">Beta value is <span data-bind="text: betaValue"></span>.</div>'
        });

        outerViewModel.testComponentBindingValue = ko.observable({
            name: 'component-alpha',
            params: {
                suppliedValue: 123
            }
        });

        // Instantiate the first component
        ko.applyBindings(outerViewModel, testNode);
        jasmine.Clock.tick(1);

        // See it appeared, and the expected subscriptions were registered
        var firstAlphaTemplateNode = testNode.firstChild.firstChild,
            alphaViewModelInstance = ko.dataFor(firstAlphaTemplateNode);
        expect(firstAlphaTemplateNode.className).toBe('alpha');
        expect(testNode).toContainText('Alpha value is 123.');
        expect(outerViewModel.testComponentBindingValue.getSubscriptionsCount()).toBe(1);
        expect(alphaViewModelInstance.alphaWasDisposed).not.toBe(true);

        // Store some data on a DOM node so we can check it was cleaned later
        ko.utils.domData.set(firstAlphaTemplateNode, 'TestValue', 'Hello');

        // Can switch to the other component by changing observable,
        // but it happens asynchronously (because the component has to be loaded)
        outerViewModel.testComponentBindingValue({
            name: 'component-beta',
            params: {
                suppliedValue: 456
            }
        });

        expect(testNode).toContainText('Alpha value is 123.');
        jasmine.Clock.tick(1);
        expect(testNode).toContainText('Beta value is 456.');

        // Cleans up by disposing obsolete subscriptions, viewmodels, and cleans DOM nodes
        expect(outerViewModel.testComponentBindingValue.getSubscriptionsCount()).toBe(1);
        expect(ko.utils.domData.get(firstAlphaTemplateNode, 'TestValue')).toBe(undefined); // Got cleaned
        expect(alphaViewModelInstance.alphaWasDisposed).toBe(true);
    });

    it('Rebuilds the component if params change in a way that is forced to unwrap inside the binding, disposing the old viewmodel and nodes', function() {
        function testViewModel(params) {
            this.myData = params.someData;
        }
        testViewModel.prototype.dispose = function() {
            this.wasDisposed = true;
        }

        ko.components.register(testComponentName, {
            viewModel: testViewModel,
            template: '<div>Value is <span data-bind="text: myData"></span>.</div>'
        });

        // Instantiate the first component, via a binding that unwraps an observable before it reaches the component
        var someObservable = ko.observable('First');
        testNode.innerHTML = '<div data-bind="component: { name: \'' + testComponentName + '\', params: { someData: someObservable() } }"></div>';
        ko.applyBindings({ someObservable: someObservable }, testNode);
        jasmine.Clock.tick(1);

        var firstTemplateNode = testNode.firstChild.firstChild,
            firstViewModelInstance = ko.dataFor(firstTemplateNode);
        expect(firstViewModelInstance instanceof testViewModel).toBe(true);
        expect(testNode).toContainText('Value is First.');
        expect(firstViewModelInstance.wasDisposed).not.toBe(true);
        ko.utils.domData.set(firstTemplateNode, 'TestValue', 'Hello');

        // Make an observable change that forces the component to rebuild (asynchronously, for consistency)
        someObservable('Second');
        expect(testNode).toContainText('Value is First.');
        expect(firstViewModelInstance.wasDisposed).not.toBe(true);
        expect(ko.utils.domData.get(firstTemplateNode, 'TestValue')).toBe('Hello');
        jasmine.Clock.tick(1);
        expect(testNode).toContainText('Value is Second.');
        expect(firstViewModelInstance.wasDisposed).toBe(true);
        expect(ko.utils.domData.get(firstTemplateNode, 'TestValue')).toBe(undefined);

        // New viewmodel is a new instance
        var secondViewModelInstance = ko.dataFor(testNode.firstChild.firstChild);
        expect(secondViewModelInstance instanceof testViewModel).toBe(true);
        expect(secondViewModelInstance).not.toBe(firstViewModelInstance);
    });

    it('Disposes the viewmodel if the element is cleaned', function() {
        function testViewModel() { }
        testViewModel.prototype.dispose = function() { this.wasDisposed = true; };

        ko.components.register(testComponentName, {
            viewModel: testViewModel,
            template: '<div>Ignored</div>'
        });

        // Bind an instance of the component; grab its viewmodel
        ko.applyBindings(outerViewModel, testNode);
        jasmine.Clock.tick(1);
        var firstTemplateNode = testNode.firstChild.firstChild,
            viewModelInstance = ko.dataFor(firstTemplateNode);
        expect(viewModelInstance instanceof testViewModel).toBe(true);
        expect(viewModelInstance.wasDisposed).not.toBe(true);

        // See that cleaning the associated element automatically disposes the viewmodel
        ko.cleanNode(testNode.firstChild);
        expect(viewModelInstance.wasDisposed).toBe(true);
    });

    it('Does not automatically subscribe to any observables you evaluate during createViewModel or a viewmodel constructor', function() {
        // This clarifies that, if a developer wants to react when some observable parameter
        // changes, then it's their responsibility to subscribe to it or use a computed.
        // We don't rebuild the component just because you evaluated an observable from inside
        // your viewmodel constructor, just like we don't if you evaluate one elsewhere
        // in the viewmodel code.

        // Note that currently, this behavior happens as a fluke of the implementation: because
        // component loads always complete asynchronously, any observables accessed inside
        // createViewModel or later don't get registered as dependencies on the binding computed.
        // If we ever change that to support synchronous component loads, this test would
        // start failing because we'd have broken this behavior.

        var createViewModelCallCount = 0;
        ko.components.register(testComponentName, {
            viewModel: {
                createViewModel: function(componentInfo, params) {
                    createViewModelCallCount++;
                    return { someData: params.someData() };
                }
            },
            template: '<div data-bind="text: someData"></div>'
        });

        // Bind an instance
        testComponentParams.someData = ko.observable('First');
        ko.applyBindings(outerViewModel, testNode);
        jasmine.Clock.tick(1);
        expect(testNode).toContainText('First');
        expect(createViewModelCallCount).toBe(1);

        // See that changing the observable will have no effect, because the viewmodel
        // itself doesn't subscribe to it.
        testComponentParams.someData('Second');
        jasmine.Clock.tick(1);
        expect(testNode).toContainText('First');
        expect(testComponentParams.someData.getSubscriptionsCount()).toBe(0);
        expect(createViewModelCallCount).toBe(1); // ... and we didn't rebuild the component
    });

    it('Disregards component load completions that are no longer relevant', function() {
        // This spec addresses the possibility of a race condition: if you change the
        // component name faster than the component loads complete, then we need to
        // ignore any load completions that don't correspond to the latest name.
        // Otherwise it's inefficient if the loads complete in order (pointless extra
        // binding), and broken if they complete out of order (wrong final result).

        // Set up a mock module loader, so we can control asynchronous load completion
        this.restoreAfter(window, 'require');
        var requireCallbacks = {};
        window.require = function(moduleNames, callback) {
            expect(moduleNames.length).toBe(1); // In this scenario, it always will be
            expect(moduleNames[0] in requireCallbacks).toBe(false); // In this scenario, we only require each module once
            requireCallbacks[moduleNames[0]] = callback;
        };

        // Define four separate components so we can switch between them
        var constructorCallLog = [];
        function testViewModel1(params) { constructorCallLog.push([1, params]); }
        function testViewModel2(params) { constructorCallLog.push([2, params]); }
        function testViewModel3(params) { constructorCallLog.push([3, params]); }
        function testViewModel4(params) { constructorCallLog.push([4, params]); }
        testViewModel3.prototype.dispose = function() { this.wasDisposed = true; };
        ko.components.register('component-1', { viewModel: { require: 'module-1' }, template: '<div>Component 1 template</div>' });
        ko.components.register('component-2', { viewModel: { require: 'module-2' }, template: '<div>Component 2 template</div>' });
        ko.components.register('component-3', { viewModel: { require: 'module-3' }, template: '<div>Component 3 template</div>' });
        ko.components.register('component-4', { viewModel: { require: 'module-4' }, template: '<div>Component 4 template</div>' });
        this.after(function() {
            for (var i = 0; i < 4; i++) {
                ko.components.unregister('component-' + i);
            }
        });

        // Start by requesting component 1
        testComponentBindingValue.name = ko.observable('component-1');
        ko.applyBindings(outerViewModel, testNode);

        // Even if we wait a while, it's not yet loaded, because we're still waiting for the module
        jasmine.Clock.tick(10);
        expect(constructorCallLog.length).toBe(0);
        expect(testNode.firstChild.childNodes.length).toBe(0);

        // In the meantime, switch to requesting component 2 and then 3
        testComponentBindingValue.name('component-2');
        jasmine.Clock.tick(1);
        testComponentBindingValue.name('component-3');
        expect(constructorCallLog.length).toBe(0);

        // Now if component 1 finishes loading, it's irrelevant, so nothing happens
        requireCallbacks['module-1'](testViewModel1);
        jasmine.Clock.tick(1); // ... even if we wait a bit longer
        expect(constructorCallLog.length).toBe(0);
        expect(testNode.firstChild.childNodes.length).toBe(0);

        // Now if component 3 finishes loading, it's the current one, so we instantiate and bind to it.
        // Notice this happens synchronously (at least, relative to the time now), because the completion
        // is already asynchronous relative to when it began.
        requireCallbacks['module-3'](testViewModel3);
        expect(constructorCallLog).toEqual([ [3, testComponentParams] ]);
        expect(testNode).toContainText('Component 3 template');
        var viewModelInstance = ko.dataFor(testNode.firstChild.firstChild);
        expect(viewModelInstance instanceof testViewModel3).toBe(true);
        expect(viewModelInstance.wasDisposed).not.toBe(true);

        // Now if component 2 finishes loading, it's irrelevant, so nothing happens.
        // In particular, the viewmodel isn't disposed.
        requireCallbacks['module-2'](testViewModel2);
        jasmine.Clock.tick(1); // ... even if we wait a bit longer
        expect(constructorCallLog.length).toBe(1);
        expect(testNode).toContainText('Component 3 template');
        expect(viewModelInstance.wasDisposed).not.toBe(true);

        // However, if we now switch to component 2, the old viewmodel is disposed,
        // and the new component is used without any further module load calls.
        testComponentBindingValue.name('component-2');
        jasmine.Clock.tick(1);
        expect(constructorCallLog.length).toBe(2);
        expect(testNode).toContainText('Component 2 template');
        expect(viewModelInstance.wasDisposed).toBe(true);

        // Show also that we won't leak memory by applying bindings to nodes
        // after they were disposed (e.g., because they were removed from the document)
        testComponentBindingValue.name('component-4');
        jasmine.Clock.tick(1);
        ko.cleanNode(testNode.firstChild); // Dispose the node before the module loading completes
        requireCallbacks['module-4'](testViewModel4);
        expect(constructorCallLog.length).toBe(2); // No extra constructor calls
        expect(testNode).toContainText('Component 2 template'); // No attempt to modify the DOM
    });

    it('Supports virtual elements', function() {
        testNode.innerHTML = 'Hello! <!-- ko component: testComponentBindingValue --><!-- /ko --> Goodbye.';
        ko.components.register(testComponentName, {
            template: 'Your param is <span data-bind="text: someData"></span>'
        });
        testComponentParams.someData = ko.observable(123);

        ko.applyBindings(outerViewModel, testNode);
        jasmine.Clock.tick(1);
        expect(testNode).toContainText('Hello! Your param is 123 Goodbye.');

        testComponentParams.someData(456);
        expect(testNode).toContainText('Hello! Your param is 456 Goodbye.');
    });
});
