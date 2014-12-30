describe('Transclusion', function() {
    beforeEach(function() {
        jasmine.prepareTestNode();
        jasmine.Clock.useMock();
    });

    afterEach(function() {
        jasmine.Clock.reset();
        ko.components.unregister('test-component');
    });

    it('Transcludes contents', function() {
        ko.components.register('test-component', {
            template: 'custom element <span>content: "<content></content>"</span>'
        });
        var initialMarkup = '<div>hello <test-component>inject1<div>inject2</div></test-component></div>';
        testNode.innerHTML = initialMarkup;

        ko.applyBindings(null, testNode);
        jasmine.Clock.tick(1);
        expect(testNode).toContainHtml('<div>hello <test-component>custom element <span>content: "inject1<div>inject2</div>"</span></test-component></div>');
    });

    it('Transcludes contents with tag selectors', function() {
        ko.components.register('test-component', {
            template: 'custom element <span><span><content select="h1">h1 template</content><em>not touched</em><content /></span></span>'
        });
        testNode.innerHTML = '<div>hello <test-component><h1>injected h1</h1>injectme</test-component></div>';

        ko.applyBindings(null, testNode);

        jasmine.Clock.tick(1);
        expect(testNode).toContainHtml('<div>hello <test-component>custom element <span><span><h1>injected h1</h1><em>not touched</em>injectme</span></span></test-component></div>');
    });

    it('Transcludes contents with class name selectors', function() {
        ko.components.register('test-component', {
            template: 'custom element <span><span><content select=".c1">.c1 template</content><content select=".c2">.c2 template</content><em>not touched</em><content /></span></span>'
        });
        testNode.innerHTML = '<div>hello <test-component><h1 class="c1">injected .c1</h1><div class="c2">injected .c2</div>injectme</test-component></div>';

        ko.applyBindings(null, testNode);

        jasmine.Clock.tick(1);
        expect(testNode).toContainHtml('<div>hello <test-component>custom element <span><span><h1 class="c1">injected .c1</h1><div class="c2">injected .c2</div><em>not touched</em>injectme</span></span></test-component></div>');
    });
    it('Simple nested transclusion works', function() {
        ko.components.register('test-component', {
            template: '<span>before<content>nested</content>after</span>'
        });
        testNode.innerHTML = '<test-component><test-component>nested nested</test-component></test-component>';

        ko.applyBindings(null, testNode);

        jasmine.Clock.tick(1);
        expect(testNode).toContainHtml('<test-component><span>before<test-component><span>beforenested nestedafter</span></test-component>after</span></test-component>');
    });

    it('Binding still works on trascluded elements', function() {
        ko.components.register('test-component', {
            template: '<span><content></content></span>'
        });
        testNode.innerHTML = '<test-component><h1 data-bind="text: \'text\'">injected, should be replaced</h1></test-component>';

        ko.applyBindings(null, testNode);

        jasmine.Clock.tick(1);
        expect(testNode).toContainHtml('<test-component><span><h1 data-bind="text: \'text\'">text</h1></span></test-component>');
    });

    it('Component view model is used', function() {
        ko.components.register('test-component', {
            viewModel: function() {
                this.foo = 'footext'
            },
            template: '<span><span data-bind="text: foo" /><content></content></span>'
        });
        testNode.innerHTML = '<test-component><h1 data-bind="text: foo">injected, should be replaced</h1></test-component></div>';

        ko.applyBindings(null, testNode);

        jasmine.Clock.tick(1);
        expect(testNode).toContainHtml('<test-component><span><span data-bind="text: foo">footext</span><h1 data-bind="text: foo">footext</h1></span></test-component>');
    });
    it('Component definition can override the content of a component', function() {
        ko.components.register('test-component', {
            template: '<span><content select=".fromDefinition"></content><content></content></span>',
            findContent: function(select, componentNode) {
                switch(select) {
                    case '.fromDefinition': return '<div>from definition</div>';
                }
            }
        });
        testNode.innerHTML = '<test-component><h1>injected</h1><div class="fromDefinition">removed</div></test-component>';

        ko.applyBindings(null, testNode);

        jasmine.Clock.tick(1);
        expect(testNode).toContainHtml('<test-component><span><div>from definition</div><h1>injected</h1></span></test-component>');
    });
    it('Complex selector can be used', function() {
        ko.components.register('test-component', {
            template: '<span><content select="#one .two"></content><span><content></content></span></span>'
        });
        testNode.innerHTML = '<test-component><div id="one">foo<div class="two">injected by select</div></div><h1 id="three">injected</h1></test-component>';

        ko.applyBindings(null, testNode);

        jasmine.Clock.tick(1);
        expect(testNode).toContainHtml('<test-component><span><div class="two">injected by select</div><span><div id="one">foo</div><h1 id="three">injected</h1></span></span></test-component>');
    });

});
