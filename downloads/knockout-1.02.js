// Knockout JavaScript library v1.02
// (c) 2010 Steven Sanderson - http://knockoutjs.com/
// License: Ms-Pl (http://www.opensource.org/licenses/ms-pl.html)

var ko = window.ko = {};
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

        stringifyJson: function (data) {
            if ((typeof JSON == "undefined") || (typeof JSON.stringify == "undefined"))
                throw new Error("Cannot find JSON.stringify(). Some browsers (e.g., IE < 8) don't support it natively, but you can overcome this by adding a script reference to json2.js, downloadable from http://www.json.org/json2.js");
            return JSON.stringify(ko.utils.unwrapObservable(data));
        },

        postJson: function (url, data) {
            data = ko.utils.unwrapObservable(data);
            var form = document.createElement("FORM");
            form.style.display = "none";
            form.action = url;
            form.method = "post";
            for (var key in data) {
                var input = document.createElement("INPUT");
                input.name = key;
                input.value = ko.utils.stringifyJson(ko.utils.unwrapObservable(data[key]));
                form.appendChild(input);
            }
            document.body.appendChild(form);
            form.submit();
            setTimeout(function () { form.parentNode.removeChild(form); }, 0);
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
                    dataStoreKey = node[ko.utils.domData.dataStoreKeyExpandoPropertyName] = "ko" + ko.utils.domData.uniqueId++;
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
}/// <reference path="utils.js" />

ko.memoization = (function () {
    var memos = {};

    function randomMax8HexChars() {
        return (((1 + Math.random()) * 0x100000000) | 0).toString(16).substring(1);
    }
    function generateRandomId() {
        return randomMax8HexChars() + randomMax8HexChars();
    }
    function findMemoNodes(rootNode, appendToArray) {
        if (!rootNode)
            return;
        if (rootNode.nodeType == 8) {
            var memoId = ko.memoization.parseMemoText(rootNode.nodeValue);
            if (memoId != null)
                appendToArray.push({ domNode: rootNode, memoId: memoId });
        } else if (rootNode.nodeType == 1) {
            for (var i = 0, childNodes = rootNode.childNodes, j = childNodes.length; i < j; i++)
                findMemoNodes(childNodes[i], appendToArray);
        }
    }

    return {
        memoize: function (callback) {
            if (typeof callback != "function")
                throw new Error("You can only pass a function to ko.memoization.memoize()");
            var memoId = generateRandomId();
            memos[memoId] = callback;
            return "<!--[ko_memo:" + memoId + "]-->";
        },

        unmemoize: function (memoId, callbackParams) {
            var callback = memos[memoId];
            if (callback === undefined)
                throw new Error("Couldn't find any memo with ID " + memoId + ". Perhaps it's already been unmemoized.");
            try {
                callback.apply(null, callbackParams || []);
                return true;
            }
            finally { delete memos[memoId]; }
        },

        unmemoizeDomNodeAndDescendants: function (domNode) {
            var memos = [];
            findMemoNodes(domNode, memos);
            for (var i = 0, j = memos.length; i < j; i++) {
                var node = memos[i].domNode;
                ko.memoization.unmemoize(memos[i].memoId, [node]);
                node.nodeValue = ""; // Neuter this node so we don't try to unmemoize it again
                if (node.parentNode)
                    node.parentNode.removeChild(node); // If possible, erase it totally (not always possible - someone else might just hold a reference to it then call unmemoizeDomNodeAndDescendants again)
            }
        },

        parseMemoText: function (memoText) {
            var match = memoText.match(/^\[ko_memo\:(.*?)\]$/);
            return match ? match[1] : null;
        }
    };
})();/// <reference path="../utils.js" />

ko.subscription = function (callback, disposeCallback) {
    this.callback = callback;
    this.dispose = disposeCallback;
};

ko.subscribable = function () {
    var _subscriptions = [];

    this.subscribe = function (callback, callbackTarget) {
        var boundCallback = callbackTarget ? function () { callback.call(callbackTarget) } : callback;

        var subscription = new ko.subscription(boundCallback, function () {
            ko.utils.arrayRemoveItem(_subscriptions, subscription);
        });
        _subscriptions.push(subscription);
        return subscription;
    };

    this.notifySubscribers = function (valueToNotify) {
        ko.utils.arrayForEach(_subscriptions.slice(0), function (subscription) {
            if (subscription)
                subscription.callback(valueToNotify);
        });
    };

    this.getSubscriptionsCount = function () {
        return _subscriptions.length;
    };
}

ko.isSubscribable = function (instance) {
    return typeof instance.subscribe == "function" && typeof instance.notifySubscribers == "function";
};/// <reference path="subscribable.js" />

