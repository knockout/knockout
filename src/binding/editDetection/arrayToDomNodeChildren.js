(function () {
    // Objective:
    // * Given an input array, a container DOM node, and a function from array elements to arrays of DOM nodes,
    //   map the array elements to arrays of DOM nodes, concatenate together all these arrays, and use them to populate the container DOM node
    // * Next time we're given the same combination of things (with the array possibly having mutated), update the container DOM node
    //   so that its children is again the concatenation of the mappings of the array elements, but don't re-map any array elements that we
    //   previously mapped - retain those nodes, and just insert/delete other ones

    // "callbackAfterAddingNodes" will be invoked after any "mapping"-generated nodes are inserted into the container node
    // You can use this, for example, to activate bindings on those nodes.

    function mapNodeAndRefreshWhenChanged(containerNode, mapping, valueToMap, callbackAfterAddingNodes, index) {
        // Map this array value inside a dependentObservable so we re-map when any dependency changes
        var mappedNodes = [];
        var dependentObservable = ko.dependentObservable(function() {
            var newMappedNodes = mapping(valueToMap, index, ko.utils.fixUpContinuousNodeArray(mappedNodes, containerNode)) || [];

            // On subsequent evaluations, just replace the previously-inserted DOM nodes
            if (mappedNodes.length > 0) {
                ko.utils.replaceDomNodes(mappedNodes, newMappedNodes);
                if (callbackAfterAddingNodes)
                    ko.dependencyDetection.ignore(callbackAfterAddingNodes, null, [valueToMap, newMappedNodes, index]);
            }

            // Replace the contents of the mappedNodes array, thereby updating the record
            // of which nodes would be deleted if valueToMap was itself later removed
            mappedNodes.length = 0;
            ko.utils.arrayPushAll(mappedNodes, newMappedNodes);
        }, null, { disposeWhenNodeIsRemoved: containerNode, disposeWhen: function() { return !ko.utils.anyDomNodeIsAttachedToDocument(mappedNodes); } });
        return { mappedNodes : mappedNodes, dependentObservable : (dependentObservable.isActive() ? dependentObservable : undefined) };
    }

    var lastMappingResultDomDataKey = ko.utils.domData.nextKey(),
        deletedItemDummyValue = ko.utils.domData.nextKey();

    ko.utils.setDomNodeChildrenFromArrayMapping = function (domNode, array, mapping, options, callbackAfterAddingNodes, editScript) {
        array = array || [];
        if (typeof array.length == "undefined") // Coerce single value into array
            array = [array];

        options = options || {};
        var lastMappingResult = ko.utils.domData.get(domNode, lastMappingResultDomDataKey);
        var isFirstExecution = !lastMappingResult;

        // Build the new mapping result
        var newMappingResult = [];
        var lastMappingResultIndex = 0;
        var currentArrayIndex = 0;

        var nodesToDelete = [];
        var itemsToMoveFirstIndexes = [];
        var itemsForBeforeRemoveCallbacks = [];
        var itemsForMoveCallbacks = [];
        var itemsForAfterAddCallbacks = [];
        var mapData;
        var countWaitingForRemove = 0;

        function itemAdded(value) {
            mapData = { arrayEntry: value, indexObservable: ko.observable(currentArrayIndex++) };
            newMappingResult.push(mapData);
            if (!isFirstExecution) {
                itemsForAfterAddCallbacks.push(mapData);
            }
        }

        function itemMovedOrRetained(oldPosition) {
            mapData = lastMappingResult[oldPosition];
            if (currentArrayIndex !== mapData.indexObservable.peek())
                itemsForMoveCallbacks.push(mapData);
            // Since updating the index might change the nodes, do so before calling fixUpContinuousNodeArray
            mapData.indexObservable(currentArrayIndex++);
            ko.utils.fixUpContinuousNodeArray(mapData.mappedNodes, domNode);
            newMappingResult.push(mapData);
        }

        function callCallback(callback, items) {
            if (callback) {
                for (var i = 0, n = items.length; i < n; i++) {
                    ko.utils.arrayForEach(items[i].mappedNodes, function(node) {
                        callback(node, i, items[i].arrayEntry);
                    });
                }
            }
        }

        if (isFirstExecution) {
            ko.utils.arrayForEach(array, itemAdded);
        } else {
            if (!editScript || (lastMappingResult && lastMappingResult['_countWaitingForRemove'])) {
                // Compare the provided array against the previous one
                var lastArray = ko.utils.arrayMap(lastMappingResult, function (x) { return x.arrayEntry; }),
                    compareOptions = {
                        'dontLimitMoves': options['dontLimitMoves'],
                        'sparse': true
                    };
                editScript = ko.utils.compareArrays(lastArray, array, compareOptions);
            }

            for (var i = 0, editScriptItem, movedIndex, itemIndex; editScriptItem = editScript[i]; i++) {
                movedIndex = editScriptItem['moved'];
                itemIndex = editScriptItem['index'];
                switch (editScriptItem['status']) {
                    case "deleted":
                        while (lastMappingResultIndex < itemIndex) {
                            itemMovedOrRetained(lastMappingResultIndex++);
                        }
                        if (movedIndex === undefined) {
                            mapData = lastMappingResult[lastMappingResultIndex];

                            // Stop tracking changes to the mapping for these nodes
                            if (mapData.dependentObservable) {
                                mapData.dependentObservable.dispose();
                                mapData.dependentObservable = undefined;
                            }

                            // Queue these nodes for later removal
                            if (ko.utils.fixUpContinuousNodeArray(mapData.mappedNodes, domNode).length) {
                                if (options['beforeRemove']) {
                                    newMappingResult.push(mapData);
                                    countWaitingForRemove++;
                                    if (mapData.arrayEntry === deletedItemDummyValue) {
                                        mapData = null;
                                    } else {
                                        itemsForBeforeRemoveCallbacks.push(mapData);
                                    }
                                }
                                if (mapData) {
                                    nodesToDelete.push.apply(nodesToDelete, mapData.mappedNodes);
                                }
                            }
                        }
                        lastMappingResultIndex++;
                        break;

                    case "added":
                        while (currentArrayIndex < itemIndex) {
                            itemMovedOrRetained(lastMappingResultIndex++);
                        }
                        if (movedIndex !== undefined) {
                            itemsToMoveFirstIndexes.push(newMappingResult.length);
                            itemMovedOrRetained(movedIndex);
                        } else {
                            itemAdded(editScriptItem['value']);
                        }
                        break;
                }
            }

            while (currentArrayIndex < array.length) {
                itemMovedOrRetained(lastMappingResultIndex++);
            }

            // Record that the current view may still contain deleted items
            // because it means we won't be able to use a provided editScript.
            newMappingResult['_countWaitingForRemove'] = countWaitingForRemove;
        }

        // Store a copy of the array items we just considered so we can difference it next time
        ko.utils.domData.set(domNode, lastMappingResultDomDataKey, newMappingResult);

        // Call beforeMove first before any changes have been made to the DOM
        callCallback(options['beforeMove'], itemsForMoveCallbacks);

        // Next remove nodes for deleted items (or just clean if there's a beforeRemove callback)
        ko.utils.arrayForEach(nodesToDelete, options['beforeRemove'] ? ko.cleanNode : ko.removeNode);

        var i, j, lastNode, nodeToInsert, mappedNodes, activeElement;

        // Since most browsers remove the focus from an element when it's moved to another location,
        // save the focused element and try to restore it later.
        try {
            activeElement = domNode.ownerDocument.activeElement;
        } catch(e) {
            // IE9 throws if you access activeElement during page load (see issue #703)
        }

        // Try to reduce overall moved nodes by first moving the ones that were marked as moved by the edit script
        if (itemsToMoveFirstIndexes.length) {
            while ((i = itemsToMoveFirstIndexes.shift()) != undefined) {
                mapData = newMappingResult[i];
                for (lastNode = undefined; i; ) {
                    if ((mappedNodes = newMappingResult[--i].mappedNodes) && mappedNodes.length) {
                        lastNode = mappedNodes[mappedNodes.length-1];
                        break;
                    }
                }
                for (j = 0; nodeToInsert = mapData.mappedNodes[j]; lastNode = nodeToInsert, j++) {
                    ko.virtualElements.insertAfter(domNode, nodeToInsert, lastNode);
                }
            }
        }

        // Next add/reorder the remaining items (will include deleted items if there's a beforeRemove callback)
        for (i = 0; mapData = newMappingResult[i]; i++) {
            // Get nodes for newly added items
            if (!mapData.mappedNodes)
                ko.utils.extend(mapData, mapNodeAndRefreshWhenChanged(domNode, mapping, mapData.arrayEntry, callbackAfterAddingNodes, mapData.indexObservable));

            // Put nodes in the right place if they aren't there already
            for (j = 0; nodeToInsert = mapData.mappedNodes[j]; lastNode = nodeToInsert, j++) {
                ko.virtualElements.insertAfter(domNode, nodeToInsert, lastNode);
            }

            // Run the callbacks for newly added nodes (for example, to apply bindings, etc.)
            if (!mapData.initialized && callbackAfterAddingNodes) {
                callbackAfterAddingNodes(mapData.arrayEntry, mapData.mappedNodes, mapData.indexObservable);
                mapData.initialized = true;
                lastNode = mapData.mappedNodes[mapData.mappedNodes.length - 1];     // get the last node again since it may have been changed by a preprocessor
            }
        }

        // Restore the focused element if it had lost focus
        if (activeElement && domNode.ownerDocument.activeElement != activeElement) {
            activeElement.focus();
        }

        // If there's a beforeRemove callback, call it after reordering.
        // Note that we assume that the beforeRemove callback will usually be used to remove the nodes using
        // some sort of animation, which is why we first reorder the nodes that will be removed. If the
        // callback instead removes the nodes right away, it would be more efficient to skip reordering them.
        // Perhaps we'll make that change in the future if this scenario becomes more common.
        callCallback(options['beforeRemove'], itemsForBeforeRemoveCallbacks);

        // Replace the stored values of deleted items with a dummy value. This provides two benefits: it marks this item
        // as already "removed" so we won't call beforeRemove for it again, and it ensures that the item won't match up
        // with an actual item in the array and appear as "retained" or "moved".
        for (i = 0; i < itemsForBeforeRemoveCallbacks.length; ++i) {
            itemsForBeforeRemoveCallbacks[i].arrayEntry = deletedItemDummyValue;
        }

        // Finally call afterMove and afterAdd callbacks
        callCallback(options['afterMove'], itemsForMoveCallbacks);
        callCallback(options['afterAdd'], itemsForAfterAddCallbacks);
    }
})();

ko.exportSymbol('utils.setDomNodeChildrenFromArrayMapping', ko.utils.setDomNodeChildrenFromArrayMapping);
