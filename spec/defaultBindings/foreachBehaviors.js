describe('Binding: Foreach', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should remove descendant nodes from the document (and not bind them) if the value is falsey', function() {
        testNode.innerHTML = "<div data-bind='foreach: someItem'><span data-bind='text: someItem.nonExistentChildProp'></span></div>";
        expect(testNode.childNodes[0].childNodes.length).toEqual(1);
        ko.applyBindings({ someItem: null }, testNode);
        expect(testNode.childNodes[0].childNodes.length).toEqual(0);
    });

    it('Should remove descendant nodes from the document (and not bind them) if the value is undefined', function() {
        testNode.innerHTML = "<div data-bind='foreach: someItem'><span data-bind='text: someItem.nonExistentChildProp'></span></div>";
        expect(testNode.childNodes[0].childNodes.length).toEqual(1);
        ko.applyBindings({ someItem: undefined }, testNode);
        expect(testNode.childNodes[0].childNodes.length).toEqual(0);
    });

    it('Should duplicate descendant nodes for each value in the array value (and bind them in the context of that supplied value)', function() {
        testNode.innerHTML = "<div data-bind='foreach: someItems'><span data-bind='text: childProp'></span></div>";
        var someItems = [
            { childProp: 'first child' },
            { childProp: 'second child' }
        ];
        ko.applyBindings({ someItems: someItems }, testNode);
        expect(testNode.childNodes[0]).toContainHtml('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span>');
    });

    it('Should clean away any data values attached to the original template nodes before use', function() {
        // Represents issue https://github.com/SteveSanderson/knockout/pull/420
        testNode.innerHTML = "<div data-bind='foreach: [1, 2]'><span></span></div>";

        // Apply some DOM Data to the SPAN
        var span = testNode.childNodes[0].childNodes[0];
        expect(span.tagName).toEqual("SPAN");
        ko.utils.domData.set(span, "mydata", 123);

        // See that it vanishes because the SPAN is extracted as a template
        expect(ko.utils.domData.get(span, "mydata")).toEqual(123);
        ko.applyBindings(null, testNode);
        expect(ko.utils.domData.get(span, "mydata")).toEqual(undefined);

        // Also be sure the DOM Data doesn't appear in the output
        expect(testNode.childNodes[0]).toContainHtml('<span></span><span></span>');
        expect(ko.utils.domData.get(testNode.childNodes[0].childNodes[0], "mydata")).toEqual(undefined);
        expect(ko.utils.domData.get(testNode.childNodes[0].childNodes[1], "mydata")).toEqual(undefined);
    });

    it('Should be able to use $data to reference each array item being bound', function() {
        testNode.innerHTML = "<div data-bind='foreach: someItems'><span data-bind='text: $data'></span></div>";
        var someItems = ['alpha', 'beta'];
        ko.applyBindings({ someItems: someItems }, testNode);
        expect(testNode.childNodes[0]).toContainHtml('<span data-bind="text: $data">alpha</span><span data-bind="text: $data">beta</span>');
    });


    it('Should add and remove nodes to match changes in the bound array', function() {
        testNode.innerHTML = "<div data-bind='foreach: someItems'><span data-bind='text: childProp'></span></div>";
        var someItems = ko.observableArray([
            { childProp: 'first child' },
            { childProp: 'second child' }
        ]);
        ko.applyBindings({ someItems: someItems }, testNode);
        expect(testNode.childNodes[0]).toContainHtml('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span>');

        // Add items at the beginning...
        someItems.unshift({ childProp: 'zeroth child' });
        expect(testNode.childNodes[0]).toContainHtml('<span data-bind="text: childprop">zeroth child</span><span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span>');

        // ... middle
        someItems.splice(2, 0, { childProp: 'middle child' });
        expect(testNode.childNodes[0]).toContainHtml('<span data-bind="text: childprop">zeroth child</span><span data-bind="text: childprop">first child</span><span data-bind="text: childprop">middle child</span><span data-bind="text: childprop">second child</span>');

        // ... and end
        someItems.push({ childProp: 'last child' });
        expect(testNode.childNodes[0]).toContainHtml('<span data-bind="text: childprop">zeroth child</span><span data-bind="text: childprop">first child</span><span data-bind="text: childprop">middle child</span><span data-bind="text: childprop">second child</span><span data-bind="text: childprop">last child</span>');

        // Also remove from beginning...
        someItems.shift();
        expect(testNode.childNodes[0]).toContainHtml('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">middle child</span><span data-bind="text: childprop">second child</span><span data-bind="text: childprop">last child</span>');

        // ... and middle
        someItems.splice(1, 1);
        expect(testNode.childNodes[0]).toContainHtml('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span><span data-bind="text: childprop">last child</span>');

        // ... and end
        someItems.pop();
        expect(testNode.childNodes[0]).toContainHtml('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span>');

        // Also, marking as "destroy" should eliminate the item from display
        someItems.destroy(someItems()[0]);
        expect(testNode.childNodes[0]).toContainHtml('<span data-bind="text: childprop">second child</span>');
    });

    it('Should remove all nodes corresponding to a removed array item, even if they were generated via containerless templates', function() {
        // Represents issue https://github.com/SteveSanderson/knockout/issues/185
        testNode.innerHTML = "<div data-bind='foreach: someitems'>a<!-- ko if:true -->b<!-- /ko --></div>";
        var someitems = ko.observableArray([1,2]);
        ko.applyBindings({ someitems: someitems }, testNode);
        expect(testNode).toContainHtml('<div data-bind="foreach: someitems">a<!-- ko if:true -->b<!-- /ko -->a<!-- ko if:true -->b<!-- /ko --></div>');

        // Now remove items, and check the corresponding child nodes vanished
        someitems.splice(1, 1);
        expect(testNode).toContainHtml('<div data-bind="foreach: someitems">a<!-- ko if:true -->b<!-- /ko --></div>');
    });

    it('Should remove all nodes corresponding to a removed array item, even if they were added via containerless syntax and there are no other nodes', function() {
        ko.bindingHandlers.test = {
            init: function (element, valueAccessor) {
                var value = valueAccessor();
                ko.virtualElements.prepend(element, document.createTextNode(value));
            }
        };
        ko.virtualElements.allowedBindings['test'] = true;

        testNode.innerHTML = "x-<!--ko foreach: someitems--><!--ko test:$data--><!--/ko--><!--/ko-->";
        var someitems = ko.observableArray(["aaa","bbb"]);
        ko.applyBindings({ someitems: someitems }, testNode);
        expect(testNode).toContainText('x-aaabbb');

        // Now remove items, and check the corresponding child nodes vanished
        someitems.splice(1, 1);
        expect(testNode).toContainText('x-aaa');
    });

    it('Should update all nodes corresponding to a changed array item, even if they were generated via containerless templates', function() {
        testNode.innerHTML = "<div data-bind='foreach: someitems'><!-- ko if:true --><span data-bind='text: $data'></span><!-- /ko --></div>";
        var someitems = [ ko.observable('A'), ko.observable('B') ];
        ko.applyBindings({ someitems: someitems }, testNode);
        expect(testNode).toContainText('AB');

        // Now update an item
        someitems[0]('A2');
        expect(testNode).toContainText('A2B');
    });

    it('Should be able to supply show "_destroy"ed items via includeDestroyed option', function() {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, includeDestroyed: true }'><span data-bind='text: childProp'></span></div>";
        var someItems = ko.observableArray([
            { childProp: 'first child' },
            { childProp: 'second child', _destroy: true }
        ]);
        ko.applyBindings({ someItems: someItems }, testNode);
        expect(testNode.childNodes[0]).toContainHtml('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span>');
    });

    it('Should be able to supply afterAdd and beforeRemove callbacks', function() {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, afterAdd: myAfterAdd, beforeRemove: myBeforeRemove }'><span data-bind='text: $data'></span></div>";
        var someItems = ko.observableArray(['first child']);
        var afterAddCallbackData = [], beforeRemoveCallbackData = [];
        ko.applyBindings({
            someItems: someItems,
            myAfterAdd: function(elem, index, value) { afterAddCallbackData.push({ elem: elem, value: value, currentParentClone: elem.parentNode.cloneNode(true) }) },
            myBeforeRemove: function(elem, index, value) { beforeRemoveCallbackData.push({ elem: elem, value: value, currentParentClone: elem.parentNode.cloneNode(true) }) }
        }, testNode);

        expect(testNode.childNodes[0]).toContainHtml('<span data-bind="text: $data">first child</span>');

        // Try adding
        someItems.push('added child');
        expect(testNode.childNodes[0]).toContainHtml('<span data-bind="text: $data">first child</span><span data-bind="text: $data">added child</span>');
        expect(afterAddCallbackData.length).toEqual(1);
        expect(afterAddCallbackData[0].elem).toEqual(testNode.childNodes[0].childNodes[1]);
        expect(afterAddCallbackData[0].value).toEqual("added child");
        expect(afterAddCallbackData[0].currentParentClone).toContainHtml('<span data-bind="text: $data">first child</span><span data-bind="text: $data">added child</span>');

        // Try removing
        someItems.shift();
        expect(beforeRemoveCallbackData.length).toEqual(1);
        expect(beforeRemoveCallbackData[0].elem).toContainText("first child");
        expect(beforeRemoveCallbackData[0].value).toEqual("first child");
        // Note that when using "beforeRemove", we *don't* remove the node from the doc - it's up to the beforeRemove callback to do it. So, check it's still there.
        expect(beforeRemoveCallbackData[0].currentParentClone).toContainHtml('<span data-bind="text: $data">first child</span><span data-bind="text: $data">added child</span>');
        expect(testNode.childNodes[0]).toContainHtml('<span data-bind="text: $data">first child</span><span data-bind="text: $data">added child</span>');

        // Remove another item
        beforeRemoveCallbackData = [];
        someItems.shift();
        expect(beforeRemoveCallbackData.length).toEqual(1);
        expect(beforeRemoveCallbackData[0].elem).toContainText("added child");
        expect(beforeRemoveCallbackData[0].value).toEqual("added child");
        // Neither item has yet been removed and both are still in their original locations
        expect(beforeRemoveCallbackData[0].currentParentClone).toContainHtml('<span data-bind="text: $data">first child</span><span data-bind="text: $data">added child</span>');
        expect(testNode.childNodes[0]).toContainHtml('<span data-bind="text: $data">first child</span><span data-bind="text: $data">added child</span>');

        // Try adding the item back; it should be added and not confused with the removed item
        testNode.childNodes[0].innerHTML = '';  // Actually remove *removed* nodes to check that they are not added back in
        afterAddCallbackData = [];
        someItems.push('added child');
        expect(testNode.childNodes[0]).toContainHtml('<span data-bind="text: $data">added child</span>');
        expect(afterAddCallbackData.length).toEqual(1);
        expect(afterAddCallbackData[0].elem).toEqual(testNode.childNodes[0].childNodes[0]);
        expect(afterAddCallbackData[0].value).toEqual("added child");
        expect(afterAddCallbackData[0].currentParentClone).toContainHtml('<span data-bind="text: $data">added child</span>');
    });

    it('Should call an afterRender callback function and not cause updates if an observable accessed in the callback is changed', function () {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, afterRender: callback }'><span data-bind='text: childprop'></span></div>";
        var callbackObservable = ko.observable(1),
            someItems = ko.observableArray([{ childprop: 'first child' }]),
            callbacks = 0;
        ko.applyBindings({ someItems: someItems, callback: function() { callbackObservable(); callbacks++; } }, testNode);
        expect(callbacks).toEqual(1);

        // Change the array, but don't update the observableArray so that the foreach binding isn't updated
        someItems().push({ childprop: 'hidden child'});
        expect(testNode.childNodes[0]).toContainText('first child');
        // Update callback observable and check that the binding wasn't updated
        callbackObservable(2);
        expect(testNode.childNodes[0]).toContainText('first child');
        // Update the observableArray and verify that the binding is now updated
        someItems.valueHasMutated();
        expect(testNode.childNodes[0]).toContainText('first childhidden child');
    });

    it('Should call an afterRender callback, passing all of the rendered nodes, accounting for node preprocessing and virtual element bindings', function() {
        // Set up a binding provider that converts text nodes to expressions
        var originalBindingProvider = ko.bindingProvider.instance,
            preprocessingBindingProvider = function() { };
        preprocessingBindingProvider.prototype = originalBindingProvider;
        ko.bindingProvider.instance = new preprocessingBindingProvider();
        ko.bindingProvider.instance.preprocessNode = function(node) {
            if (node.nodeType === 3 && node.data.charAt(0) === "$") {
                var newNodes = [
                    document.createComment('ko text: ' + node.data),
                    document.createComment('/ko')
                ];
                for (var i = 0; i < newNodes.length; i++) {
                    node.parentNode.insertBefore(newNodes[i], node);
                }
                node.parentNode.removeChild(node);
                return newNodes;
            }
        };

        // Now perform a foreach binding, and see that afterRender gets the output from the preprocessor and bindings
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, afterRender: callback }'><span>[</span>$data<span>]</span></div>";
        var someItems = ko.observableArray(['Alpha', 'Beta']),
            callbackReceivedArrayValues = [];
        ko.applyBindings({
            someItems: someItems,
            callback: function(nodes, arrayValue) {
                expect(nodes.length).toBe(5);
                expect(nodes[0]).toContainText('[');    // <span>[</span>
                expect(nodes[1].nodeType).toBe(8);      // <!-- ko text: $data -->
                expect(nodes[2].nodeType).toBe(3);      // text node inserted by text binding
                expect(nodes[3].nodeType).toBe(8);      // <!-- /ko -->
                expect(nodes[4]).toContainText(']');    // <span>]</span>
                callbackReceivedArrayValues.push(arrayValue);
            }
        }, testNode);

        expect(testNode.childNodes[0]).toContainText('[Alpha][Beta]');
        expect(callbackReceivedArrayValues).toEqual(['Alpha', 'Beta']);

        ko.bindingProvider.instance = originalBindingProvider;
    });

    it('Exception in afterAdd callback should not cause extra elements on next update', function () {
        // See https://github.com/knockout/knockout/issues/1794
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, afterAdd: callback }'><span data-bind='text: $data'></span></div>";
        var someItems = ko.observableArray([ 'A', 'B', 'C' ]),
            callback = function(element, index, data) { if (data === 'D') throw "Exception"; };

        ko.applyBindings({someItems: someItems, callback: callback });
        expect(testNode.childNodes[0]).toContainText('ABC');

        expect(function() { someItems.push('D'); }).toThrow("Exception");
        expect(testNode.childNodes[0]).toContainText('ABCD');

        expect(function() { someItems.push('E'); }).not.toThrow();
        expect(testNode.childNodes[0]).toContainText('ABCDE');
    });

    it('Should call an afterAdd callback function and not cause updates if an observable accessed in the callback is changed', function () {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, afterAdd: callback }'><span data-bind='text: childprop'></span></div>";
        var callbackObservable = ko.observable(1),
            someItems = ko.observableArray([]),
            callbacks = 0;
        ko.applyBindings({ someItems: someItems, callback: function() { callbackObservable(); callbacks++; } }, testNode);
        someItems.push({ childprop: 'added child'});
        expect(callbacks).toEqual(1);

        // Change the array, but don't update the observableArray so that the foreach binding isn't updated
        someItems().push({ childprop: 'hidden child'});
        expect(testNode.childNodes[0]).toContainText('added child');
        // Update callback observable and check that the binding wasn't updated
        callbackObservable(2);
        expect(testNode.childNodes[0]).toContainText('added child');
        // Update the observableArray and verify that the binding is now updated
        someItems.valueHasMutated();
        expect(testNode.childNodes[0]).toContainText('added childhidden child');
    });

    it('Should call a beforeRemove callback function and not cause updates if an observable accessed in the callback is changed', function () {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, beforeRemove: callback }'><span data-bind='text: childprop'></span></div>";
        var callbackObservable = ko.observable(1),
            someItems = ko.observableArray([{ childprop: 'first child' }, { childprop: 'second child' }]),
            callbacks = 0;
        ko.applyBindings({ someItems: someItems, callback: function(elem) { callbackObservable(); callbacks++; ko.removeNode(elem); } }, testNode);
        someItems.pop();
        expect(callbacks).toEqual(1);

        // Change the array, but don't update the observableArray so that the foreach binding isn't updated
        someItems().push({ childprop: 'hidden child'});
        expect(testNode.childNodes[0]).toContainText('first child');
        // Update callback observable and check that the binding wasn't updated
        callbackObservable(2);
        expect(testNode.childNodes[0]).toContainText('first child');
        // Update the observableArray and verify that the binding is now updated
        someItems.valueHasMutated();
        expect(testNode.childNodes[0]).toContainText('first childhidden child');
    });

    it('Should call an afterMove callback function and not cause updates if an observable accessed in the callback is changed', function () {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, afterMove: callback }'><span data-bind='text: childprop'></span></div>";
        var callbackObservable = ko.observable(1),
            someItems = ko.observableArray([{ childprop: 'first child' }]),
            callbacks = 0;
        ko.applyBindings({ someItems: someItems, callback: function() { callbackObservable(); callbacks++; } }, testNode);
        someItems.splice(0, 0, { childprop: 'added child'});
        expect(callbacks).toEqual(1);

        // Change the array, but don't update the observableArray so that the foreach binding isn't updated
        someItems().push({ childprop: 'hidden child'});
        expect(testNode.childNodes[0]).toContainText('added childfirst child');
        // Update callback observable and check that the binding wasn't updated
        callbackObservable(2);
        expect(testNode.childNodes[0]).toContainText('added childfirst child');
        // Update the observableArray and verify that the binding is now updated
        someItems.valueHasMutated();
        expect(testNode.childNodes[0]).toContainText('added childfirst childhidden child');
    });

    it('Should call a beforeMove callback function and not cause updates if an observable accessed in the callback is changed', function () {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, beforeMove: callback }'><span data-bind='text: childprop'></span></div>";
        var callbackObservable = ko.observable(1),
            someItems = ko.observableArray([{ childprop: 'first child' }]),
            callbacks = 0;
        ko.applyBindings({ someItems: someItems, callback: function() { callbackObservable(); callbacks++; } }, testNode);
        someItems.splice(0, 0, { childprop: 'added child'});
        expect(callbacks).toEqual(1);

        // Change the array, but don't update the observableArray so that the foreach binding isn't updated
        someItems().push({ childprop: 'hidden child'});
        expect(testNode.childNodes[0]).toContainText('added childfirst child');
        // Update callback observable and check that the binding wasn't updated
        callbackObservable(2);
        expect(testNode.childNodes[0]).toContainText('added childfirst child');
        // Update the observableArray and verify that the binding is now updated
        someItems.valueHasMutated();
        expect(testNode.childNodes[0]).toContainText('added childfirst childhidden child');
    });

    it('Should not double-unwrap the given value', function() {
        // Previously an observable value was doubly-unwrapped: in the foreach handler and then in the template handler.
        // This is now fixed so that the value is unwrapped just in the template handler and only peeked at in the foreach handler.
        // See https://github.com/SteveSanderson/knockout/issues/523
        testNode.innerHTML = "<div data-bind='foreach: myArray'><span data-bind='text: $data'></span></div>";
        var myArrayWrapped = ko.observable(ko.observableArray(['data value']));
        ko.applyBindings({ myArray: myArrayWrapped }, testNode);
        // Because the unwrapped value isn't an array, nothing gets rendered.
        expect(testNode.childNodes[0]).toContainText('');
    });

    it('Should be able to nest foreaches and access binding contexts both during and after binding', function() {
        testNode.innerHTML = "<div data-bind='foreach: items'>"
                                + "<div data-bind='foreach: children'>"
                                    + "(Val: <span data-bind='text: $data'></span>, Parents: <span data-bind='text: $parents.length'></span>, Rootval: <span data-bind='text: $root.rootVal'></span>)"
                                + "</div>"
                           + "</div>";
        var viewModel = {
            rootVal: 'ROOTVAL',
            items: ko.observableArray([
                { children: ko.observableArray(['A1', 'A2', 'A3']) },
                { children: ko.observableArray(['B1', 'B2']) }
            ])
        };
        ko.applyBindings(viewModel, testNode);

        // Verify we can access binding contexts during binding
        expect(testNode.childNodes[0].childNodes[0]).toContainText("(Val: A1, Parents: 2, Rootval: ROOTVAL)(Val: A2, Parents: 2, Rootval: ROOTVAL)(Val: A3, Parents: 2, Rootval: ROOTVAL)");
        expect(testNode.childNodes[0].childNodes[1]).toContainText("(Val: B1, Parents: 2, Rootval: ROOTVAL)(Val: B2, Parents: 2, Rootval: ROOTVAL)");

        // Verify we can access them later
        var firstInnerTextNode = testNode.childNodes[0].childNodes[0].childNodes[1];
        expect(firstInnerTextNode.nodeType).toEqual(1); // The first span associated with A1
        expect(ko.dataFor(firstInnerTextNode)).toEqual("A1");
        expect(ko.contextFor(firstInnerTextNode).$parent.children()[2]).toEqual("A3");
        expect(ko.contextFor(firstInnerTextNode).$parents[1].items()[1].children()[1]).toEqual("B2");
        expect(ko.contextFor(firstInnerTextNode).$root.rootVal).toEqual("ROOTVAL");
    });

    it('Should be able to define a \'foreach\' region using a containerless template', function() {
        testNode.innerHTML = "hi <!-- ko foreach: someitems --><span data-bind='text: childprop'></span><!-- /ko -->";
        var someitems = [
            { childprop: 'first child' },
            { childprop: 'second child' }
        ];
        ko.applyBindings({ someitems: someitems }, testNode);
        expect(testNode).toContainHtml('hi <!-- ko foreach: someitems --><span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span><!-- /ko -->');

        // Check we can recover the binding contexts
        expect(ko.dataFor(testNode.childNodes[3]).childprop).toEqual("second child");
        expect(ko.contextFor(testNode.childNodes[3]).$parent.someitems.length).toEqual(2);
    });

    it('Should be able to nest \'foreach\' regions defined using containerless templates', function() {
        var innerContents = document.createElement("DIV");
        testNode.innerHTML = "";
        testNode.appendChild(document.createComment("ko foreach: items"));
        testNode.appendChild(document.createComment(    "ko foreach: children"));
        innerContents.innerHTML =                           "(Val: <span data-bind='text: $data'></span>, Parents: <span data-bind='text: $parents.length'></span>, Rootval: <span data-bind='text: $root.rootVal'></span>)";
        while (innerContents.firstChild)
            testNode.appendChild(innerContents.firstChild);
        testNode.appendChild(document.createComment(    "/ko"));
        testNode.appendChild(document.createComment("/ko"));

        var viewModel = {
            rootVal: 'ROOTVAL',
            items: ko.observableArray([
                { children: ko.observableArray(['A1', 'A2', 'A3']) },
                { children: ko.observableArray(['B1', 'B2']) }
            ])
        };
        ko.applyBindings(viewModel, testNode);

        // Verify we can access binding contexts during binding
        expect(testNode).toContainText("(Val: A1, Parents: 2, Rootval: ROOTVAL)(Val: A2, Parents: 2, Rootval: ROOTVAL)(Val: A3, Parents: 2, Rootval: ROOTVAL)(Val: B1, Parents: 2, Rootval: ROOTVAL)(Val: B2, Parents: 2, Rootval: ROOTVAL)");

        // Verify we can access them later
        var firstInnerSpan = testNode.childNodes[3];
        expect(firstInnerSpan).toContainText("A1"); // It is the first span bound in the context of A1
        expect(ko.dataFor(firstInnerSpan)).toEqual("A1");
        expect(ko.contextFor(firstInnerSpan).$parent.children()[2]).toEqual("A3");
        expect(ko.contextFor(firstInnerSpan).$parents[1].items()[1].children()[1]).toEqual("B2");
        expect(ko.contextFor(firstInnerSpan).$root.rootVal).toEqual("ROOTVAL");
    });

    it('Should be able to nest \'if\' inside \'foreach\' defined using containerless templates', function() {
        testNode.innerHTML = "<ul></ul>";
        testNode.childNodes[0].appendChild(document.createComment("ko foreach: items"));
        testNode.childNodes[0].appendChild(document.createElement("li"));
        testNode.childNodes[0].childNodes[1].innerHTML = "<span data-bind='text: childval.childprop'></span>";
        testNode.childNodes[0].childNodes[1].insertBefore(document.createComment("ko if: childval"), testNode.childNodes[0].childNodes[1].firstChild);
        testNode.childNodes[0].childNodes[1].appendChild(document.createComment("/ko"));
        testNode.childNodes[0].appendChild(document.createComment("/ko"));

        var viewModel = {
            items: [
                { childval: {childprop: 123 } },
                { childval: null },
                { childval: {childprop: 456 } }
            ]
        };
        ko.applyBindings(viewModel, testNode);

        expect(testNode).toContainHtml('<ul>'
                                                + '<!--ko foreach: items-->'
                                                   + '<li>'
                                                      + '<!--ko if: childval-->'
                                                         + '<span data-bind="text: childval.childprop">123</span>'
                                                      + '<!--/ko-->'
                                                   + '</li>'
                                                   + '<li>'
                                                      + '<!--ko if: childval-->'
                                                      + '<!--/ko-->'
                                                   + '</li>'
                                                   + '<li>'
                                                      + '<!--ko if: childval-->'
                                                         + '<span data-bind="text: childval.childprop">456</span>'
                                                      + '<!--/ko-->'
                                                   + '</li>'
                                                + '<!--/ko-->'
                                             + '</ul>');
    });

    it('Should be able to use containerless templates directly inside UL elements even when closing LI tags are omitted', function() {
        // Represents issue https://github.com/SteveSanderson/knockout/issues/155
        // Certain closing tags, including </li> are optional (http://www.w3.org/TR/html5/syntax.html#syntax-tag-omission)
        // Most browsers respect your positioning of closing </li> tags, but IE <= 7 doesn't, and treats your markup
        // as if it was written as below:

        // Your actual markup: "<ul><li>Header item</li><!-- ko foreach: someitems --><li data-bind='text: $data'></li><!-- /ko --></ul>";
        // How IE <= 8 treats it:
        testNode.innerHTML =   "<ul><li>Header item<!-- ko foreach: someitems --><li data-bind='text: $data'><!-- /ko --></ul>";
        var viewModel = {
            someitems: [ 'Alpha', 'Beta' ]
        };
        ko.applyBindings(viewModel, testNode);
        var match = testNode.innerHTML.toLowerCase().match(/<\/li>/g);
        // Any of the following results are acceptable.
        if (!match) {
            // Opera 11.5 doesn't add any closing </li> tags
            expect(testNode).toContainHtml('<ul><li>header item<!-- ko foreach: someitems --><li data-bind="text: $data">alpha<li data-bind="text: $data">beta<!-- /ko --></ul>');
        } else if (match.length == 3) {
            // Modern browsers implicitly re-add the closing </li> tags
            expect(testNode).toContainHtml('<ul><li>header item</li><!-- ko foreach: someitems --><li data-bind="text: $data">alpha</li><li data-bind="text: $data">beta</li><!-- /ko --></ul>');
        } else {
            // ... but IE < 8 doesn't add ones that immediately precede a <li>
            expect(testNode).toContainHtml('<ul><li>header item</li><!-- ko foreach: someitems --><li data-bind="text: $data">alpha<li data-bind="text: $data">beta</li><!-- /ko --></ul>');
        }
    });

    it('Should be able to nest containerless templates directly inside UL elements, even on IE < 8 with its bizarre HTML parsing/formatting', function() {
        // Represents https://github.com/SteveSanderson/knockout/issues/212
        // This test starts with the following DOM structure:
        //    <ul>
        //        <!-- ko foreach: ['A', 'B'] -->
        //        <!-- ko if: $data == 'B' -->
        //        <li data-bind='text: $data'>
        //            <!-- /ko -->
        //            <!-- /ko -->
        //        </li>
        //    </ul>
        // Note that:
        //   1. The closing comments are inside the <li> to simulate IE<8's weird parsing
        //   2. We have to build this with manual DOM operations, otherwise IE<8 will deform it in a different weird way
        // It would be a more authentic test if we could set up the scenario using .innerHTML and then let the browser do whatever parsing it does normally,
        // but unfortunately IE varies its weirdness according to whether it's really parsing an HTML doc, or whether you're using .innerHTML.

        testNode.innerHTML = "";
        testNode.appendChild(document.createElement("ul"));
        testNode.firstChild.appendChild(document.createComment("ko foreach: ['A', 'B']"));
        testNode.firstChild.appendChild(document.createComment("ko if: $data == 'B'"));
        testNode.firstChild.appendChild(document.createElement("li"));
        testNode.firstChild.lastChild.setAttribute("data-bind", "text: $data");
        testNode.firstChild.lastChild.appendChild(document.createComment("/ko"));
        testNode.firstChild.lastChild.appendChild(document.createComment("/ko"));

        ko.applyBindings(null, testNode);
        expect(testNode).toContainText("B");
    });

    it('Should be able to give an alias to $data using \"as\"', function() {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, as: \"item\" }'><span data-bind='text: item'></span></div>";
        var someItems = ['alpha', 'beta'];
        ko.applyBindings({ someItems: someItems }, testNode);
        expect(testNode.childNodes[0]).toContainHtml('<span data-bind="text: item">alpha</span><span data-bind="text: item">beta</span>');
    });

    it('Should be able to give an alias to $data using \"as\", and use it within a nested loop', function() {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, as: \"item\" }'>"
                           +    "<span data-bind='foreach: sub'>"
                           +        "<span data-bind='text: item.name+\":\"+$data'></span>,"
                           +    "</span>"
                           + "</div>";
        var someItems = [{ name: 'alpha', sub: ['a', 'b'] }, { name: 'beta', sub: ['c'] }];
        ko.applyBindings({ someItems: someItems }, testNode);
        expect(testNode.childNodes[0]).toContainText('alpha:a,alpha:b,beta:c,');
    });

    it('Should be able to set up multiple nested levels of aliases using \"as\"', function() {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, as: \"item\" }'>"
                           +    "<span data-bind='foreach: { data: sub, as: \"subvalue\" }'>"
                           +        "<span data-bind='text: item.name+\":\"+subvalue'></span>,"
                           +    "</span>"
                           + "</div>";
        var someItems = [{ name: 'alpha', sub: ['a', 'b'] }, { name: 'beta', sub: ['c','d'] }];
        ko.applyBindings({ someItems: someItems }, testNode);
        expect(testNode.childNodes[0]).toContainText('alpha:a,alpha:b,beta:c,beta:d,');
    });

    it('Should be able to give an alias to $data using \"as\", and use it within arbitrary descendant binding contexts', function() {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, as: \"item\" }'><span data-bind='if: item.length'><span data-bind='text: item'></span>,</span></div>";
        var someItems = ['alpha', 'beta'];
        ko.applyBindings({ someItems: someItems }, testNode);
        expect(testNode.childNodes[0]).toContainText('alpha,beta,');
    });

    it('Should be able to give an alias to $data using \"as\", and use it within descendant binding contexts defined using containerless syntax', function() {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, as: \"item\" }'>x<!-- ko if: item.length --><span data-bind='text: item'></span>x,<!-- /ko --></div>";
        var someItems = ['alpha', 'beta'];
        ko.applyBindings({ someItems: someItems }, testNode);
        expect(testNode.childNodes[0]).toContainText('xalphax,xbetax,');
    });

    it('Should be able to output HTML5 elements (even on IE<9, as long as you reference either innershiv.js or jQuery1.7+Modernizr)', function() {
        var isSupported = jasmine.ieVersion >= 9 || window.innerShiv || window.jQuery;
        if (isSupported) {
            // Represents https://github.com/SteveSanderson/knockout/issues/194
            ko.utils.setHtml(testNode, "<div data-bind='foreach:someitems'><section data-bind='text: $data'></section></div>");
            var viewModel = {
                someitems: [ 'Alpha', 'Beta' ]
            };
            ko.applyBindings(viewModel, testNode);
            expect(testNode).toContainHtml('<div data-bind="foreach:someitems"><section data-bind="text: $data">alpha</section><section data-bind="text: $data">beta</section></div>');
        }
    });

    it('Should be able to output HTML5 elements within container-less templates (same as above)', function() {
        var isSupported = jasmine.ieVersion >= 9 || window.innerShiv || window.jQuery;
        if (isSupported) {
            // Represents https://github.com/SteveSanderson/knockout/issues/194
            ko.utils.setHtml(testNode, "xxx<!-- ko foreach:someitems --><div><section data-bind='text: $data'></section></div><!-- /ko -->");
            var viewModel = {
                someitems: [ 'Alpha', 'Beta' ]
            };
            ko.applyBindings(viewModel, testNode);
            expect(testNode).toContainHtml('xxx<!-- ko foreach:someitems --><div><section data-bind="text: $data">alpha</section></div><div><section data-bind="text: $data">beta</section></div><!-- /ko -->');
        }
    });

    it('Should provide access to observable array items through $rawData', function() {
        testNode.innerHTML = "<div data-bind='foreach: someItems'><input data-bind='value: $rawData'/></div>";
        var x = ko.observable('first'), y = ko.observable('second'), someItems = ko.observableArray([ x, y ]);
        ko.applyBindings({ someItems: someItems }, testNode);
        expect(testNode.childNodes[0]).toHaveValues(['first', 'second']);

        // Should update observable when input is changed
        testNode.childNodes[0].childNodes[0].value = 'third';
        ko.utils.triggerEvent(testNode.childNodes[0].childNodes[0], "change");
        expect(x()).toEqual('third');

        // Should update the input when the observable changes
        y('fourth');
        expect(testNode.childNodes[0]).toHaveValues(['third', 'fourth']);

        // Should update the inputs when the array changes
        someItems([x]);
        expect(testNode.childNodes[0]).toHaveValues(['third']);
    });

    it('Should not re-render the nodes when a observable array item changes', function() {
        testNode.innerHTML = "<div data-bind='foreach: someItems'><span data-bind='text: $data'></span></div>";
        var x = ko.observable('first'), someItems = [ x ];
        ko.applyBindings({ someItems: someItems }, testNode);
        expect(testNode.childNodes[0]).toContainText('first');

        var saveNode = testNode.childNodes[0].childNodes[0];
        x('second');
        expect(testNode.childNodes[0]).toContainText('second');
        expect(testNode.childNodes[0].childNodes[0]).toEqual(saveNode);
    });

    it('Should not clean unrelated nodes when beforeRemove callback removes some nodes before others', function() {
        // In this scenario, a beforeRemove callback removes non-element nodes (such as text nodes)
        // immediately, but delays removing element nodes (for a fade effect, for example). See #1903.
        jasmine.Clock.useMock();
        testNode.innerHTML = "<div data-bind='foreach: {data: planets, beforeRemove: beforeRemove}'>--<span data-bind='text: name'></span>++</div>";
        var planets = ko.observableArray([
            { name: ko.observable('Mercury') },
            { name: ko.observable('Venus') },
            { name: ko.observable('Earth') },
            { name: ko.observable('Moon') },
            { name: ko.observable('Ceres') }
        ]), beforeRemove = function(elem) {
            if (elem.nodeType === 1) {
                setTimeout(function() {
                    ko.removeNode(elem);
                }, 1);
            } else {
                ko.removeNode(elem);
            }
        };
        ko.applyBindings({ planets: planets, beforeRemove, beforeRemove }, testNode);
        expect(testNode).toContainText('--Mercury++--Venus++--Earth++--Moon++--Ceres++');

        // Remove an item; the surrounding text nodes are removed immediately, but not the element node
        var deleted = planets.splice(3, 1);
        expect(testNode).toContainText('--Mercury++--Venus++--Earth++Moon--Ceres++');

        // Add some items; this causes the binding to update
        planets.push({ name: ko.observable('Jupiter') });
        planets.push({ name: ko.observable('Saturn') });
        expect(testNode).toContainText('--Mercury++--Venus++--Earth++Moon--Ceres++--Jupiter++--Saturn++');

        // Update the text of the item following the removed item; it should respond to updates normally
        planets()[3].name('Mars');
        expect(testNode).toContainText('--Mercury++--Venus++--Earth++Moon--Mars++--Jupiter++--Saturn++');

        // Update the text of the deleted item; it should not update the node
        deleted[0].name('Pluto');
        expect(testNode).toContainText('--Mercury++--Venus++--Earth++Moon--Mars++--Jupiter++--Saturn++');

        // After the delay, the deleted item's node is removed
        jasmine.Clock.tick(1);
        expect(testNode).toContainText('--Mercury++--Venus++--Earth++--Mars++--Jupiter++--Saturn++');

    });
});