ko.dependencyDetection = (function () {
    var _detectedDependencies = [];

    return {
        begin: function () {
            _detectedDependencies.push([]);
        },

        end: function () {
            return _detectedDependencies.pop();
        },

        registerDependency: function (subscribable) {
            if (!ko.isSubscribable(subscribable))
                throw "Only subscribable things can act as dependencies";
            if (_detectedDependencies.length > 0) {
                _detectedDependencies[_detectedDependencies.length - 1].push(subscribable);
            }
        }
    };
})();/// <reference path="dependencyDetection.js" />

ko.observable = function (initialValue) {
    var _latestValue = initialValue;

    function observable(newValue) {
        if (arguments.length > 0) {
            _latestValue = newValue;
            observable.notifySubscribers(_latestValue);
        }
        else // The caller only needs to be notified of changes if they did a "read" operation
            ko.dependencyDetection.registerDependency(observable);

        return _latestValue;
    }
    observable.__ko_proto__ = ko.observable;
    observable.valueHasMutated = function () { observable.notifySubscribers(_latestValue); }

    ko.subscribable.call(observable);
    return observable;
}
ko.isObservable = function (instance) {
    if ((instance === null) || (instance === undefined) || (instance.__ko_proto__ === undefined)) return false;
    if (instance.__ko_proto__ === ko.observable) return true;
    return ko.isObservable(instance.__ko_proto__); // Walk the prototype chain
}
ko.isWriteableObservable = function (instance) {
    return (typeof instance == "function") && instance.__ko_proto__ === ko.observable;
}/// <reference path="observable.js" />

ko.observableArray = function (initialValues) {
    var result = new ko.observable(initialValues);

    ko.utils.arrayForEach(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function (methodName) {
        result[methodName] = function () {
            var underlyingArray = result();
            var methodCallResult = underlyingArray[methodName].apply(underlyingArray, arguments);
            result.valueHasMutated();
            return methodCallResult;
        };
    });

    ko.utils.arrayForEach(["slice"], function (methodName) {
        result[methodName] = function () {
            var underlyingArray = result();
            return underlyingArray[methodName].apply(underlyingArray, arguments);
        };
    });

    result.remove = function (valueOrPredicate) {
        var underlyingArray = result();
        var remainingValues = [];
        var removedValues = [];
        var predicate = typeof valueOrPredicate == "function" ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
        for (var i = 0, j = underlyingArray.length; i < j; i++) {
            var value = underlyingArray[i];
            if (!predicate(value))
                remainingValues.push(value);
            else
                removedValues.push(value);
        }
        result(remainingValues);
        return removedValues;
    };

    result.removeAll = function (arrayOfValues) {
        if (!arrayOfValues)
            return [];
        return result.remove(function (value) {
            return ko.utils.arrayIndexOf(arrayOfValues, value) >= 0;
        });
    };

    result.indexOf = function (item) {
        var underlyingArray = result();
        return ko.utils.arrayIndexOf(underlyingArray, item);
    };

    return result;
}/// <reference path="observable.js" />

ko.dependentObservable = function (evaluatorFunction, evaluatorFunctionTarget, options) {
    if (typeof evaluatorFunction != "function")
        throw "Pass a function that returns the value of the dependentObservable";

    var _subscriptionsToDependencies = [];
    function disposeAllSubscriptionsToDependencies() {
        ko.utils.arrayForEach(_subscriptionsToDependencies, function (subscription) {
            subscription.dispose();
        });
        _subscriptionsToDependencies = [];
    }

    function replaceSubscriptionsToDependencies(newDependencies) {
        disposeAllSubscriptionsToDependencies();
        ko.utils.arrayForEach(newDependencies, function (dependency) {
            _subscriptionsToDependencies.push(dependency.subscribe(evaluate));
        });
    };

    var _latestValue, _isFirstEvaluation = true;
    function evaluate() {
        if ((!_isFirstEvaluation) && options && typeof options.disposeWhen == "function") {
            if (options.disposeWhen()) {
                dependentObservable.dispose();
                return;
            }
        }

        try {
            ko.dependencyDetection.begin();
            _latestValue = evaluatorFunctionTarget ? evaluatorFunction.call(evaluatorFunctionTarget) : evaluatorFunction();
        } catch (ex) {
            throw ex;
        } finally {
            var distinctDependencies = ko.utils.arrayGetDistinctValues(ko.dependencyDetection.end());
            replaceSubscriptionsToDependencies(distinctDependencies);
        }

        dependentObservable.notifySubscribers(_latestValue);
        _isFirstEvaluation = false;
    }

    function dependentObservable() {
        if (arguments.length > 0)
            throw "Cannot write a value to a dependentObservable. Do not pass any parameters to it";

        ko.dependencyDetection.registerDependency(dependentObservable);
        return _latestValue;
    }
    dependentObservable.__ko_proto__ = ko.dependentObservable;
    dependentObservable.getDependenciesCount = function () { return _subscriptionsToDependencies.length; }
    dependentObservable.dispose = function () {
        disposeAllSubscriptionsToDependencies();
    };

    ko.subscribable.call(dependentObservable);
    evaluate();
    return dependentObservable;
};
ko.dependentObservable.__ko_proto__ = ko.observable;/// <reference path="../utils.js" />

