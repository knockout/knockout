
ko.utils.domData = new (function () {
    var uniqueId = 0;
    var dataStoreKeyExpandoPropertyName = "__ko__" + (new Date).getTime();
    var dataStore = {};

    var getDataForNode, clear;
    if (window['WeakMap']) {
        getDataForNode = function (node, createIfNotFound) {
            var ownerDoc = node.ownerDocument,
                dataStore = ownerDoc[dataStoreKeyExpandoPropertyName] || (ownerDoc[dataStoreKeyExpandoPropertyName] = new ownerDoc.defaultView['WeakMap']());
            if (dataStore['has'](node)) {
                return dataStore.get(node);
            }
            if (createIfNotFound) {
                var dataForNode = {};
                dataStore.set(node, dataForNode);
                return dataForNode;
            }
        };
        clear = function (node) {
            var dataStore = node.ownerDocument[dataStoreKeyExpandoPropertyName];
            return dataStore ? dataStore['delete'](node) : false;
        };
    } else {
        getDataForNode = function (node, createIfNotFound) {
            var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
            var hasExistingDataStore = dataStoreKey && (dataStoreKey !== "null") && dataStore[dataStoreKey];
            if (!hasExistingDataStore) {
                if (!createIfNotFound)
                    return undefined;
                dataStoreKey = node[dataStoreKeyExpandoPropertyName] = "ko" + uniqueId++;
                dataStore[dataStoreKey] = {};
            }
            return dataStore[dataStoreKey];
        };
        clear = function (node) {
            var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
            if (dataStoreKey) {
                delete dataStore[dataStoreKey];
                node[dataStoreKeyExpandoPropertyName] = null;
                return true; // Exposing "did clean" flag purely so specs can infer whether things have been cleaned up as intended
            }
            return false;
        };
    }

    return {
        get: function (node, key) {
            var dataForNode = getDataForNode(node, false);
            return dataForNode && dataForNode[key];
        },
        set: function (node, key, value) {
            // Make sure we don't actually create a new domData key if we are actually deleting a value
            var dataForNode = getDataForNode(node, value !== undefined /* createIfNotFound */);
            dataForNode && (dataForNode[key] = value);
        },
        clear: clear,

        nextKey: function () {
            return (uniqueId++) + dataStoreKeyExpandoPropertyName;
        }
    };
})();

ko.exportSymbol('utils.domData', ko.utils.domData);
ko.exportSymbol('utils.domData.clear', ko.utils.domData.clear); // Exporting only so specs can clear up after themselves fully
