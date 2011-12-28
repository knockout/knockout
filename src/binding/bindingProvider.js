(function() {
    var defaultBindingAttributeName = "data-bind";

    ko.bindingProvider = function() {
        this.bindingCache = {};
        this.bindingCacheIndex = 0;
        this['cacheUpperLimit'] = 100;
    };

    ko.utils.extend(ko.bindingProvider.prototype, {
        'nodeHasBindings': function(node) {
            switch (node.nodeType) {
                case 1: return node.getAttribute(defaultBindingAttributeName) != null;   // Element
                case 8: return ko.virtualElements.virtualNodeBindingValue(node) != null; // Comment node
                default: return false;
            }
        },

        'getBindings': function(node, bindingContext) {
            var bindingsString = this['getBindingsString'](node, bindingContext);
            return bindingsString ? this['parseBindingsString'](bindingsString, bindingContext) : null;
        },

        // The following function is only used internally by this default provider.
        // It's not part of the interface definition for a general binding provider.
        'getBindingsString': function(node, bindingContext) {
            switch (node.nodeType) {
                case 1: return node.getAttribute(defaultBindingAttributeName);   // Element
                case 8: return ko.virtualElements.virtualNodeBindingValue(node); // Comment node
                default: return null;
            }
        },

        // The following function is only used internally by this default provider.
        // It's not part of the interface definition for a general binding provider.
        'parseBindingsString': function(bindingsString, bindingContext) {
            try {
                var viewModel = bindingContext['$data'];
                var scopes = (typeof viewModel == 'object' && viewModel != null) ? [viewModel, bindingContext] : [bindingContext];
                var cacheKey = scopes.length + '_' + bindingsString;
                var bindingFunction;
                if (cacheKey in this.bindingCache) {
                    bindingFunction = this.bindingCache[cacheKey];
                    // bump cache index if difference is greater than ten
                    if (this.bindingCacheIndex - bindingFunction.bindingCacheIndex > 10)
                        bindingFunction.bindingCacheIndex = this.nextCacheValue();
                } else {
                    var rewrittenBindings = " { " + ko.jsonExpressionRewriting.insertPropertyAccessorsIntoJson(bindingsString) + " } ";
                    bindingFunction = this.bindingCache[cacheKey] = ko.utils.buildEvalFunction(rewrittenBindings, scopes.length);
                    bindingFunction.bindingCacheIndex = this.nextCacheValue();
                }
                return bindingFunction(scopes);
            } catch (ex) {
                throw new Error("Unable to parse bindings.\nMessage: " + ex + ";\nBindings value: " + bindingsString);
            }           
        },
        
        nextCacheValue: function() {
            this.keepCacheWithinLimits();
            return this.bindingCacheIndex++;
        },
        
        keepCacheWithinLimits: function() {
            if (this.bindingCacheIndex >= this['cacheUpperLimit']) {
                var halfLimit = (this['cacheUpperLimit']) / 2;
                if (this.bindingCacheIndex % halfLimit == 0) {
                    // clear bottom half of cache whenever cache is at upper limit
                    var limit = this.bindingCacheIndex - halfLimit;
                    setTimeout(function() {
                        this.clearCacheBottom(limit);
                    }.bind(this), 0);
                } 
            }
        },
        
        clearCacheBottom: function(limit) {
            for(var prop in this.bindingCache) {
                var bindingFunction = this.bindingCache[prop];
                if (typeof bindingFunction.bindingCacheIndex != 'undefined' && bindingFunction.bindingCacheIndex < limit) {
                    delete this.bindingCache[prop];
                }
            }
        }
    });

    ko.bindingProvider['instance'] = new ko.bindingProvider();
})();

ko.exportSymbol('ko.bindingProvider', ko.bindingProvider);