ko.jsonExpressionRewriting = (function () {
    var restoreCapturedTokensRegex = /\[ko_token_(\d+)\]/g;
    var javaScriptAssignmentTarget = /^[\_$a-z][\_$a-z]*(\[.*?\])*(\.[\_$a-z][\_$a-z]*(\[.*?\])*)*$/i;
    var javaScriptReservedWords = ["true", "false"];

    function restoreTokens(string, tokens) {
        return string.replace(restoreCapturedTokensRegex, function (match, tokenIndex) {
            return tokens[tokenIndex];
        });
    }

    function isWriteableValue(expression) {
        if (ko.utils.arrayIndexOf(javaScriptReservedWords, ko.utils.stringTrim(expression).toLowerCase()) >= 0)
            return false;
        return expression.match(javaScriptAssignmentTarget) !== null;
    }

    return {
        parseJson: function (jsonString) {
            jsonString = ko.utils.stringTrim(jsonString);
            if (jsonString.length < 3)
                return {};

            // We're going to split on commas, so first extract any blocks that may contain commas other than those at the top level
            var tokens = [];
            var tokenStart = null, tokenEndChar;
            for (var position = jsonString.charAt(0) == "{" ? 1 : 0; position < jsonString.length; position++) {
                var c = jsonString.charAt(position);
                if (tokenStart === null) {
                    switch (c) {
                        case '"':
                        case "'":
                        case "/":
                            tokenStart = position;
                            tokenEndChar = c;
                            break;
                        case "{":
                            tokenStart = position;
                            tokenEndChar = "}";
                            break;
                        case "[":
                            tokenStart = position;
                            tokenEndChar = "]";
                            break;
                    }
                } else if (c == tokenEndChar) {
                    var token = jsonString.substring(tokenStart, position + 1);
                    tokens.push(token);
                    var replacement = "[ko_token_" + (tokens.length - 1) + "]";
                    jsonString = jsonString.substring(0, tokenStart) + replacement + jsonString.substring(position + 1);
                    position -= (token.length - replacement.length);
                    tokenStart = null;
                }
            }

            // Now we can safely split on commas to get the key/value pairs
            var result = {};
            var keyValuePairs = jsonString.split(",");
            for (var i = 0, j = keyValuePairs.length; i < j; i++) {
                var pair = keyValuePairs[i];
                var colonPos = pair.indexOf(":");
                if ((colonPos > 0) && (colonPos < pair.length - 1)) {
                    var key = ko.utils.stringTrim(pair.substring(0, colonPos));
                    var value = ko.utils.stringTrim(pair.substring(colonPos + 1));
                    if (key.charAt(0) == "{")
                        key = key.substring(1);
                    if (value.charAt(value.length - 1) == "}")
                        value = value.substring(0, value.length - 1);
                    key = ko.utils.stringTrim(restoreTokens(key, tokens));
                    value = ko.utils.stringTrim(restoreTokens(value, tokens));
                    result[key] = value;
                }
            }
            return result;
        },

        insertPropertyAccessorsIntoJson: function (jsonString) {
            var parsed = ko.jsonExpressionRewriting.parseJson(jsonString);
            var propertyAccessorTokens = [];
            for (var key in parsed) {
                var value = parsed[key];
                if (isWriteableValue(value)) {
                    if (propertyAccessorTokens.length > 0)
                        propertyAccessorTokens.push(", ");
                    propertyAccessorTokens.push(key + " : function(__ko_value) { " + value + " = __ko_value; }");
                }
            }

            if (propertyAccessorTokens.length > 0) {
                var allPropertyAccessors = propertyAccessorTokens.join("");
                jsonString = jsonString + ", '_ko_property_writers' : { " + allPropertyAccessors + " } ";
            }

            return jsonString;
        }
    };
})();/// <reference path="../subscribables/dependentObservable.js" />

