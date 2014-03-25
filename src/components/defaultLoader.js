(function(undefined) {

    // The default loader is responsible for two things:
    // 1. Maintaining the default in-memory registry of component configuration objects
    //    (i.e., the thing you're writing to when you call ko.components.register(someName, ...))
    // 2. Answering requests for components by fetching configuration objects
    //    from that default in-memory registry and resolving them into standard
    //    component definition objects (of the form { createViewModel: ..., template: ... })
    // Custom loaders may override either of these facilities, i.e.,
    // 1. To supply configuration objects from some other source (e.g., conventions)
    // 2. Or, to resolve configuration objects by loading viewmodels/templates via arbitrary logic.

    var defaultConfigRegistry = {};

    ko.components.register = function(componentName, config) {
        if (!config) {
            throw new Error('Invalid configuration for ' + componentName);
        }

        if (ko.components.isRegistered(componentName)) {
            throw new Error('Component ' + componentName + ' is already registered');
        }

        defaultConfigRegistry[componentName] = config;
    }

    ko.components.isRegistered = function(componentName) {
        return componentName in defaultConfigRegistry;
    }

    ko.components.unregister = function(componentName) {
        delete defaultConfigRegistry[componentName];
        ko.components.clearCachedDefinition(componentName);
    }

    ko.components.defaultLoader = {
        'getConfig': function(componentName, callback) {
            var result = defaultConfigRegistry.hasOwnProperty(componentName)
                ? defaultConfigRegistry[componentName]
                : null;
            callback(result);
        },

        'loadComponent': function(componentName, config, callback) {
            var errorMessagePrefix = 'Component \'' + componentName + '\': ';

            if (typeof config['require'] === 'string') {
                // The config is the value of an AMD module
                requireAmdModule(errorMessagePrefix, config['require'], function(module) {
                    resolveConfig(errorMessagePrefix, componentName, module, callback);
                });
            } else {
                // The config is a { template: ..., viewModel: ... } object
                resolveConfig(errorMessagePrefix, componentName, config, callback);
            }
        }
    };

    // Takes a config object of the form { template: ..., viewModel: ... }, and asynchronously convert it
    // into the standard component definition format:
    //    { template: documentFragment, createViewModel: function(componentInfo, params) { ... } }.
    // Since both template and viewModel may need to be resolved asynchronously, both tasks are performed
    // in parallel, and the results joined when both are ready. We don't depend on any promises infrastructure,
    // so this is implemented manually below.
    function resolveConfig(errorMessagePrefix, componentName, config, callback) {
        var result = {},
            hasResolvedTemplate = false,
            hasResolvedViewModel = false,
            hasIssuedCallback = false,
            tryIssueCallback = function() {
                if (hasResolvedTemplate && hasResolvedViewModel && !hasIssuedCallback) {
                    hasIssuedCallback = true;
                    callback(result);
                }
            };

        if (config['template']) {
            resolveTemplate(errorMessagePrefix, config['template'], function(resolvedTemplate) {
                result['template'] = resolvedTemplate;
                hasResolvedTemplate = true;
                tryIssueCallback();
            });
        } else {
            hasResolvedTemplate = true;
        }

        if (config['viewModel']) {
            resolveViewModel(errorMessagePrefix, config['viewModel'], function(resolvedViewModel) {
                result['createViewModel'] = resolvedViewModel;
                hasResolvedViewModel = true;
                tryIssueCallback();
            });
        } else {
            hasResolvedViewModel = true;
        }

        // Handle the case where neither template nor viewmodel is defined, or
        // where one of them is not defined and the other completes synchronously.
        tryIssueCallback();
    }

    function err(message) {
        throw new Error(message);
    }

    function resolveTemplate(errorMessagePrefix, templateConfig, callback) {
        if (typeof templateConfig === 'string') {
            // Markup - parse it
            var nodeArray = ko.utils.parseHtmlFragment(templateConfig);
            callback(elementListToDocumentFragment(nodeArray, false /* shouldClone */));
        } else if (isDocumentFragment(templateConfig)) {
            // Pass through document fragments unchanged
            callback(templateConfig);
        } else if (templateConfig['element']) {
            var element = templateConfig['element'];
            if (isDomElement(element)) {
                // Element instance - use its child nodes
                callback(elementListToDocumentFragment(element.childNodes, true /* shouldClone */));
            } else if (typeof element === 'string') {
                // Element ID - find it, then use its child nodes
                var elemInstance = document.getElementById(element);
                if (elemInstance) {
                    callback(elementListToDocumentFragment(elemInstance.childNodes, true /* shouldClone */));
                } else {
                    err(errorMessagePrefix + 'Cannot find element with ID ' + templateConfig);
                }
            } else {
                err(errorMessagePrefix + 'Unknown element type: ' + element);
            }
        } else if (typeof templateConfig['require'] === 'string') {
            // AMD module
            requireAmdModule(errorMessagePrefix, templateConfig['require'], function(module) {
                // Continue resolution using the module value, which might be a document fragment,
                // a markup string, or even a DOM element instance
                resolveTemplate(errorMessagePrefix, module, callback);
            });
        } else {
            err(errorMessagePrefix + 'Unknown template value: ' + templateConfig);
        }
    }

    var createViewModelKey = 'createViewModel';

    function resolveViewModel(errorMessagePrefix, viewModelConfig, callback) {
        if (typeof viewModelConfig === 'function') {
            // Constructor - convert to standard factory function format
            // By design, this does *not* supply componentInfo to the constructor, as the intent is that
            // componentInfo contains non-viewmodel data (e.g., the component's element) that should only
            // be used in factory functions, not viewmodel constructors.
            callback(function (componentInfo, params) {
                return new viewModelConfig(params);
            });
        } else if (typeof viewModelConfig[createViewModelKey] === 'function') {
            // Already a factory function - use it as-is
            callback(viewModelConfig[createViewModelKey]);
        } else if ('instance' in viewModelConfig) {
            // Fixed object instance - promote to createViewModel format for API consistency
            var fixedInstance = viewModelConfig['instance'];
            callback(function (componentInfo, params) {
                return fixedInstance;
            });
        } else if (typeof viewModelConfig['require'] === 'string') {
            // AMD module
            requireAmdModule(errorMessagePrefix, viewModelConfig['require'], function(module) {
                // Continue resolution using the module value, which might be of any
                // of the allowed configuration formats for viewmodels
                resolveViewModel(errorMessagePrefix, module, callback);
            });
        } else if ('viewModel' in viewModelConfig) {
            // Resolved AMD module whose value is of the form { viewModel: ... }
            resolveViewModel(errorMessagePrefix, viewModelConfig['viewModel'], callback);
        } else {
            err(errorMessagePrefix + 'Unknown viewModel value: ' + viewModelConfig);
        }
    }

    function isDomElement(obj) {
        if (window.HTMLElement) {
            return obj instanceof HTMLElement;
        } else {
            return obj && obj.tagName && obj.nodeType === 1;
        }
    }

    function isDocumentFragment(obj) {
        if (window.DocumentFragment) {
            return obj instanceof DocumentFragment;
        } else {
            return obj && obj.nodeType === 11;
        }
    }

    function elementListToDocumentFragment(elementList, shouldClone) {
        // elementList can be a real array, or the .childNodes property of a DOM element
        var docFrag = document.createDocumentFragment();
        for (var i = 0, j = elementList.length; i < j; i++) {
            docFrag.appendChild(shouldClone ? elementList[i].cloneNode(true) : elementList[i]);
        }
        return docFrag;
    }

    function requireAmdModule(errorMessagePrefix, amdModuleName, callback) {
        if (window['require']) {
            require([amdModuleName], callback);
        } else {
            err(errorMessagePrefix + 'Uses require, but no AMD loader is present');
        }
    }

    ko.exportSymbol('components.register', ko.components.register);
    ko.exportSymbol('components.isRegistered', ko.components.isRegistered);
    ko.exportSymbol('components.unregister', ko.components.unregister);

    // Expose the default loader so that developers can directly ask it for configuration
    // or to resolve configuration
    ko.exportSymbol('components.defaultLoader', ko.components.defaultLoader);

    // By default, the default loader is the only registered component loader
    ko.components['loaders'].push(ko.components.defaultLoader);
})();
