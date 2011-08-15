
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

    function executeTemplate(targetNodeOrNodeArray, renderMode, template, bindingContext, options) {
        options = options || {};
        var templateEngineToUse = (options['templateEngine'] || _templateEngine);
        ko.templateRewriting.ensureTemplateIsRewritten(template, templateEngineToUse);
        var renderedNodesArray = templateEngineToUse['renderTemplate'](template, bindingContext, options);

        // Loosely check result is an array of DOM nodes
        if ((typeof renderedNodesArray.length != "number") || (renderedNodesArray.length > 0 && typeof renderedNodesArray[0].nodeType != "number"))
            throw "Template engine must return an array of DOM nodes";

        if (renderedNodesArray)
            ko.utils.arrayForEach(renderedNodesArray, function (renderedNode) {
                // The following line is a no-op for native template engine (it's already stored the binding context when it ran applyBindings)
                // but other template engines need it because they don't call applyBindings (they use unmemoization instead)
                ko.storedBindingContextForNode(renderedNode, bindingContext);

                ko.memoization.unmemoizeDomNodeAndDescendants(renderedNode, [bindingContext]);
            });

        switch (renderMode) {
            case "replaceChildren": ko.utils.setDomNodeChildren(targetNodeOrNodeArray, renderedNodesArray); break;
            case "replaceNode": ko.utils.replaceDomNodes(targetNodeOrNodeArray, renderedNodesArray); break;
            case "ignoreTargetNode": break;
            default: throw new Error("Unknown renderMode: " + renderMode);
        }

        if (options['afterRender'])
            options['afterRender'](renderedNodesArray, bindingContext['$data']);

        return renderedNodesArray;
    }

    ko.renderTemplate = function (template, dataOrBindingContext, options, targetNodeOrNodeArray, renderMode) {
        options = options || {};
        if ((options['templateEngine'] || _templateEngine) == undefined)
            throw "Set a template engine before calling renderTemplate";
        renderMode = renderMode || "replaceChildren";

        if (targetNodeOrNodeArray) {
            var firstTargetNode = getFirstNodeFromPossibleArray(targetNodeOrNodeArray);
            
            var whenToDispose = function () { return (!firstTargetNode) || !ko.utils.domNodeIsAttachedToDocument(firstTargetNode); }; // Passive disposal (on next evaluation)
            var activelyDisposeWhenNodeIsRemoved = (firstTargetNode && renderMode == "replaceNode") ? firstTargetNode.parentNode : firstTargetNode;
            
            return new ko.dependentObservable( // So the DOM is automatically updated when any dependency changes                
                function () {
                    // Ensure we've got a proper binding context to work with
                    var bindingContext = (dataOrBindingContext && (dataOrBindingContext instanceof ko.bindingContext))
                        ? dataOrBindingContext
                        : new ko.bindingContext(ko.utils.unwrapObservable(dataOrBindingContext));

                    // Support selecting template as a function of the data being rendered
                    var templateName = typeof(template) == 'function' ? template(bindingContext['$data']) : template; 

                    var renderedNodesArray = executeTemplate(targetNodeOrNodeArray, renderMode, templateName, bindingContext, options);
                    if (renderMode == "replaceNode") {
                        targetNodeOrNodeArray = renderedNodesArray;
                        firstTargetNode = getFirstNodeFromPossibleArray(targetNodeOrNodeArray);
                    }
                },
                null,
                { 'disposeWhen': whenToDispose, 'disposeWhenNodeIsRemoved': activelyDisposeWhenNodeIsRemoved }
            );
        } else {
            // We don't yet have a DOM node to evaluate, so use a memo and render the template later when there is a DOM node
            return ko.memoization.memoize(function (domNode) {
                ko.renderTemplate(template, dataOrBindingContext, options, domNode, "replaceNode");
            });
        }
    };

    ko.renderTemplateForEach = function (template, arrayOrObservableArray, options, targetNode, parentBindingContext) {
        return new ko.dependentObservable(function () {
            var unwrappedArray = ko.utils.unwrapObservable(arrayOrObservableArray) || [];
            if (typeof unwrappedArray.length == "undefined") // Coerce single value into array
                unwrappedArray = [unwrappedArray];

            // Filter out any entries marked as destroyed
            var filteredArray = ko.utils.arrayFilter(unwrappedArray, function(item) { 
                return options['includeDestroyed'] || !item['_destroy'];
            });

            ko.utils.setDomNodeChildrenFromArrayMapping(targetNode, filteredArray, function (arrayValue) {
                // Support selecting template as a function of the data being rendered
                var templateName = typeof(template) == 'function' ? template(arrayValue) : template;
                
                var innerBindingContext = parentBindingContext.createChildContext(ko.utils.unwrapObservable(arrayValue));
                return executeTemplate(null, "ignoreTargetNode", templateName, innerBindingContext, options);
            }, options);
        }, null, { 'disposeWhenNodeIsRemoved': targetNode });
    };

    var templateSubscriptionDomDataKey = '__ko__templateSubscriptionDomDataKey__';
    function disposeOldSubscriptionAndStoreNewOne(element, newSubscription) {
        var oldSubscription = ko.utils.domData.get(element, templateSubscriptionDomDataKey);
        if (oldSubscription && (typeof(oldSubscription.dispose) == 'function'))
            oldSubscription.dispose();
        ko.utils.domData.set(element, templateSubscriptionDomDataKey, newSubscription);
    }
    
    ko.bindingHandlers['template'] = {
        'init': function(element, valueAccessor) {
            // Support anonymous templates
            var bindingValue = ko.utils.unwrapObservable(valueAccessor());
            if ((typeof bindingValue != "string") && !bindingValue.name) {
                // It's an anonymous template - store the element contents, then clear the element
                new ko.templateSources.anonymousTemplate(element).text(element.innerHTML);
                ko.utils.emptyDomNode(element);
            }
            return { 'controlsDescendantBindings': true };
        },
        'update': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var bindingValue = ko.utils.unwrapObservable(valueAccessor());
            var templateName; 
            var shouldDisplay = true;
            
            if (typeof bindingValue == "string") {
                templateName = bindingValue;
            } else {
                templateName = bindingValue.name;
                
                // Support "if"/"ifnot" conditions
                if ('if' in bindingValue)
                    shouldDisplay = shouldDisplay && ko.utils.unwrapObservable(bindingValue['if']);
                if ('ifnot' in bindingValue)
                    shouldDisplay = shouldDisplay && !ko.utils.unwrapObservable(bindingValue['ifnot']);
            }    
            
            var templateSubscription = null;
            
            if (typeof bindingValue['foreach'] != "undefined") {
                // Render once for each data point (treating data set as empty if shouldDisplay==false)
                var dataArray = (shouldDisplay && bindingValue['foreach']) || [];
                templateSubscription = ko.renderTemplateForEach(templateName || element, dataArray, /* options: */ bindingValue, element, bindingContext);
            }
            else {
                if (shouldDisplay) {
                    // Render once for this single data point (or use the viewModel if no data was provided)
                    var innerBindingContext = (typeof bindingValue == 'object') && ('data' in bindingValue)
                        ? bindingContext.createChildContext(ko.utils.unwrapObservable(bindingValue['data'])) // Given an explitit 'data' value, we create a child binding context for it
                        : bindingContext;                                                                    // Given no explicit 'data' value, we retain the same binding context
                    templateSubscription = ko.renderTemplate(templateName || element, innerBindingContext, /* options: */ bindingValue, element);
                } else
                    ko.utils.emptyDomNode(element);
            }
            
            // It only makes sense to have a single template subscription per element (otherwise which one should have its output displayed?)
            disposeOldSubscriptionAndStoreNewOne(element, templateSubscription);
        }
    };
})();

ko.exportSymbol('ko.setTemplateEngine', ko.setTemplateEngine);
ko.exportSymbol('ko.renderTemplate', ko.renderTemplate);
