
(function () {
    // Objective:
    // * Given an input array, a container DOM node, and a function from array elements to arrays of DOM nodes,
    //   map the array elements to arrays of DOM nodes, concatenate together all these arrays, and use them to populate the container DOM node
    // * Next time we're given the same combination of things (with the array possibly having mutated), update the container DOM node
    //   so that its children is again the concatenation of the mappings of the array elements, but don't re-map any array elements that we
    //   previously mapped - retain those nodes, and just insert/delete other ones

    // "callbackAfterAddingNodes" will be invoked after any "mapping"-generated nodes are inserted into the container node
    // You can use this, for example, to activate bindings on those nodes.

    function fixUpNodesToBeRemoved(contiguousNodeArray) {
        // Before deleting or replacing a set of nodes that were previously outputted by the "map" function, we have to reconcile
        // them against what is in the DOM right now. It may be that some of the nodes have already been removed from the document,
        // or that new nodes might have been inserted in the middle, for example by a binding. Also, there may previously have been
        // leading comment nodes (created by rewritten string-based templates) that have since been removed during binding.
        // So, this function translates the old "map" output array into its best guess of what set of current DOM nodes should be removed.
        //
        // Rules:
        //   [A] Any leading nodes that aren't in the document any more should be ignored
        //       These most likely correspond to memoization nodes that were already removed during binding
        //       See https://github.com/SteveSanderson/knockout/pull/440
        //   [B] We want to output a contiguous series of nodes that are still in the document. So, ignore any nodes that
        //       have already been removed, and include any nodes that have been inserted among the previous collection

        // Rule [A]
        while (contiguousNodeArray.length && !ko.utils.domNodeIsAttachedToDocument(contiguousNodeArray[0]))
            contiguousNodeArray.splice(0, 1);

        // Rule [B]
        if (contiguousNodeArray.length > 1) {
            // Build up the actual new contiguous node set
            var current = contiguousNodeArray[0], last = contiguousNodeArray[contiguousNodeArray.length - 1], newContiguousSet = [current];
            while (current !== last) {
                current = current.nextSibling;
                if (!current) // Won't happen, except if the developer has manually removed some DOM elements (then we're in an undefined scenario)
                    return;
                newContiguousSet.push(current);
            }

            // ... then mutate the input array to match this.
            // (The following line replaces the contents of contiguousNodeArray with newContiguousSet)
            Array.prototype.splice.apply(contiguousNodeArray, [0, contiguousNodeArray.length].concat(newContiguousSet));
        }
    }

    function mapNodeAndRefreshWhenChanged(containerNode, mapping, valueToMap, callbackAfterAddingNodes, index) {
        // Map this array value inside a computed observable so we re-map when any dependency changes
        var mappedNodes = [];
        var computedObservable = ko.computed.possiblyWrap(function() {
            var newMappedNodes = mapping(valueToMap, index) || [];

            // On subsequent evaluations, just replace the previously-inserted DOM nodes
            if (mappedNodes.length > 0) {
                fixUpNodesToBeRemoved(mappedNodes);
                ko.utils.replaceDomNodes(mappedNodes, newMappedNodes);
                if (callbackAfterAddingNodes)
                    callbackAfterAddingNodes(valueToMap, newMappedNodes);
            }

            // Replace the contents of the mappedNodes array, thereby updating the record
            // of which nodes would be deleted if valueToMap was itself later removed
            mappedNodes.splice(0, mappedNodes.length);
            ko.utils.arrayPushAll(mappedNodes, newMappedNodes);
        }, containerNode, function() { return (mappedNodes.length == 0) || !ko.utils.domNodeIsAttachedToDocument(mappedNodes[0]) } );
        return { mappedNodes : mappedNodes, computedObservable : computedObservable };
    }

    var lastMappingResultDomDataKey = "setDomNodeChildrenFromArrayMapping_lastMappingResult";

    ko.utils.setDomNodeChildrenFromArrayMapping = function (domNode, array, mapping, options, callbackAfterAddingNodes) {
        // Compare the provided array against the previous one
        array = array || [];
        options = options || {};
        var isFirstExecution = ko.utils.domData.get(domNode, lastMappingResultDomDataKey) === undefined;
        var lastMappingResult = ko.utils.domData.get(domNode, lastMappingResultDomDataKey) || [];
        var lastArray = ko.utils.arrayMap(lastMappingResult, function (x) { return x.arrayEntry; });
        var editScript = ko.utils.compareArrays(lastArray, array);

        // Build the new mapping result
        var newMappingResult = [];
        var lastMappingResultIndex = 0;
        var nodesToDelete = [];
        var newMappingResultIndex = 0;
        var nodesAdded = [];
        var insertAfterNode = null;
        for (var i = 0, j = editScript.length; i < j; i++) {
            switch (editScript[i].status) {
                case "retained":
                    // Just keep the information - don't touch the nodes
                    var dataToRetain = lastMappingResult[lastMappingResultIndex];
                    dataToRetain.indexObservable(newMappingResultIndex);
                    newMappingResultIndex = newMappingResult.push(dataToRetain);
                    if (dataToRetain.domNodes.length > 0)
                        insertAfterNode = dataToRetain.domNodes[dataToRetain.domNodes.length - 1];
                    lastMappingResultIndex++;
                    break;

                case "deleted":
                    var mapData = lastMappingResult[lastMappingResultIndex];

                    // Stop tracking changes to the mapping for these nodes
                    if (mapData.computedObservable)
                        mapData.computedObservable.dispose();

                    // Queue these nodes for later removal
                    fixUpNodesToBeRemoved(mapData.domNodes);
                    ko.utils.arrayForEach(mapData.domNodes, function (node) {
                        nodesToDelete.push({
                          element: node,
                          index: i,
                          value: editScript[i].value
                        });
                        insertAfterNode = node;
                    });
                    lastMappingResultIndex++;
                    break;

                case "added":
                    var valueToMap = editScript[i].value;
                    var indexObservable = ko.observable(newMappingResultIndex);
                    var mapData = mapNodeAndRefreshWhenChanged(domNode, mapping, valueToMap, callbackAfterAddingNodes, indexObservable);
                    var mappedNodes = mapData.mappedNodes;

                    // On the first evaluation, insert the nodes at the current insertion point
                    newMappingResultIndex = newMappingResult.push({
                        arrayEntry: editScript[i].value,
                        domNodes: mappedNodes,
                        computedObservable: mapData.computedObservable,
                        indexObservable: indexObservable
                    });
                    for (var nodeIndex = 0, nodeIndexMax = mappedNodes.length; nodeIndex < nodeIndexMax; nodeIndex++) {
                        var node = mappedNodes[nodeIndex];
                        nodesAdded.push({
                          element: node,
                          index: i,
                          value: editScript[i].value
                        });
                        if (insertAfterNode == null) {
                            // Insert "node" (the newly-created node) as domNode's first child
                            ko.virtualElements.prepend(domNode, node);
                        } else {
                            // Insert "node" into "domNode" immediately after "insertAfterNode"
                            ko.virtualElements.insertAfter(domNode, node, insertAfterNode);
                        }
                        insertAfterNode = node;
                    }
                    if (callbackAfterAddingNodes)
                        callbackAfterAddingNodes(valueToMap, mappedNodes, indexObservable);
                    break;
            }
        }

        ko.utils.arrayForEach(nodesToDelete, function (node) { ko.cleanNode(node.element) });

        var invokedBeforeRemoveCallback = false;
        if (!isFirstExecution) {
            if (options['afterAdd']) {
                for (var i = 0; i < nodesAdded.length; i++)
                    options['afterAdd'](nodesAdded[i].element, nodesAdded[i].index, nodesAdded[i].value);
            }
            if (options['beforeRemove']) {
                for (var i = 0; i < nodesToDelete.length; i++)
                    options['beforeRemove'](nodesToDelete[i].element, nodesToDelete[i].index, nodesToDelete[i].value);
                invokedBeforeRemoveCallback = true;
            }
        }
        if (!invokedBeforeRemoveCallback && nodesToDelete.length) {
            for (var i = 0; i < nodesToDelete.length; i++) {
                var element = nodesToDelete[i].element;
                if (element.parentNode)
                    element.parentNode.removeChild(element);
            }
        }

        // Store a copy of the array items we just considered so we can difference it next time
        ko.utils.domData.set(domNode, lastMappingResultDomDataKey, newMappingResult);
    }
})();

ko.exportSymbol('utils.setDomNodeChildrenFromArrayMapping', ko.utils.setDomNodeChildrenFromArrayMapping);
