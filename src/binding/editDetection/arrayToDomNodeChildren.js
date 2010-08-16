/// <reference path="compareArrays.js" />

(function () {
    // Objective:
    // * Given an input array, a container DOM node, and a function from array elements to arrays of DOM nodes,
    //   map the array elements to arrays of DOM nodes, concatenate together all these arrays, and use them to populate the container DOM node
    // * Next time we're given the same combination of things (with the array possibly having mutated), update the container DOM node
    //   so that its children is again the concatenation of the mappings of the array elements, but don't re-map any array elements that we
    //   previously mapped - retain those nodes, and just insert/delete other ones

    ko.utils.setDomNodeChildrenFromArrayMapping = function (domNode, array, mapping, options) {
        // Compare the provided array against the previous one
        array = array || [];
        options = options || {};
        var isFirstExecution = ko.utils.domData.get(domNode, "setDomNodeChildrenFromArrayMapping_lastMappingResult") === undefined;
        var lastMappingResult = ko.utils.domData.get(domNode, "setDomNodeChildrenFromArrayMapping_lastMappingResult") || [];
        var lastArray = ko.utils.arrayMap(lastMappingResult, function (x) { return x.arrayEntry; });
        var editScript = ko.utils.compareArrays(lastArray, array);

        // Build the new mapping result
        var newMappingResult = [];
        var lastMappingResultIndex = 0;
        var nodesToDelete = [];
        var nodesAdded = [];
        var insertAfterNode = null;
        for (var i = 0, j = editScript.length; i < j; i++) {
            switch (editScript[i].status) {
                case "retained":
                    // Just keep the information - don't touch the nodes
                    var dataToRetain = lastMappingResult[lastMappingResultIndex];
                    newMappingResult.push(dataToRetain);
                    if (dataToRetain.domNodes.length > 0)
                        insertAfterNode = dataToRetain.domNodes[dataToRetain.domNodes.length - 1];
                    lastMappingResultIndex++;
                    break;

                case "deleted":
                    // Queue these nodes for later removal
                    ko.utils.arrayForEach(lastMappingResult[lastMappingResultIndex].domNodes, function (node) {
                        nodesToDelete.push(node);
                        insertAfterNode = node;
                    });
                    lastMappingResultIndex++;
                    break;

                case "added": {
                    // Map this array value inside a dependentObservable so we re-map when any dependency changes
                    var mappedNodes = [], valueToMap = editScript[i].value;
                    ko.dependentObservable(function() {
                        var newMappedNodes = mapping(valueToMap) || [];
                        
                        // On subsequent evaluations, just replace the previously-inserted DOM nodes
                        if (mappedNodes.length > 0)
                            ko.utils.replaceDomNodes(mappedNodes, newMappedNodes);
                        
                        // Replace the contents of the mappedNodes array, thereby updating the record
                        // of which nodes would be deleted if valueToMap was itself later removed
                        mappedNodes.splice(0, mappedNodes.length);
                        ko.utils.arrayPushAll(mappedNodes, newMappedNodes);
                    }, null, { disposeWhen: function() { return (mappedNodes.length == 0) || !ko.utils.domNodeIsAttachedToDocument(mappedNodes[0]) } });
                    
                    // On the first evaluation, insert the nodes at the current insertion point
                    newMappingResult.push({ arrayEntry: editScript[i].value, domNodes: mappedNodes });
                    for (var nodeIndex = 0, nodeIndexMax = mappedNodes.length; nodeIndex < nodeIndexMax; nodeIndex++) {
                        var node = mappedNodes[nodeIndex];
                        nodesAdded.push(node);
                        if (insertAfterNode == null) {
                            // Insert at beginning
                            if (domNode.firstChild)
                                domNode.insertBefore(node, domNode.firstChild);
                            else
                                domNode.appendChild(node);
                        } else {
                            // Insert after insertion point
                            if (insertAfterNode.nextSibling)
                                domNode.insertBefore(node, insertAfterNode.nextSibling);
                            else
                                domNode.appendChild(node);
                        }
                        insertAfterNode = node;
                    }                    	
                    break;
                }
            }
        }
        
        ko.utils.arrayForEach(nodesToDelete, function (node) { ko.utils.domData.cleanNodeAndDescendants(node); });

        var invokedBeforeRemoveCallback = false;
        if (!isFirstExecution) {
            if (options.afterAdd)
                options.afterAdd(nodesAdded);
            if (options.beforeRemove) {
                options.beforeRemove(nodesToDelete);
                invokedBeforeRemoveCallback = true;
            }
        }
        if (!invokedBeforeRemoveCallback)
            ko.utils.arrayForEach(nodesToDelete, function (node) {
                if (node.parentNode)
                    node.parentNode.removeChild(node);
            });

        // Store a copy of the array items we just considered so we can difference it next time
        ko.utils.domData.set(domNode, "setDomNodeChildrenFromArrayMapping_lastMappingResult", newMappingResult);
    }
})();