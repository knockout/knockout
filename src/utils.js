/// <reference path="namespace.js" />

ko.utils = new (function () {
    var stringTrimRegex = /^(\s|\u00A0)+|(\s|\u00A0)+$/g;

    return {
        arrayForEach: function (array, action) {
            for (var i = 0, j = array.length; i < j; i++)
                action(array[i]);
        },

        arrayIndexOf: function (array, item) {
            if (typeof array.indexOf == "function")
                return array.indexOf(item);
            for (var i = 0, j = array.length; i < j; i++)
                if (array[i] == item)
                    return i;
            return -1;
        },

        arrayFirst: function (array, predicate, predicateOwner) {
            for (var i = 0, j = array.length; i < j; i++)
                if (predicate.call(predicateOwner, array[i]))
                    return array[i];
            return null;
        },

        arrayRemoveItem: function (array, itemToRemove) {
            var index = ko.utils.arrayIndexOf(array, itemToRemove);
            if (index >= 0)
                array.splice(index, 1);
        },

        arrayGetDistinctValues: function (array) {
            array = array || [];
            var result = [];
            for (var i = 0, j = array.length; i < j; i++) {
                if (ko.utils.arrayIndexOf(result, array[i]) < 0)
                    result.push(array[i]);
            }
            return result;
        },

        arrayMap: function (array, mapping) {
            array = array || [];
            var result = [];
            for (var i = 0, j = array.length; i < j; i++)
                result.push(mapping(array[i]));
            return result;
        },

        arrayFilter: function (array, predicate) {
            array = array || [];
            var result = [];
            for (var i = 0, j = array.length; i < j; i++)
                if (predicate(array[i]))
                    result.push(array[i]);
            return result;
        },

        setDomNodeChildren: function (domNode, childNodes) {
            while (domNode.firstChild) {
                ko.utils.domData.cleanNodeAndDescendants(domNode.firstChild);
                domNode.removeChild(domNode.firstChild);
            }
            if (childNodes) {
                ko.utils.arrayForEach(childNodes, function (childNode) {
                    domNode.appendChild(childNode);
                });
            }
        },

        replaceDomNodes: function (nodeToReplaceOrNodeArray, newNodesArray) {
            var nodesToReplaceArray = nodeToReplaceOrNodeArray.nodeType ? [nodeToReplaceOrNodeArray] : nodeToReplaceOrNodeArray;
            if (nodesToReplaceArray.length > 0) {
                var insertionPoint = nodesToReplaceArray[0];
                var parent = insertionPoint.parentNode;
                for (var i = 0, j = newNodesArray.length; i < j; i++)
                    parent.insertBefore(newNodesArray[i], insertionPoint);
                for (var i = 0, j = nodesToReplaceArray.length; i < j; i++) {
                    ko.utils.domData.cleanNodeAndDescendants(nodesToReplaceArray[i]);
                    parent.removeChild(nodesToReplaceArray[i]);
                }
            }
        },

        getElementsHavingAttribute: function (rootNode, attributeName) {
            if ((!rootNode) || (rootNode.nodeType != 1)) return [];
            var results = [];
            if (rootNode.getAttribute(attributeName) !== null)
                results.push(rootNode);
            var descendants = rootNode.getElementsByTagName("*");
            for (var i = 0, j = descendants.length; i < j; i++)
                if (descendants[i].getAttribute(attributeName) !== null)
                    results.push(descendants[i]);
            return results;
        },

        stringTrim: function (string) {
            return (string || "").replace(stringTrimRegex, "");
        },

        stringTokenize: function (string, delimiter) {
            var result = [];
            var tokens = (string || "").split(delimiter);
            for (var i = 0, j = tokens.length; i < j; i++) {
                var trimmed = ko.utils.stringTrim(tokens[i]);
                if (trimmed !== "")
                    result.push(trimmed);
            }
            return result;
        },

        evalWithinScope: function (expression, scope) {
            if (scope === undefined)
                return (new Function("return " + expression))();
            with (scope) { return eval("(" + expression + ")"); }
        },

        domNodeIsContainedBy: function (node, containedByNode) {
            if (containedByNode.compareDocumentPosition)
                return (containedByNode.compareDocumentPosition(node) & 16) == 16;
            while (node != null) {
                if (node == containedByNode)
                    return true;
                node = node.parentNode;
            }
            return false;
        },

        domNodeIsAttachedToDocument: function (node) {
            return ko.utils.domNodeIsContainedBy(node, document);
        },

        registerEventHandler: function (element, eventType, handler) {
            if (typeof jQuery != "undefined")
                jQuery(element).bind(eventType, handler);
            else if (typeof element.addEventListener == "function")
                element.addEventListener(eventType, handler, false);
            else if (typeof element.attachEvent != "undefined")
                element.attachEvent("on" + eventType, function (event) {
                    handler.call(element, event);
                });
            else
                throw new Error("Browser doesn't support addEventListener or attachEvent");
        },

        triggerEvent: function (element, eventType) {
            if (!(element && element.nodeType))
                throw new Error("element must be a DOM node when calling triggerEvent");

            if (typeof element.fireEvent != "undefined")
                element.fireEvent("on" + eventType);
            else if (typeof document.createEvent == "function") {
                if (typeof element.dispatchEvent == "function") {
                    var eventCategory = (eventType == "click" ? "MouseEvents" : "HTMLEvents"); // Might need to account for other event names at some point
                    var event = document.createEvent(eventCategory);
                    event.initEvent(eventType, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, element);
                    element.dispatchEvent(event);
                }
                else
                    throw new Error("The supplied element doesn't support dispatchEvent");
            }
            else
                throw new Error("Browser doesn't support triggering events");
        },

        unwrapObservable: function (value) {
            return ko.isObservable(value) ? value() : value;
        },

        domNodeHasCssClass: function (node, className) {
            var currentClassNames = (node.className || "").split(/\s+/);
            return ko.utils.arrayIndexOf(currentClassNames, className) >= 0;
        },

        toggleDomNodeCssClass: function (node, className, shouldHaveClass) {
            var hasClass = ko.utils.domNodeHasCssClass(node, className);
            if (shouldHaveClass && !hasClass) {
                node.className = (node.className || "") + " " + className;
            } else if (hasClass && !shouldHaveClass) {
                var currentClassNames = (node.className || "").split(/\s+/);
                var newClassName = "";
                for (var i = 0; i < currentClassNames.length; i++)
                    if (currentClassNames[i] != className)
                        newClassName += currentClassNames[i] + " ";
                node.className = ko.utils.stringTrim(newClassName);
            }
        },

        range: function (min, max) {
            min = ko.utils.unwrapObservable(min);
            max = ko.utils.unwrapObservable(max);
            var result = [];
            for (var i = min; i <= max; i++)
                result.push(i);
            return result;
        },

        domData: {
            uniqueId: 0,
            dataStoreKeyExpandoPropertyName: "__ko__" + (new Date).getTime(),
            dataStore: {},
            get: function (node, key) {
                var allDataForNode = ko.utils.domData.getAll(node, false);
                return allDataForNode === undefined ? undefined : allDataForNode[key];
            },
            set: function (node, key, value) {
                var allDataForNode = ko.utils.domData.getAll(node, true);
                allDataForNode[key] = value;
            },
            getAll: function (node, createIfNotFound) {
                var dataStoreKey = node[ko.utils.domData.dataStoreKeyExpandoPropertyName];
                if (!dataStoreKey) {
                    if (!createIfNotFound)
                        return undefined;
                    dataStoreKey = node[ko.utils.domData.dataStoreKeyExpandoPropertyName] = ko.utils.domData.uniqueId++;
                    ko.utils.domData[dataStoreKey] = {};
                }
                return ko.utils.domData[dataStoreKey];
            },
            cleanNode: function (node) {
                var dataStoreKey = node[ko.utils.domData.dataStoreKeyExpandoPropertyName];
                if (dataStoreKey) {
                    delete ko.utils.domData[dataStoreKey];
                    node[ko.utils.domData.dataStoreKeyExpandoPropertyName] = null;
                }
            },
            cleanNodeAndDescendants: function (node) {
                if ((node.nodeType != 1) && (node.nodeType != 9))
                    return;
                ko.utils.domData.cleanNode(node);
                var descendants = node.getElementsByTagName("*");
                for (var i = 0, j = descendants.length; i < j; i++)
                    ko.utils.domData.cleanNode(descendants[i]);
            }
        }
    }
})();

if (!Function.prototype.bind) {
    // Function.prototype.bind is a standard part of ECMAScript 5th Edition (December 2009, http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-262.pdf)
    // In case the browser doesn't implement it natively, provide a JavaScript implementation. This implementation is based on the one in prototype.js
    Function.prototype.bind = function (object) {
        var originalFunction = this, args = Array.prototype.slice.call(arguments), object = args.shift();
        return function () {
            return originalFunction.apply(object, args.concat(Array.prototype.slice.call(arguments)));
        }; 
    };
}