(function () {
    var bindingAttributeName = "data-bind";
    ko.bindingHandlers = {};

    function parseBindingAttribute(attributeText, viewModel) {
        try {
            var json = " { " + ko.jsonExpressionRewriting.insertPropertyAccessorsIntoJson(attributeText) + " } ";
            return ko.utils.evalWithinScope(json, viewModel === null ? window : viewModel);
        } catch (ex) {
            throw new Error("Unable to parse binding attribute.\nMessage: " + ex + ";\nAttribute value: " + attributeText);
        }
    }

    function invokeBindingHandler(handler, element, dataValue, allBindings, viewModel) {
        handler(element, dataValue, allBindings, viewModel);
    }

    ko.applyBindingsToNode = function (node, bindings, viewModel) {
        var isFirstEvaluation = true;
        new ko.dependentObservable(
            function () {
                var evaluatedBindings = (typeof bindings == "function") ? bindings() : bindings;
                var parsedBindings = evaluatedBindings || parseBindingAttribute(node.getAttribute(bindingAttributeName), viewModel);
                for (var bindingKey in parsedBindings) {
                    if (ko.bindingHandlers[bindingKey]) {
                        if (isFirstEvaluation && typeof ko.bindingHandlers[bindingKey].init == "function")
                            invokeBindingHandler(ko.bindingHandlers[bindingKey].init, node, parsedBindings[bindingKey], parsedBindings, viewModel);
                        if (typeof ko.bindingHandlers[bindingKey].update == "function")
                            invokeBindingHandler(ko.bindingHandlers[bindingKey].update, node, parsedBindings[bindingKey], parsedBindings, viewModel);
                    }
                }
            },
            null,
            { disposeWhen: function () { return !ko.utils.domNodeIsAttachedToDocument(node); } }
        );
        isFirstEvaluation = false;
    };

    ko.applyBindings = function (rootNode, viewModel) {
        var elemsWithBindingAttribute = ko.utils.getElementsHavingAttribute(rootNode, bindingAttributeName);
        ko.utils.arrayForEach(elemsWithBindingAttribute, function (element) {
            ko.applyBindingsToNode(element, null, viewModel);
        });
    };
})();/// <reference path="bindingAttributeSyntax.js" />

ko.bindingHandlers.click = {
    init: function (element, value, allBindings, viewModel) {
        ko.utils.registerEventHandler(element, "click", function (event) {
            try { value.call(viewModel); }
            finally {
                if (event.preventDefault)
                    event.preventDefault();
                else
                    event.returnValue = false;
            }
        });
    }
};

ko.bindingHandlers.submit = {
    init: function (element, value, allBindings, viewModel) {
        if (typeof value != "function")
            throw new Error("The value for a submit binding must be a function to invoke on submit");
        ko.utils.registerEventHandler(element, "submit", function (event) {
            try { value.call(viewModel); }
            finally {
                if (event.preventDefault)
                    event.preventDefault();
                else
                    event.returnValue = false;
            }
        });
    }
};

ko.bindingHandlers.visible = {
    update: function (element, value) {
        value = ko.utils.unwrapObservable(value);
        var isCurrentlyVisible = !(element.style.display == "none");
        if (value && !isCurrentlyVisible)
            element.style.display = "";
        else if ((!value) && isCurrentlyVisible)
            element.style.display = "none";
    }
}

ko.bindingHandlers.enable = {
    update: function (element, value) {
        value = ko.utils.unwrapObservable(value);
        if (value && element.disabled)
            element.removeAttribute("disabled");
        else if ((!value) && (!element.disabled))
            element.disabled = true;
    }
};

ko.bindingHandlers.disable = { update: function (element, value) { ko.bindingHandlers.enable.update(element, !ko.utils.unwrapObservable(value)); } };

ko.bindingHandlers.value = {
    init: function (element, value, allBindings) {
        var eventName = allBindings.valueUpdate || "change";
        if (ko.isWriteableObservable(value))
            ko.utils.registerEventHandler(element, eventName, function () { value(this.value); });
        else if (allBindings._ko_property_writers && allBindings._ko_property_writers.value)
            ko.utils.registerEventHandler(element, eventName, function () { allBindings._ko_property_writers.value(this.value); });
    },
    update: function (element, value) {
        var newValue = ko.utils.unwrapObservable(value);

        if (newValue != element.value) {
            var applyValueAction = function () { element.value = newValue; };
            applyValueAction();

            // Workaround for IE6 bug: It won't reliably apply values to SELECT nodes during the same execution thread
            // right after you've changed the set of OPTION nodes on it. So for that node type, we'll schedule a second thread
            // to apply the value as well.
            var alsoApplyAsynchronously = element.tagName == "SELECT";
            if (alsoApplyAsynchronously)
                setTimeout(applyValueAction, 0);
        }
    }
};

