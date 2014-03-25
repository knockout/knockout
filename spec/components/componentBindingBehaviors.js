describe('Components: Component binding', function() {

    var testComponentName = 'test-component',
        testComponentBindingValue,
        testComponentParams,
        outerViewModel,
        applyBindings;

    beforeEach(function() {
        jasmine.Clock.useMock();
        jasmine.prepareTestNode();
        testComponentParams = {};
        testComponentBindingValue = { name: testComponentName, params: testComponentParams };
        outerViewModel = { testComponentBindingValue: testComponentBindingValue, isOuterViewModel: true };
        testNode.innerHTML = '<div data-bind="component: testComponentBindingValue"></div>';
    });

    afterEach(function() {
        ko.components.unregister(testComponentName);
        ko.components.clearCachedDefinition(testComponentName);
    });

    it('Throws if no name is specified', function() {
        delete testComponentBindingValue.name;
        expect(function() { ko.applyBindings(outerViewModel, testNode); })
            .toThrowContaining('No component name specified');
    });

    //it('Throws if the component name is unknown', function() {
        // Unfortunately, there's no way to make assertions about exceptions thrown in the global context,
        // which these ones are, because they are in response to an asynchronous process. If anyone knows
        // a reasonable, cross-browser way to make such assertions with Jasmine, please tell us!
        // (Note that when using Jasmine's mocked clock, Jasmine actually catches and swallows such exceptions,
        // because they really happen during its mocked setTimeout callback, so it could be possible.)
    //});

    //it('Throws if the component definition has no template', function() {
        // Likewise, we don't have a way to assert about this, but the behavior is required.
    //});

    it('Replaces the element\'s contents with a clone of the template', function() {
        var testTemplate = document.createDocumentFragment();
        testTemplate.appendChild(document.createElement('div'));
        testTemplate.appendChild(document.createTextNode(' '));
        testTemplate.appendChild(document.createElement('span'));
        testTemplate.childNodes[0].innerHTML = 'Hello';
        testTemplate.childNodes[2].innerHTML = 'World';
        ko.components.register(testComponentName, { template: testTemplate });
        ko.applyBindings(outerViewModel, testNode);

        // See the template asynchronously shows up
        jasmine.Clock.tick(1);
        expect(testNode.childNodes[0].innerHTML).toBe('<div>Hello</div> <span>World</span>');

        // Also be sure it's a clone
        expect(testNode.childNodes[0].childNodes[0]).not.toBe(testTemplate[0]);
    });

    it('Passes componentInfo (with prepopulated element) and params to the component\'s viewmodel factory', function() {
        ko.components.register(testComponentName, {
            template: '<div data-bind="text: 123">I have been prepopulated and not bound yet</div>',
            viewModel: {
                createViewModel: function(componentInfo, params) {
                    expect(componentInfo.element).toContainText('I have been prepopulated and not bound yet');
                    expect(params).toBe(testComponentParams);
                    componentInfo.element.childNodes[0].setAttribute('data-bind', 'text: someValue');
                    return { someValue: 'From the viewmodel' };
                }
            }
        });
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

    // Passes nonobservable params to the component
    // Passes through observable params without unwrapping them (so a given component instance can observe them changing)
    // Supports observable component names, rebuilding the component if the name changes (disposing the old viewmodel and nodes)
    // Handles the component name changing while a previous component load is still in progress
    // Rebuilds the component if params change in a way that is forced to unwrap inside the binding (disposing the old viewmodel and nodes)
    // Support virtual elements
    // Disposes the viewmodel if the element is cleaned
});
