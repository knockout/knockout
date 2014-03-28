describe('Components: Default loader', function() {

    var testComponentName = 'test-component';

    afterEach(function() {
        ko.components.unregister(testComponentName);
    });

    it('Allows registration of arbitrary component config objects, reports that they are registered, and allows unregistration', function() {
        ko.components.register(testComponentName, {});

        expect(ko.components.isRegistered(testComponentName)).toBe(true);
        expect(ko.components.isRegistered('other-component')).toBe(false);

        ko.components.unregister(testComponentName, {});
        ko.components.unregister('nonexistent-component', {}); // No error - it's just a no-op, since it's harmless

        expect(ko.components.isRegistered(testComponentName)).toBe(false);
    });

    it('Throws if you try to register a component that is already registered', function() {
        ko.components.register(testComponentName, {});

        expect(function() {
            ko.components.register(testComponentName, {});
        }).toThrow();
    });

    it('Throws if you try to register a falsey value', function() {
        expect(function() {
            ko.components.register(testComponentName, null);
        }).toThrow();

        expect(function() {
            ko.components.register(testComponentName, undefined);
        }).toThrow();
    });

    it('getConfig supplies config objects from the in-memory registry', function() {
        var expectedConfig = {},
            didComplete = false;

        ko.components.register(testComponentName, expectedConfig);
        ko.components.defaultLoader.getConfig(testComponentName, function(actualConfig) {
            expect(actualConfig).toBe(expectedConfig);
            didComplete = true;
        });

        waitsFor(function() { return didComplete; }, 100);
    });

    it('getConfig supplies null for unknown components', function() {
        var didComplete = false;

        ko.components.defaultLoader.getConfig(testComponentName, function(actualConfig) {
            expect(actualConfig).toBe(null);
            didComplete = true;
        });

        waitsFor(function() { return didComplete; }, 100);
    });

    it('Can load a template and viewmodel simultaneously', function() {
        // Set up a configuration in which both template and viewmodel have to be loaded asynchronously
        var templateProviderCallback,
            viewModelProviderCallback,
            createViewModelFunction = function() { },
            docFrag = document.createDocumentFragment(),
            didResolveDefinition = false,
            config = {
                template: { require: 'path/templateModule' },
                viewModel: { require: 'path/viewModelModule' }
            };

        this.restoreAfter(window, 'require');
        window.require = function(modules, callback) {
            expect(modules.length).toBe(1);
            switch (modules[0]) {
                case 'path/templateModule':
                    templateProviderCallback = callback;
                    break;
                case 'path/viewModelModule':
                    viewModelProviderCallback = callback;
                    break;
                default:
                    throw new Error('Unexpected requirement for module ' + modules[0]);
            }
        };

        // Start the loading process
        testConfigObject(config, function(definition) {
            didResolveDefinition = true;
            expect(definition.template).toBe(docFrag);
            expect(definition.createViewModel).toBe(createViewModelFunction);
        });

        // Both modules start loading before either completes
        expect(typeof templateProviderCallback).toBe('function');
        expect(typeof viewModelProviderCallback).toBe('function');

        // When the first one completes, nothing else happens
        viewModelProviderCallback({ createViewModel: createViewModelFunction });
        expect(didResolveDefinition).toBe(false);

        // When the other one completes, the definition is supplied
        templateProviderCallback(docFrag);
        expect(didResolveDefinition).toBe(true);
    });

    it('Can resolve templates and viewmodels recursively', function() {
        // Set up a component which is a module in which:
        //  - template is a further module which supplies markup
        //  - viewModel is a further module which supplies a constructor
        mockAmdEnvironment(this, {
            componentmodule: {
                template: { require: 'templatemodule' },
                viewModel: { require: 'viewmodelmodule' }
            },
            templatemodule: '<div>Hello world</div>',
            viewmodelmodule: {
                viewModel: function(params) {
                    this.receivedValue = params.suppliedValue;
                }
            }
        })

        // Resolve it all
        testConfigObject({ require: 'componentmodule' }, function(definition) {
            expect(definition.template.childNodes.length).toBe(1);
            expect(definition.template.childNodes[0]).toContainText('Hello world');

            var viewModel = definition.createViewModel(null /* componentInfo */, { suppliedValue: 12.3 });
            expect(viewModel.receivedValue).toBe(12.3);
        });
    });

    describe('Configuration formats', function() {
        describe('Templates are normalised to document fragments', function() {

            it('Can be configured as a document fragment', function() {
                var docFrag = document.createDocumentFragment();
                testConfigObject({ template: docFrag }, function(definition) {
                    expect(definition.template).toBe(docFrag);
                });
            });

            it('Can be configured as a string of markup', function() {
                testConfigObject({ template: '<p>Some text</p><div>More stuff</div>' }, function(definition) {
                    // Converts to standard document fragment format
                    expect(definition.template.nodeType).toBe(11);
                    expect(definition.template.childNodes.length).toBe(2);
                    expect(definition.template.childNodes[0].tagName).toBe('P');
                    expect(definition.template.childNodes[0]).toContainText('Some text');
                    expect(definition.template.childNodes[1].tagName).toBe('DIV');
                    expect(definition.template.childNodes[1]).toContainText('More stuff');
                });
            });

            it('Can be configured as an element ID', function() {
                var testElem = document.createElement('div');
                testElem.id = 'some-template-element';
                testElem.innerHTML = '<p>Some text</p><div>More stuff</div>';
                document.body.appendChild(testElem);

                testConfigObject({ template: { element: 'some-template-element' } }, function(definition) {
                    // Converts to standard document fragment format
                    expect(definition.template.nodeType).toBe(11);
                    expect(definition.template.childNodes.length).toBe(2);
                    expect(definition.template.childNodes[0].tagName).toBe('P');
                    expect(definition.template.childNodes[0]).toContainText('Some text');
                    expect(definition.template.childNodes[1].tagName).toBe('DIV');
                    expect(definition.template.childNodes[1]).toContainText('More stuff');
                    testElem.parentNode.removeChild(testElem);

                    // Doesn't destroy the input element
                    expect(testElem.childNodes.length).toBe(2);
                });
            });

            it('Can be configured as a container element', function() {
                var testElem = document.createElement('div');
                testElem.innerHTML = '<p>Some text</p><div>More stuff</div>';

                testConfigObject({ template: { element: testElem } }, function(definition) {
                    // Converts to standard document fragment format
                    expect(definition.template.nodeType).toBe(11);
                    expect(definition.template.childNodes.length).toBe(2);
                    expect(definition.template.childNodes[0].tagName).toBe('P');
                    expect(definition.template.childNodes[0]).toContainText('Some text');
                    expect(definition.template.childNodes[1].tagName).toBe('DIV');
                    expect(definition.template.childNodes[1]).toContainText('More stuff');

                    // Doesn't destroy the input element
                    expect(testElem.childNodes.length).toBe(2);
                });
            });

            it('Can be configured as an AMD module whose value is a document fragment', function() {
                var docFrag = document.createDocumentFragment();
                mockAmdEnvironment(this, { 'some/module/path': docFrag });

                testConfigObject({ template: { require: 'some/module/path' } }, function(definition) {
                    expect(definition.template).toBe(docFrag);
                });
            });

            it('Can be configured as an AMD module whose value is markup', function() {
                mockAmdEnvironment(this, { 'some/module/path': '<div>Hello world</div><p>The end</p>' });

                testConfigObject({ template: { require: 'some/module/path' } }, function(definition) {
                    // Converts to standard document fragment format
                    expect(definition.template.nodeType).toBe(11);
                    expect(definition.template.childNodes.length).toBe(2);
                    expect(definition.template.childNodes[0].tagName).toBe('DIV');
                    expect(definition.template.childNodes[0]).toContainText('Hello world');
                    expect(definition.template.childNodes[1].tagName).toBe('P');
                    expect(definition.template.childNodes[1]).toContainText('The end');
                });
            });

            // In the future we might also support arbitrary objects acting as component templates,
            // possibly with a config syntax like "template: { custom: arbitraryObject }", which
            // would be passed through (without normalisation) to a custom template engine.
        });

        describe('Viewmodels', function() {
            it('Can be configured as a createViewModel function', function() {
                var createViewModel = function() { };

                testConfigObject({ viewModel: { createViewModel: createViewModel } }, function(definition) {
                    expect(definition.createViewModel).toBe(createViewModel);
                });
            });

            it('Can be configured as a constructor function', function() {
                var myConstructor = function(params) { this.receivedValue = params.suppliedValue; };

                testConfigObject({ viewModel: myConstructor }, function(definition) {
                    var viewModel = definition.createViewModel(null /* componentInfo */, { suppliedValue: 123 });
                    expect(viewModel.receivedValue).toBe(123);
                });
            });

            it('Can be configured as an object instance', function() {
                var myInstance = {};

                testConfigObject({ viewModel: { instance: myInstance } }, function(definition) {
                    var viewModel = definition.createViewModel(null /* componentInfo */, null /* params */);
                    expect(viewModel).toBe(myInstance);
                });
            });

            it('Can be configured as an AMD module that supplies a createViewModel factory', function() {
                var createViewModel = function() { };
                mockAmdEnvironment(this, { 'some/module/path': { createViewModel: createViewModel } });

                testConfigObject({ viewModel: { require: 'some/module/path' } }, function(definition) {
                    expect(definition.createViewModel).toBe(createViewModel);
                });
            });

            it('Can be configured as an AMD module that is a constructor function', function() {
                var myConstructor = function(params) { this.receivedValue = params.suppliedValue; };
                mockAmdEnvironment(this, { 'some/module/path': myConstructor });

                testConfigObject({ viewModel: { require: 'some/module/path' } }, function(definition) {
                    var viewModel = definition.createViewModel(null /* componentInfo */, { suppliedValue: 234 });
                    expect(viewModel.receivedValue).toBe(234);
                });
            });

            it('Can be configured as an AMD module that supplies a viewmodel configuration', function() {
                var myConstructor = function(params) { this.receivedValue = params.suppliedValue; };
                mockAmdEnvironment(this, { 'some/module/path': { viewModel: myConstructor } });

                testConfigObject({ viewModel: { require: 'some/module/path' } }, function(definition) {
                    var viewModel = definition.createViewModel(null /* componentInfo */, { suppliedValue: 345 });
                    expect(viewModel.receivedValue).toBe(345);
                });
            });
        });

        describe('Combined viewmodel/templates', function() {
            it('Can be configured as an AMD module', function() {
                var moduleObject = {
                        // The module can have any values that are valid as the input to the whole resolution process
                        template: document.createDocumentFragment(),
                        viewModel: function(params) { this.receivedValue = params.suppliedValue; }
                    };
                mockAmdEnvironment(this, { 'some/module/path': moduleObject });

                testConfigObject({ require: 'some/module/path' }, function(definition) {
                    expect(definition.template).toBe(moduleObject.template);

                    var viewModel = definition.createViewModel(null /* componentInfo */, { suppliedValue: 567 });
                    expect(viewModel.receivedValue).toBe(567);
                });
            });
        });
    });

    function testConfigObject(configObject, assertionCallback) {
        ko.components.unregister(testComponentName);
        ko.components.register(testComponentName, configObject);

        var didComplete = false;
        ko.components.get(testComponentName, function(definition) {
            assertionCallback(definition);
            didComplete = true;
        });

        waitsFor(function() { return didComplete; }, 1000);
    }

    function mockAmdEnvironment(spec, definedModules) {
        spec.restoreAfter(window, 'require');
        window.require = function(modules, callback) {
            expect(modules.length).toBe(1);
            if (modules[0] in definedModules) {
                setTimeout(function() {
                    callback(definedModules[modules[0]]);
                }, 20);
            } else {
                throw new Error('Undefined module: ' + modules[0]);
            }
        };
    }
});