ko.bindingHandlers.options = {
    update: function (element, value, allBindings) {
        if (element.tagName != "SELECT")
            throw new Error("values binding applies only to SELECT elements");

        var previousSelectedValues = ko.utils.arrayMap(ko.utils.arrayFilter(element.childNodes, function (node) {
            return node.tagName && node.tagName == "OPTION" && node.selected;
        }), function (node) {
            return node.value || node.innerText || node.textContent;
        });

        value = ko.utils.unwrapObservable(value);
        var selectedValue = element.value;
        element.innerHTML = "";
        if (value) {
            if (typeof value.length != "number")
                value = [value];
            for (var i = 0, j = value.length; i < j; i++) {
                var option = document.createElement("OPTION");
                var optionValue = typeof allBindings.options_value == "string" ? value[i][allBindings.options_value] : value[i];
                option.value = optionValue.toString();
                option.innerHTML = (typeof allBindings.options_text == "string" ? value[i][allBindings.options_text] : optionValue).toString();
                element.appendChild(option);
            }
            // IE6 doesn't like us to assign selection to OPTION nodes before they're added to the document.
            // That's why we first added them without selection. Now it's time to set the selection.
            var newOptions = element.getElementsByTagName("OPTION");
            for (var i = 0, j = newOptions.length; i < j; i++) {
                if (ko.utils.arrayIndexOf(previousSelectedValues, newOptions[i].value) >= 0)
                    newOptions[i].selected = true;
            }
        }
    }
};

ko.bindingHandlers.selectedOptions = {
    getSelectedValuesFromSelectNode: function (selectNode) {
        var result = [];
        var nodes = selectNode.childNodes;
        for (var i = 0, j = nodes.length; i < j; i++) {
            var node = nodes[i];
            if ((node.tagName == "OPTION") && node.selected)
                result.push(node.value);
        }
        return result;
    },
    init: function (element, value, allBindings) {
        if (ko.isWriteableObservable(value))
            ko.utils.registerEventHandler(element, "change", function () { value(ko.bindingHandlers.selectedOptions.getSelectedValuesFromSelectNode(this)); });
        else if (allBindings._ko_property_writers && allBindings._ko_property_writers.value)
            ko.utils.registerEventHandler(element, "change", function () { allBindings._ko_property_writers.value(ko.bindingHandlers.selectedOptions.getSelectedValuesFromSelectNode(this)); });
    },
    update: function (element, value) {
        if (element.tagName != "SELECT")
            throw new Error("values binding applies only to SELECT elements");

        var newValue = ko.utils.unwrapObservable(value);
        if (newValue && typeof newValue.length == "number") {
            var nodes = element.childNodes;
            for (var i = 0, j = nodes.length; i < j; i++) {
                var node = nodes[i];
                if (node.tagName == "OPTION")
                    node.selected = ko.utils.arrayIndexOf(newValue, node.value) >= 0;
            }
        }
    }
};

ko.bindingHandlers.text = {
    update: function (element, value) {
        value = ko.utils.unwrapObservable(value);
        typeof element.innerText == "string" ? element.innerText = value
                                             : element.textContent = value;
    }
};

ko.bindingHandlers.css = {
    update: function (element, value) {
        value = value || {};
        for (var className in value) {
            if (typeof className == "string") {
                var shouldHaveClass = ko.utils.unwrapObservable(value[className]);
                ko.utils.toggleDomNodeCssClass(element, className, shouldHaveClass);
            }
        }
    }
};

ko.bindingHandlers.uniqueName = {
    init: function (element, value) {
        if (value)
            element.name = "ko_unique_" + (++ko.bindingHandlers.uniqueName.currentIndex);
    }
};
ko.bindingHandlers.uniqueName.currentIndex = 0;

ko.bindingHandlers.checked = {
    init: function (element, value, allBindings) {
        if (ko.isWriteableObservable(value)) {
            var updateHandler;
            if (element.type == "checkbox")
                updateHandler = function () { value(this.checked) };
            else if (element.type == "radio")
                updateHandler = function () { if (this.checked) value(this.value) };
            if (updateHandler) {
                ko.utils.registerEventHandler(element, "change", updateHandler);
                ko.utils.registerEventHandler(element, "click", updateHandler);
            }
        } else if (allBindings._ko_property_writers && allBindings._ko_property_writers.checked) {
            var updateHandler;
            if (element.type == "checkbox")
                updateHandler = function () { allBindings._ko_property_writers.checked(this.checked) };
            else if (element.type == "radio")
                updateHandler = function () { if (this.checked) allBindings._ko_property_writers.checked(this.value) };
            if (updateHandler) {
                ko.utils.registerEventHandler(element, "change", updateHandler);
                ko.utils.registerEventHandler(element, "click", updateHandler);
            }
        }
    },
    update: function (element, value) {
        value = ko.utils.unwrapObservable(value);
        if (element.type == "checkbox")
            element.checked = value;
        else if (element.type == "radio")
            element.checked = (element.value == value);
    }
};/// <reference path="../utils.js" />

