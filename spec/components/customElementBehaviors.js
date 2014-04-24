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
});
