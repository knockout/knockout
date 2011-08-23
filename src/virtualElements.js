(function() {
    // "Virtual elements" is an abstraction on top of the usual DOM API which understands the notion that comment nodes
    // may be used to represent hierarchy (in addition to the DOM's natural hierarchy). 
    // If you call the DOM-manipulating functions on ko.virtualElements, you will be able to read and write the state 
    // of that virtual hierarchy
    // 
    // The point of all this is to support containerless templates (e.g., <!-- ko foreach:someCollection -->blah<!-- /ko -->)
    // without having to scatter special cases all over the binding and templating code.

    var startCommentRegex = /^\s*ko\s+(.*\:.*)\s*$/;
    var endCommentRegex =   /^\s*\/ko\s*$/;

    function isStartComment(node) {
        return (node.nodeType == 8) && node.nodeValue.match(startCommentRegex);
    }

    function isEndComment(node) {
        return (node.nodeType == 8) && node.nodeValue.match(endCommentRegex);
    }

    function getVirtualChildren(startComment) {
        var currentNode = startComment;
        var depth = 1;
        var children = [];
        while (currentNode = currentNode.nextSibling) {
            if (isEndComment(currentNode)) {
                depth--;
                if (depth === 0)
                    return children;
            }

            children.push(currentNode);

            if (isStartComment(currentNode))
                depth++;
        }
        throw new Error("Cannot find closing comment tag to match: " + startComment.nodeValue);
    }

    function getMatchingEndComment(startComment) {
        var allVirtualChildren = getVirtualChildren(startComment);
        if (allVirtualChildren.length > 0)
            return allVirtualChildren[allVirtualChildren.length - 1].nextSibling;
        return startComment.nextSibling;
    }

    function nodeArrayToText(nodeArray, cleanNodes) {
        var texts = [];
        for (var i = 0, j = nodeArray.length; i < j; i++) {
            if (cleanNodes)
                ko.utils.domNodeDisposal.cleanNode(nodeArray[i]);
            texts.push(ko.utils.outerHTML(nodeArray[i]));
        }
        return String.prototype.concat.apply("", texts);
    }   

    ko.virtualElements = {
        allowedBindings: {},

        childNodes: function(node) {
            return isStartComment(node) ? getVirtualChildren(node) : node.childNodes;
        },

        emptyNode: function(node) {
            if (!isStartComment(node))
                ko.utils.emptyDomNode(node);
            else {
                var virtualChildren = ko.virtualElements.childNodes(node);
                for (var i = 0, j = virtualChildren.length; i < j; i++)
                    ko.removeNode(virtualChildren[i]);
            }
        },

        setDomNodeChildren: function(node, childNodes) {
            if (!isStartComment(node))
                ko.utils.setDomNodeChildren(node, childNodes);
            else {
                ko.virtualElements.emptyNode(node);
                var endCommentNode = node.nextSibling; // Must be the next sibling, as we just emptied the children
                for (var i = 0, j = childNodes.length; i < j; i++)
                    endCommentNode.parentNode.insertBefore(childNodes[i], endCommentNode);
            }
        },

        prepend: function(containerNode, nodeToPrepend) {
            if (!isStartComment(containerNode)) {
                if (containerNode.firstChild)
                    containerNode.insertBefore(nodeToPrepend, containerNode.firstChild);
                else
                    containerNode.appendChild(nodeToPrepend);                           
            } else {
                // Start comments must always have a parent and at least one following sibling (the end comment)
                containerNode.parentNode.insertBefore(nodeToPrepend, containerNode.nextSibling);
            }
        },

        insertAfter: function(containerNode, nodeToInsert, insertAfterNode) {
            if (!isStartComment(containerNode)) {
                // Insert after insertion point
                if (insertAfterNode.nextSibling)
                    containerNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
                else
                    containerNode.appendChild(nodeToInsert);    
            } else {
                // Children of start comments must always have a parent and at least one following sibling (the end comment)
                containerNode.parentNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
            }                           
        },

        nextSibling: function(node) {
            if (!isStartComment(node)) {
                if (node.nextSibling && isEndComment(node.nextSibling))
                    return undefined;
                return node.nextSibling;
            } else {
                return getMatchingEndComment(node).nextSibling;
            }
        },

        virtualNodeBindingValue: function(node) {
            var regexMatch = isStartComment(node);
            return regexMatch ? regexMatch[1] : null;               
        },

        extractAnonymousTemplateIfVirtualElement: function(node) {
            if (ko.virtualElements.virtualNodeBindingValue(node)) {
                // Empty out the virtual children, and associate "node" with an anonymous template matching its previous virtual children
                var virtualChildren = ko.virtualElements.childNodes(node);
                var anonymousTemplateText = nodeArrayToText(virtualChildren, true);
                ko.virtualElements.emptyNode(node);
                new ko.templateSources.anonymousTemplate(node).text(anonymousTemplateText);
            }
        }       
    };  
})();