ko.templateEngine = function () {
    this.renderTemplate = function (templateName, data, options) {
        throw "Override renderTemplate in your ko.templateEngine subclass";
    },
    this.isTemplateRewritten = function (templateName) {
        throw "Override isTemplateRewritten in your ko.templateEngine subclass";
    },
    this.rewriteTemplate = function (templateName, rewriterCallback) {
        throw "Override rewriteTemplate in your ko.templateEngine subclass";
    },
    this.createJavaScriptEvaluatorBlock = function (script) {
        throw "Override createJavaScriptEvaluatorBlock in your ko.templateEngine subclass";
    }
};/// <reference path="templateEngine.js" />

ko.templateRewriting = (function () {
    var memoizeBindingAttributeSyntaxRegex = /(<[a-z]+(\s+(?!data-bind=)[a-z0-9]+(=(\"[^\"]*\"|\'[^\']*\'))?)*\s+)data-bind=(["'])(.*?)\5/g;

    return {
        ensureTemplateIsRewritten: function (template, templateEngine) {
            if (!templateEngine.isTemplateRewritten(template))
                templateEngine.rewriteTemplate(template, function (htmlString) {
                    return ko.templateRewriting.memoizeBindingAttributeSyntax(htmlString, templateEngine);
                });
        },

        memoizeBindingAttributeSyntax: function (htmlString, templateEngine) {
            return htmlString.replace(memoizeBindingAttributeSyntaxRegex, function () {
                var tagToRetain = arguments[1];
                var dataBindAttributeValue = arguments[6];

                dataBindAttributeValue = ko.jsonExpressionRewriting.insertPropertyAccessorsIntoJson(dataBindAttributeValue);

                // For no obvious reason, Opera fails to evaluate dataBindAttributeValue unless it's wrapped in an additional anonymous function,
                // even though Opera's built-in debugger can evaluate it anyway. No other browser requires this extra indirection.
                var applyBindingsToNextSiblingScript = "ko.templateRewriting.applyMemoizedBindingsToNextSibling(function() { \
                    return (function() { return { " + dataBindAttributeValue + " } })() \
                })";
                return templateEngine.createJavaScriptEvaluatorBlock(applyBindingsToNextSiblingScript) + tagToRetain;
            });
        },

        applyMemoizedBindingsToNextSibling: function (bindings) {
            return ko.memoization.memoize(function (domNode) {
                if (domNode.nextSibling)
                    ko.applyBindingsToNode(domNode.nextSibling, bindings, null);
            });
        }
    }
})();/// <reference path="templating.js" />
/// <reference path="../subscribables/dependentObservable.js" />

(function () {
    var _templateEngine;
    ko.setTemplateEngine = function (templateEngine) {
        if ((templateEngine != undefined) && !(templateEngine instanceof ko.templateEngine))
            throw "templateEngine must inherit from ko.templateEngine";
        _templateEngine = templateEngine;
    }

    function getFirstNodeFromPossibleArray(nodeOrNodeArray) {
        return nodeOrNodeArray.nodeType ? nodeOrNodeArray
                                        : nodeOrNodeArray.length > 0 ? nodeOrNodeArray[0]
                                        : null;
    }

    function executeTemplate(targetNodeOrNodeArray, renderMode, template, data, options) {
        var dataForTemplate = ko.utils.unwrapObservable(data);

        options = options || {};
        var templateEngineToUse = (options.templateEngine || _templateEngine);
        ko.templateRewriting.ensureTemplateIsRewritten(template, templateEngineToUse);
        var renderedNodesArray = templateEngineToUse.renderTemplate(template, dataForTemplate, options);

        // Loosely check result is an array of DOM nodes
        if ((typeof renderedNodesArray.length != "number") || (renderedNodesArray.length > 0 && typeof renderedNodesArray[0].nodeType != "number"))
            throw "Template engine must return an array of DOM nodes";

        if (renderedNodesArray)
            ko.utils.arrayForEach(renderedNodesArray, function (renderedNode) {
                ko.memoization.unmemoizeDomNodeAndDescendants(renderedNode);
            });

        switch (renderMode) {
            case "replaceChildren": ko.utils.setDomNodeChildren(targetNodeOrNodeArray, renderedNodesArray); break;
            case "replaceNode": ko.utils.replaceDomNodes(targetNodeOrNodeArray, renderedNodesArray); break;
            case "ignoreTargetNode": break;
            default: throw new Error("Unknown renderMode: " + renderMode);
        }

        return renderedNodesArray;
    }

    ko.renderTemplate = function (template, data, options, targetNodeOrNodeArray, renderMode) {
        options = options || {};
        if ((options.templateEngine || _templateEngine) == undefined)
            throw "Set a template engine before calling renderTemplate";
        renderMode = renderMode || "replaceChildren";

        if (targetNodeOrNodeArray) {
            var firstTargetNode = getFirstNodeFromPossibleArray(targetNodeOrNodeArray);
            var whenToDispose = function () { return (!firstTargetNode) || !ko.utils.domNodeIsAttachedToDocument(firstTargetNode); };

            return new ko.dependentObservable( // So the DOM is automatically updated when any dependency changes                
                function () {
                    var renderedNodesArray = executeTemplate(targetNodeOrNodeArray, renderMode, template, data, options);
                    if (renderMode == "replaceNode") {
                        targetNodeOrNodeArray = renderedNodesArray;
                        firstTargetNode = getFirstNodeFromPossibleArray(targetNodeOrNodeArray);
                    }
                },
                null,
                { disposeWhen: whenToDispose }
            );
        } else {
            // We don't yet have a DOM node to evaluate, so use a memo and render the template later when there is a DOM node
            return ko.memoization.memoize(function (domNode) {
                ko.renderTemplate(template, data, options, domNode, "replaceNode");
            });
        }
    };

    ko.renderTemplateForEach = function (template, arrayOrObservableArray, options, targetNode) {
        var whenToDispose = function () { return !ko.utils.domNodeIsAttachedToDocument(targetNode); };

        new ko.dependentObservable(function () {
            var unwrappedArray = ko.utils.unwrapObservable(arrayOrObservableArray);
            if (typeof unwrappedArray.length == "undefined") // Coerce single value into array
                unwrappedArray = [unwrappedArray];

            ko.utils.setDomNodeChildrenFromArrayMapping(targetNode, unwrappedArray, function (arrayValue) {
                return executeTemplate(null, "ignoreTargetNode", template, arrayValue, options);
            }, options);
        }, null, { disposeWhen: whenToDispose });
    };

    ko.bindingHandlers.template = {
        update: function (element, bindingValue, allBindings, viewModel) {
            var templateName = typeof bindingValue == "string" ? bindingValue : bindingValue.name;

            if (typeof bindingValue.foreach != "undefined") {
                // Render once for each data point
                ko.renderTemplateForEach(templateName, bindingValue.foreach || [], { afterAdd: bindingValue.afterAdd, beforeRemove: bindingValue.beforeRemove }, element);
            }
            else {
                // Render once for this single data point (or use the viewModel if no data was provided)
                var templateData = bindingValue.data;
                ko.renderTemplate(templateName, typeof templateData == "undefined" ? viewModel : templateData, null, element);
            }
        }
    };
})();/// <reference path="../../utils.js" />

// Simple calculation based on Levenshtein distance.
(function () {

    function calculateEditDistanceMatrix(oldArray, newArray, maxAllowedDistance) {
        var distances = [];
        for (var i = 0; i <= newArray.length; i++)
            distances[i] = [];

        // Top row - transform old array into empty array via deletions
        for (var i = 0, j = Math.min(oldArray.length, maxAllowedDistance); i <= j; i++)
            distances[0][i] = i;

        // Left row - transform empty array into new array via additions
        for (var i = 1, j = Math.min(newArray.length, maxAllowedDistance); i <= j; i++) {
            distances[i][0] = i;
        }

        // Fill out the body of the array
        var oldIndex, oldIndexMax = oldArray.length, newIndex, newIndexMax = newArray.length;
        var distanceViaAddition, distanceViaDeletion;
        for (oldIndex = 1; oldIndex <= oldIndexMax; oldIndex++) {
            var newIndexMinForRow = Math.max(1, oldIndex - maxAllowedDistance);
            var newIndexMaxForRow = Math.min(newIndexMax, oldIndex + maxAllowedDistance);
            for (newIndex = newIndexMinForRow; newIndex <= newIndexMaxForRow; newIndex++) {
                if (oldArray[oldIndex - 1] === newArray[newIndex - 1])
                    distances[newIndex][oldIndex] = distances[newIndex - 1][oldIndex - 1];
                else {
                    var northDistance = distances[newIndex - 1][oldIndex] === undefined ? Number.MAX_VALUE : distances[newIndex - 1][oldIndex] + 1;
                    var westDistance = distances[newIndex][oldIndex - 1] === undefined ? Number.MAX_VALUE : distances[newIndex][oldIndex - 1] + 1;
                    distances[newIndex][oldIndex] = Math.min(northDistance, westDistance);
                }
            }
        }

        return distances;
    }

    function findEditScriptFromEditDistanceMatrix(editDistanceMatrix, oldArray, newArray) {
        var oldIndex = oldArray.length;
        var newIndex = newArray.length;
        var editScript = [];
        var maxDistance = editDistanceMatrix[newIndex][oldIndex];
        if (maxDistance === undefined)
            return null; // maxAllowedDistance must be too small
        while ((oldIndex > 0) || (newIndex > 0)) {
            var me = editDistanceMatrix[newIndex][oldIndex];
            var distanceViaAdd = (newIndex > 0) ? editDistanceMatrix[newIndex - 1][oldIndex] : maxDistance + 1;
            var distanceViaDelete = (oldIndex > 0) ? editDistanceMatrix[newIndex][oldIndex - 1] : maxDistance + 1;
            var distanceViaRetain = (newIndex > 0) && (oldIndex > 0) ? editDistanceMatrix[newIndex - 1][oldIndex - 1] : maxDistance + 1;
            if ((distanceViaAdd === undefined) || (distanceViaAdd < me - 1)) distanceViaAdd = maxDistance + 1;
            if ((distanceViaDelete === undefined) || (distanceViaDelete < me - 1)) distanceViaDelete = maxDistance + 1;
            if (distanceViaRetain < me - 1) distanceViaRetain = maxDistance + 1;

            if ((distanceViaAdd <= distanceViaDelete) && (distanceViaAdd < distanceViaRetain)) {
                editScript.push({ status: "added", value: newArray[newIndex - 1] });
                newIndex--;
            } else if ((distanceViaDelete < distanceViaAdd) && (distanceViaDelete < distanceViaRetain)) {
                editScript.push({ status: "deleted", value: oldArray[oldIndex - 1] });
                oldIndex--;
            } else {
                editScript.push({ status: "retained", value: oldArray[oldIndex - 1] });
                newIndex--;
                oldIndex--;
            }
        }
        return editScript.reverse();
    }

    ko.utils.compareArrays = function (oldArray, newArray, maxEditsToConsider) {
        if (maxEditsToConsider === undefined) {
            return ko.utils.compareArrays(oldArray, newArray, 1)                 // First consider likely case where there is at most one edit (very fast)
                || ko.utils.compareArrays(oldArray, newArray, 10)                // If that fails, account for a fair number of changes while still being fast
                || ko.utils.compareArrays(oldArray, newArray, Number.MAX_VALUE); // Ultimately give the right answer, even though it may take a long time
        } else {
            oldArray = oldArray || [];
            newArray = newArray || [];
            var editDistanceMatrix = calculateEditDistanceMatrix(oldArray, newArray, maxEditsToConsider);
            return findEditScriptFromEditDistanceMatrix(editDistanceMatrix, oldArray, newArray);
        }
    };
})();/// <reference path="compareArrays.js" />

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

                case "added":
                    // Map this array value and insert the resulting nodes at the current insertion point
                    var mappedNodes = mapping(editScript[i].value) || [];
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
})();/// <reference path="../templating.js" />

ko.jqueryTmplTemplateEngine = function () {
    function getTemplateNode(template) {
        var templateNode = document.getElementById(template);
        if (templateNode == null)
            throw new Error("Cannot find template with ID=" + template);
        return templateNode;
    }

    this.renderTemplate = function (template, data, options) {
        // jquery.tmpl doesn't like it if the template returns just text content or nothing - it only likes you to return DOM nodes.
        // To make things more flexible, we can wrap the whole template in a <script> node so that jquery.tmpl just processes it as
        // text and doesn't try to parse the output. Then, since jquery.tmpl has jQuery as a dependency anyway, we can use jQuery to
        // parse that text into a document fragment using jQuery.clean().
        var templateTextInWrapper = "<script type=\"text/html\">" + ko.utils.stringTrim(getTemplateNode(template).text) + "</script>";
        var renderedMarkupInWrapper = $.tmpl(templateTextInWrapper, data);
        return jQuery.clean([renderedMarkupInWrapper[0].text], document);
    },

    this.isTemplateRewritten = function (template) {
        return getTemplateNode(template).isRewritten === true;
    },

    this.rewriteTemplate = function (template, rewriterCallback) {
        var templateNode = getTemplateNode(template);
        var rewritten = rewriterCallback(templateNode.text)
        templateNode.text = rewritten;
        templateNode.isRewritten = true;
    },

    this.createJavaScriptEvaluatorBlock = function (script) {
        return "{{= " + script + "}}";
    },

    // Am considering making template registration a native part of the API (and storing added templates centrally), but for now it's specific to this template engine
    this.addTemplate = function (templateName, templateMarkup) {
        document.write("<script type='text/html' id='" + templateName + "'>" + templateMarkup + "</script>");
    }
};
ko.jqueryTmplTemplateEngine.prototype = new ko.templateEngine();

// Use this one by default
ko.setTemplateEngine(new ko.jqueryTmplTemplateEngine());