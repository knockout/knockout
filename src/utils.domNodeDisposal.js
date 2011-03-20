
ko.utils.domNodeDisposal = new (function () {
    var domDataKey = "__ko_domNodeDisposal__" + (new Date).getTime();
    
    function getDisposeCallbacksCollection(node, createIfNotFound) {
        var allDisposeCallbacks = ko.utils.domData.get(node, domDataKey);
        if ((allDisposeCallbacks === undefined) && createIfNotFound) {
            allDisposeCallbacks = [];
            ko.utils.domData.set(node, domDataKey, allDisposeCallbacks);
        }
        return allDisposeCallbacks;
    }
    
    function cleanSingleNode(node) {
        // Run all the dispose callbacks
        var callbacks = getDisposeCallbacksCollection(node, false);
        if (callbacks) {
            for (var i = 0; i < callbacks.length; i++)
                callbacks[i](node);
        }	
        
        // Also erase the DOM data
        ko.utils.domData.clear(node);		
        
        // Special support for jQuery here because it's so commonly used.
        // Many jQuery plugins (including jquery.tmpl) store data using jQuery's equivalent of domData
        // so notify it to tear down any resources associated with the node & descendants here.
        if ((typeof jQuery == "function") && (typeof jQuery['cleanData'] == "function"))
            jQuery['cleanData']([node]);			
    }
    
    return {
        addDisposeCallback : function(node, callback) {
            if (typeof callback != "function")
                throw new Error("Callback must be a function");
            getDisposeCallbacksCollection(node, true).push(callback);
        },
        
        cleanNode : function(node) {
            if ((node.nodeType != 1) && (node.nodeType != 9))
                return;
            cleanSingleNode(node);
            var descendants = node.getElementsByTagName("*");
            for (var i = 0, j = descendants.length; i < j; i++)
                cleanSingleNode(descendants[i]);
        },
        
        removeNode : function(node) {
            ko.cleanNode(node);
            if (node.parentNode)
                node.parentNode.removeChild(node);
        }
    }
})();

ko.exportSymbol('ko.cleanNode', ko.utils.domNodeDisposal.cleanNode); // Shorthand name for convenience
ko.exportSymbol('ko.removeNode', ko.utils.domNodeDisposal.removeNode); // Shorthand name for convenience