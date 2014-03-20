describe('Components: Loader registry', function() {
    var testAsyncDelay = 20,
        testComponentName = 'test-component',
        testComponentConfig = {},
        testComponentDefinition = { template: {} },
        loaderThatDoesNotReturnAnything = {
            getConfig: function(name, callback) {
                expect(name).toBe(testComponentName);
                setTimeout(function() { callback(null) }, testAsyncDelay);
            },
            loadComponent: function(name, config, callback) {
                expect(name).toBe(testComponentName);
                expect(config).toBe(testComponentConfig);
                setTimeout(function() { callback(null) }, testAsyncDelay);
            }
        },
        loaderThatHasNoHandlers = {},
        loaderThatReturnsConfig = {
            getConfig: function(name, callback) {
                expect(name).toBe(testComponentName);
                setTimeout(function() { callback(testComponentConfig) }, testAsyncDelay);
            }
        },
        loaderThatReturnsDefinition = {
            loadComponent: function(name, config, callback) {
                expect(name).toBe(testComponentName);
                expect(config).toBe(testComponentConfig);
                setTimeout(function() { callback(testComponentDefinition) }, testAsyncDelay);
            }
        },
        loaderThatShouldNeverBeCalled = {
            getConfig: function() { throw new Error('Should not be called'); },
            loadComponent: function() { throw new Error('Should not be called'); }
        },
        loaderThatCompletesSynchronously = {
            getConfig: function(name, callback) { callback(testComponentConfig); },
            loadComponent: function(name, config, callback) {
                expect(config).toBe(testComponentConfig);
                callback(testComponentDefinition);
            }
        },
        testLoaderChain = function(spec, chain, options) {
            spec.restoreAfter(ko.components, 'loaders');

            // Set up a chain of loaders, then query it
            ko.components.loaders = chain;

            var loadedDefinition = "Not yet loaded";
            ko.components.get(testComponentName, function(definition) {
                loadedDefinition = definition;
            });

            var onLoaded = function() {
                if ('expectedDefinition' in options) {
                    expect(loadedDefinition).toBe(options.expectedDefinition);
                }
                if ('done' in options) {
                    options.done(loadedDefinition);
                }
            };

            // Wait for and verify result
            if (loadedDefinition !== "Not yet loaded") {
                // Completed synchronously
                onLoaded();
            } else {
                // Will complete asynchronously
                waitsFor(function() { return loadedDefinition !== "Not yet loaded"; }, 300);
                runs(onLoaded);
            }
        };

    it('Exposes the list of loaders as an array', function() {
        expect(ko.components.loaders instanceof Array).toBe(true);
    });

    it('Obtains component config and component definition objects by invoking each loader in turn, asynchronously, until one supplies a value', function() {
        var loaders = [
            loaderThatDoesNotReturnAnything,
            loaderThatHasNoHandlers,
            loaderThatReturnsDefinition,
            loaderThatDoesNotReturnAnything,
            loaderThatReturnsConfig,
            loaderThatShouldNeverBeCalled
        ];

        testLoaderChain(this, loaders, { expectedDefinition: testComponentDefinition });
    });

    it('Supplies null if no registered loader returns a config object', function() {
        var loaders = [
            loaderThatDoesNotReturnAnything,
            loaderThatHasNoHandlers,
            loaderThatReturnsDefinition,
            loaderThatDoesNotReturnAnything
        ];

        testLoaderChain(this, loaders, { expectedDefinition: null });
    });

    it('Supplies null if no registered loader returns a component for a given config object', function() {
        var loaders = [
            loaderThatDoesNotReturnAnything,
            loaderThatHasNoHandlers,
            loaderThatReturnsConfig,
            loaderThatDoesNotReturnAnything
        ];

        testLoaderChain(this, loaders, { expectedDefinition: null });
    });

    it('Aborts if a getConfig call returns a value other than undefined', function() {
        // This is just to leave open the option to support synchronous return values in the future.
        // We would detect that a getConfig call wants to return synchronously based on getting a
        // non-undefined return value, and in that case would not wait for the callback.

        var loaders = [
            loaderThatReturnsDefinition,
            loaderThatDoesNotReturnAnything,
            {
                getConfig: function(name, callback) {
                    setTimeout(function() { callback(testComponentDefinition); }, 50);
                    return testComponentDefinition; // This is what's not allowed
                },

                // Unfortunately there's no way to catch the async exception, and we don't
                // want to clutter up the console during tests, so suppress this
                suppressLoaderExceptions: true
            },
            loaderThatReturnsConfig
        ];

        testLoaderChain(this, loaders, { expectedDefinition: null });
    });

    it('Aborts if a loadComponent call returns a value other than undefined', function() {
        // This is just to leave open the option to support synchronous return values in the future.
        // We would detect that a loadComponent call wants to return synchronously based on getting a
        // non-undefined return value, and in that case would not wait for the callback.

        var loaders = [
            loaderThatReturnsConfig,
            loaderThatDoesNotReturnAnything,
            {
                loadComponent: function(name, config, callback) {
                    setTimeout(function() { callback(testComponentDefinition); }, 50);
                    return testComponentDefinition; // This is what's not allowed
                },

                // Unfortunately there's no way to catch the async exception, and we don't
                // want to clutter up the console during tests, so suppress this
                suppressLoaderExceptions: true
            },
            loaderThatReturnsDefinition
        ];

        testLoaderChain(this, loaders, { expectedDefinition: null });
    });

    it('Ensures that the loading process completes asynchronously, even if the loader completed synchronously', function() {
        // This behavior is for consistency. Developers calling ko.components.get shouldn't have to
        // be concerned about whether the callback fires before or after their next line of code.

        var wasAsync = false;

        testLoaderChain(this, [loaderThatCompletesSynchronously], {
            expectedDefinition: testComponentDefinition,
            done: function() {
                expect(wasAsync).toBe(true);
            }
        });

        wasAsync = true;
    });

    it('By default, contains only the default loader', function() {
        expect(ko.components.loaders.length).toBe(1);
        expect(ko.components.loaders[0]).toBe(ko.components.defaultLoader);
    });
});
