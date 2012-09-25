describe('Binding: Foreach', {
    before_each: JSSpec.prepareTestNode,

    'Should remove descendant nodes from the document (and not bind them) if the value is falsey': function() {
        testNode.innerHTML = "<div data-bind='foreach: someItem'><span data-bind='text: someItem.nonExistentChildProp'></span></div>";
        value_of(testNode.childNodes[0].childNodes.length).should_be(1);
        ko.applyBindings({ someItem: null }, testNode);
        value_of(testNode.childNodes[0].childNodes.length).should_be(0);
    },

    'Should remove descendant nodes from the document (and not bind them) if the value is undefined': function() {
        testNode.innerHTML = "<div data-bind='foreach: someItem'><span data-bind='text: someItem.nonExistentChildProp'></span></div>";
        value_of(testNode.childNodes[0].childNodes.length).should_be(1);
        ko.applyBindings({ someItem: undefined }, testNode);
        value_of(testNode.childNodes[0].childNodes.length).should_be(0);
    },

    'Should duplicate descendant nodes for each value in the array value (and bind them in the context of that supplied value)': function() {
        testNode.innerHTML = "<div data-bind='foreach: someItems'><span data-bind='text: childProp'></span></div>";
        var someItems = [
            { childProp: 'first child' },
            { childProp: 'second child' }
        ];
        ko.applyBindings({ someItems: someItems }, testNode);
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span>');
    },

    'Should clean away any data values attached to the original template nodes before use': function() {
        // Represents issue https://github.com/SteveSanderson/knockout/pull/420
        testNode.innerHTML = "<div data-bind='foreach: [1, 2]'><span></span></div>";

        // Apply some DOM Data to the SPAN
        var span = testNode.childNodes[0].childNodes[0];
        value_of(span.tagName).should_be("SPAN");
        ko.utils.domData.set(span, "mydata", 123);

        // See that it vanishes because the SPAN is extracted as a template
        value_of(ko.utils.domData.get(span, "mydata")).should_be(123);
        ko.applyBindings(null, testNode);
        value_of(ko.utils.domData.get(span, "mydata")).should_be(undefined);

        // Also be sure the DOM Data doesn't appear in the output
        value_of(testNode.childNodes[0]).should_contain_html('<span></span><span></span>');
        value_of(ko.utils.domData.get(testNode.childNodes[0].childNodes[0], "mydata")).should_be(undefined);
        value_of(ko.utils.domData.get(testNode.childNodes[0].childNodes[1], "mydata")).should_be(undefined);
    },

    'Should be able to use $data to reference each array item being bound': function() {
        testNode.innerHTML = "<div data-bind='foreach: someItems'><span data-bind='text: $data'></span></div>";
        var someItems = ['alpha', 'beta'];
        ko.applyBindings({ someItems: someItems }, testNode);
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: $data">alpha</span><span data-bind="text: $data">beta</span>');
    },


    'Should add and remove nodes to match changes in the bound array': function() {
        testNode.innerHTML = "<div data-bind='foreach: someItems'><span data-bind='text: childProp'></span></div>";
        var someItems = ko.observableArray([
            { childProp: 'first child' },
            { childProp: 'second child' }
        ]);
        ko.applyBindings({ someItems: someItems }, testNode);
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span>');

        // Add items at the beginning...
        someItems.unshift({ childProp: 'zeroth child' });
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">zeroth child</span><span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span>');

        // ... middle
        someItems.splice(2, 0, { childProp: 'middle child' });
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">zeroth child</span><span data-bind="text: childprop">first child</span><span data-bind="text: childprop">middle child</span><span data-bind="text: childprop">second child</span>');

        // ... and end
        someItems.push({ childProp: 'last child' });
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">zeroth child</span><span data-bind="text: childprop">first child</span><span data-bind="text: childprop">middle child</span><span data-bind="text: childprop">second child</span><span data-bind="text: childprop">last child</span>');

        // Also remove from beginning...
        someItems.shift();
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">middle child</span><span data-bind="text: childprop">second child</span><span data-bind="text: childprop">last child</span>');

        // ... and middle
        someItems.splice(1, 1);
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span><span data-bind="text: childprop">last child</span>');

        // ... and end
        someItems.pop();
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span>');

        // Also, marking as "destroy" should eliminate the item from display
        someItems.destroy(someItems()[0]);
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">second child</span>');
    },

    'Should remove all nodes corresponding to a removed array item, even if they were generated via containerless templates': function() {
        // Represents issue https://github.com/SteveSanderson/knockout/issues/185
        testNode.innerHTML = "<div data-bind='foreach: someitems'>a<!-- ko if:true -->b<!-- /ko --></div>";
        var someitems = ko.observableArray([1,2]);
        ko.applyBindings({ someitems: someitems }, testNode);
        value_of(testNode).should_contain_html('<div data-bind="foreach: someitems">a<!-- ko if:true -->b<!-- /ko -->a<!-- ko if:true -->b<!-- /ko --></div>');

        // Now remove items, and check the corresponding child nodes vanished
        someitems.splice(1, 1);
        value_of(testNode).should_contain_html('<div data-bind="foreach: someitems">a<!-- ko if:true -->b<!-- /ko --></div>');
    },

    'Should remove all nodes corresponding to a removed array item, even if they were added via containerless syntax and there are no other nodes': function() {
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
        value_of(testNode).should_contain_text('x-aaabbb');

        // Now remove items, and check the corresponding child nodes vanished
        someitems.splice(1, 1);
        value_of(testNode).should_contain_text('x-aaa');
    },

    'Should update all nodes corresponding to a changed array item, even if they were generated via containerless templates': function() {
        testNode.innerHTML = "<div data-bind='foreach: someitems'><!-- ko if:true --><span data-bind='text: $data'></span><!-- /ko --></div>";
        var someitems = [ ko.observable('A'), ko.observable('B') ];
        ko.applyBindings({ someitems: someitems }, testNode);
        value_of(testNode).should_contain_text('AB');

        // Now update an item
        someitems[0]('A2');
        value_of(testNode).should_contain_text('A2B');
    },

    'Should be able to supply show "_destroy"ed items via includeDestroyed option': function() {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, includeDestroyed: true }'><span data-bind='text: childProp'></span></div>";
        var someItems = ko.observableArray([
            { childProp: 'first child' },
            { childProp: 'second child', _destroy: true }
        ]);
        ko.applyBindings({ someItems: someItems }, testNode);
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span>');
    },

    'Should be able to supply afterAdd and beforeRemove callbacks': function() {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, afterAdd: myAfterAdd, beforeRemove: myBeforeRemove }'><span data-bind='text: childprop'></span></div>";
        var someItems = ko.observableArray([{ childprop: 'first child' }]);
        var afterAddCallbackData = [], beforeRemoveCallbackData = [];
        ko.applyBindings({
            someItems: someItems,
            myAfterAdd: function(elem, index, value) { afterAddCallbackData.push({ elem: elem, index: index, value: value, currentParentClone: elem.parentNode.cloneNode(true) }) },
            myBeforeRemove: function(elem, index, value) { beforeRemoveCallbackData.push({ elem: elem, index: index, value: value, currentParentClone: elem.parentNode.cloneNode(true) }) }
        }, testNode);

        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">first child</span>');

        // Try adding
        someItems.push({ childprop: 'added child'});
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">added child</span>');
        value_of(afterAddCallbackData.length).should_be(1);
        value_of(afterAddCallbackData[0].elem).should_be(testNode.childNodes[0].childNodes[1]);
        value_of(afterAddCallbackData[0].index).should_be(1);
        value_of(afterAddCallbackData[0].value.childprop).should_be("added child");
        value_of(afterAddCallbackData[0].currentParentClone).should_contain_html('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">added child</span>');

        // Try removing
        someItems.shift();
        value_of(beforeRemoveCallbackData.length).should_be(1);
        value_of(beforeRemoveCallbackData[0].elem).should_contain_text("first child");
        value_of(beforeRemoveCallbackData[0].index).should_be(0);
        value_of(beforeRemoveCallbackData[0].value.childprop).should_be("first child");
        // Note that when using "beforeRemove", we *don't* remove the node from the doc - it's up to the beforeRemove callback to do it. So, check it's still there.
        value_of(beforeRemoveCallbackData[0].currentParentClone).should_contain_html('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">added child</span>');
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">added child</span>');
    },

    'Should call an afterRender callback function and not cause updates if an observable accessed in the callback is changed': function () {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, afterRender: callback }'><span data-bind='text: childprop'></span></div>";
        var callbackObservable = ko.observable(1),
            someItems = ko.observableArray([{ childprop: 'first child' }]),
            callbacks = 0;
        ko.applyBindings({ someItems: someItems, callback: function() { callbackObservable(); callbacks++; } }, testNode);
        value_of(callbacks).should_be(1);

        // Change the array, but don't update the observableArray so that the foreach binding isn't updated
        someItems().push({ childprop: 'hidden child'});
        value_of(testNode.childNodes[0]).should_contain_text('first child');
        // Update callback observable and check that the binding wasn't updated
        callbackObservable(2);
        value_of(testNode.childNodes[0]).should_contain_text('first child');
        // Update the observableArray and verify that the binding is now updated
        someItems.valueHasMutated();
        value_of(testNode.childNodes[0]).should_contain_text('first childhidden child');
    },

    'Should call an afterAdd callback function and not cause updates if an observable accessed in the callback is changed': function () {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, afterAdd: callback }'><span data-bind='text: childprop'></span></div>";
        var callbackObservable = ko.observable(1),
            someItems = ko.observableArray([]),
            callbacks = 0;
        ko.applyBindings({ someItems: someItems, callback: function() { callbackObservable(); callbacks++; } }, testNode);
        someItems.push({ childprop: 'added child'});
        value_of(callbacks).should_be(1);

        // Change the array, but don't update the observableArray so that the foreach binding isn't updated
        someItems().push({ childprop: 'hidden child'});
        value_of(testNode.childNodes[0]).should_contain_text('added child');
        // Update callback observable and check that the binding wasn't updated
        callbackObservable(2);
        value_of(testNode.childNodes[0]).should_contain_text('added child');
        // Update the observableArray and verify that the binding is now updated
        someItems.valueHasMutated();
        value_of(testNode.childNodes[0]).should_contain_text('added childhidden child');
    },

    'Should call an beforeRemove callback function and not cause updates if an observable accessed in the callback is changed': function () {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, beforeRemove: callback }'><span data-bind='text: childprop'></span></div>";
        var callbackObservable = ko.observable(1),
            someItems = ko.observableArray([{ childprop: 'first child' }, { childprop: 'second child' }]),
            callbacks = 0;
        ko.applyBindings({ someItems: someItems, callback: function(elem) { callbackObservable(); callbacks++; ko.removeNode(elem); } }, testNode);
        someItems.pop();
        value_of(callbacks).should_be(1);

        // Change the array, but don't update the observableArray so that the foreach binding isn't updated
        someItems().push({ childprop: 'hidden child'});
        value_of(testNode.childNodes[0]).should_contain_text('first child');
        // Update callback observable and check that the binding wasn't updated
        callbackObservable(2);
        value_of(testNode.childNodes[0]).should_contain_text('first child');
        // Update the observableArray and verify that the binding is now updated
        someItems.valueHasMutated();
        value_of(testNode.childNodes[0]).should_contain_text('first childhidden child');
    },

    'Should call an afterMove callback function and not cause updates if an observable accessed in the callback is changed': function () {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, afterMove: callback }'><span data-bind='text: childprop'></span></div>";
        var callbackObservable = ko.observable(1),
            someItems = ko.observableArray([{ childprop: 'first child' }]),
            callbacks = 0;
        ko.applyBindings({ someItems: someItems, callback: function() { callbackObservable(); callbacks++; } }, testNode);
        someItems.splice(0, 0, { childprop: 'added child'});
        value_of(callbacks).should_be(1);

        // Change the array, but don't update the observableArray so that the foreach binding isn't updated
        someItems().push({ childprop: 'hidden child'});
        value_of(testNode.childNodes[0]).should_contain_text('added childfirst child');
        // Update callback observable and check that the binding wasn't updated
        callbackObservable(2);
        value_of(testNode.childNodes[0]).should_contain_text('added childfirst child');
        // Update the observableArray and verify that the binding is now updated
        someItems.valueHasMutated();
        value_of(testNode.childNodes[0]).should_contain_text('added childfirst childhidden child');
    },

    'Should call an beforeMove callback function and not cause updates if an observable accessed in the callback is changed': function () {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, beforeMove: callback }'><span data-bind='text: childprop'></span></div>";
        var callbackObservable = ko.observable(1),
            someItems = ko.observableArray([{ childprop: 'first child' }]),
            callbacks = 0;
        ko.applyBindings({ someItems: someItems, callback: function() { callbackObservable(); callbacks++; } }, testNode);
        someItems.splice(0, 0, { childprop: 'added child'});
        value_of(callbacks).should_be(1);

        // Change the array, but don't update the observableArray so that the foreach binding isn't updated
        someItems().push({ childprop: 'hidden child'});
        value_of(testNode.childNodes[0]).should_contain_text('added childfirst child');
        // Update callback observable and check that the binding wasn't updated
        callbackObservable(2);
        value_of(testNode.childNodes[0]).should_contain_text('added childfirst child');
        // Update the observableArray and verify that the binding is now updated
        someItems.valueHasMutated();
        value_of(testNode.childNodes[0]).should_contain_text('added childfirst childhidden child');
    },

    'Should not double-unwrap the given value': function() {
        // Previously an observable value was doubly-unwrapped: in the foreach handler and then in the template handler.
        // This is now fixed so that the value is unwrapped just in the template handler and only peeked at in the foreach handler.
        // See https://github.com/SteveSanderson/knockout/issues/523
        testNode.innerHTML = "<div data-bind='foreach: myArray'><span data-bind='text: $data'></span></div>";
        var myArrayWrapped = ko.observable(ko.observableArray(['data value']));
        ko.applyBindings({ myArray: myArrayWrapped }, testNode);
        // Because the unwrapped value isn't an array, nothing gets rendered.
        value_of(testNode.childNodes[0]).should_contain_text('');
    },

    'Should be able to nest foreaches and access binding contexts both during and after binding': function() {
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
        value_of(testNode.childNodes[0].childNodes[0]).should_contain_text("(Val: A1, Parents: 2, Rootval: ROOTVAL)(Val: A2, Parents: 2, Rootval: ROOTVAL)(Val: A3, Parents: 2, Rootval: ROOTVAL)");
        value_of(testNode.childNodes[0].childNodes[1]).should_contain_text("(Val: B1, Parents: 2, Rootval: ROOTVAL)(Val: B2, Parents: 2, Rootval: ROOTVAL)");

        // Verify we can access them later
        var firstInnerTextNode = testNode.childNodes[0].childNodes[0].childNodes[1];
        value_of(firstInnerTextNode.nodeType).should_be(1); // The first span associated with A1
        value_of(ko.dataFor(firstInnerTextNode)).should_be("A1");
        value_of(ko.contextFor(firstInnerTextNode).$parent.children()[2]).should_be("A3");
        value_of(ko.contextFor(firstInnerTextNode).$parents[1].items()[1].children()[1]).should_be("B2");
        value_of(ko.contextFor(firstInnerTextNode).$root.rootVal).should_be("ROOTVAL");
    },

    'Should be able to define a \'foreach\' region using a containerless template': function() {
        testNode.innerHTML = "hi <!-- ko foreach: someitems --><span data-bind='text: childprop'></span><!-- /ko -->";
        var someitems = [
            { childprop: 'first child' },
            { childprop: 'second child' }
        ];
        ko.applyBindings({ someitems: someitems }, testNode);
        value_of(testNode).should_contain_html('hi <!-- ko foreach: someitems --><span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span><!-- /ko -->');

        // Check we can recover the binding contexts
        value_of(ko.dataFor(testNode.childNodes[3]).childprop).should_be("second child");
        value_of(ko.contextFor(testNode.childNodes[3]).$parent.someitems.length).should_be(2);
    },

    'Should be able to nest \'foreach\' regions defined using containerless templates' : function() {
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
        value_of(testNode).should_contain_text("(Val: A1, Parents: 2, Rootval: ROOTVAL)(Val: A2, Parents: 2, Rootval: ROOTVAL)(Val: A3, Parents: 2, Rootval: ROOTVAL)(Val: B1, Parents: 2, Rootval: ROOTVAL)(Val: B2, Parents: 2, Rootval: ROOTVAL)");

        // Verify we can access them later
        var firstInnerSpan = testNode.childNodes[3];
        value_of(firstInnerSpan).should_contain_text("A1"); // It is the first span bound in the context of A1
        value_of(ko.dataFor(firstInnerSpan)).should_be("A1");
        value_of(ko.contextFor(firstInnerSpan).$parent.children()[2]).should_be("A3");
        value_of(ko.contextFor(firstInnerSpan).$parents[1].items()[1].children()[1]).should_be("B2");
        value_of(ko.contextFor(firstInnerSpan).$root.rootVal).should_be("ROOTVAL");
    },

    'Should be able to nest \'if\' inside \'foreach\' defined using containerless templates' : function() {
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

        value_of(testNode).should_contain_html('<ul>'
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
    },

    'Should be able to use containerless templates directly inside UL elements even when closing LI tags are omitted' : function() {
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

        // Either of the following two results are acceptable.
        try {
            // Modern browsers implicitly re-add the closing </li> tags
            value_of(testNode).should_contain_html('<ul><li>header item</li><!-- ko foreach: someitems --><li data-bind="text: $data">alpha</li><li data-bind="text: $data">beta</li><!-- /ko --></ul>');
        } catch(ex) {
            // ... but IE < 8 doesn't add ones that immediately precede a <li>
            value_of(testNode).should_contain_html('<ul><li>header item</li><!-- ko foreach: someitems --><li data-bind="text: $data">alpha<li data-bind="text: $data">beta</li><!-- /ko --></ul>');
        }
    },

    'Should be able to nest containerless templates directly inside UL elements, even on IE < 8 with its bizarre HTML parsing/formatting' : function() {
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
        value_of(testNode).should_contain_text("B");
    },

    'Should be able to give an alias to $data using \"as\"': function() {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, as: \"item\" }'><span data-bind='text: item'></span></div>";
        var someItems = ['alpha', 'beta'];
        ko.applyBindings({ someItems: someItems }, testNode);
        value_of(testNode.childNodes[0]).should_contain_html('<span data-bind="text: item">alpha</span><span data-bind="text: item">beta</span>');
    },

    'Should be able to give an alias to $data using \"as\", and use it within a nested loop': function() {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, as: \"item\" }'>"
                           +    "<span data-bind='foreach: sub'>"
                           +        "<span data-bind='text: item.name+\":\"+$data'></span>,"
                           +    "</span>"
                           + "</div>";
        var someItems = [{ name: 'alpha', sub: ['a', 'b'] }, { name: 'beta', sub: ['c'] }];
        ko.applyBindings({ someItems: someItems }, testNode);
        value_of(testNode.childNodes[0]).should_contain_text('alpha:a,alpha:b,beta:c,');
    },

    'Should be able to set up multiple nested levels of aliases using \"as\"': function() {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, as: \"item\" }'>"
                           +    "<span data-bind='foreach: { data: sub, as: \"subvalue\" }'>"
                           +        "<span data-bind='text: item.name+\":\"+subvalue'></span>,"
                           +    "</span>"
                           + "</div>";
        var someItems = [{ name: 'alpha', sub: ['a', 'b'] }, { name: 'beta', sub: ['c','d'] }];
        ko.applyBindings({ someItems: someItems }, testNode);
        value_of(testNode.childNodes[0]).should_contain_text('alpha:a,alpha:b,beta:c,beta:d,');
    },

    'Should be able to give an alias to $data using \"as\", and use it within arbitrary descendant binding contexts': function() {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, as: \"item\" }'><span data-bind='if: item.length'><span data-bind='text: item'></span>,</span></div>";
        var someItems = ['alpha', 'beta'];
        ko.applyBindings({ someItems: someItems }, testNode);
        value_of(testNode.childNodes[0]).should_contain_text('alpha,beta,');
    },

    'Should be able to give an alias to $data using \"as\", and use it within descendant binding contexts defined using containerless syntax': function() {
        testNode.innerHTML = "<div data-bind='foreach: { data: someItems, as: \"item\" }'>x<!-- ko if: item.length --><span data-bind='text: item'></span>x,<!-- /ko --></div>";
        var someItems = ['alpha', 'beta'];
        ko.applyBindings({ someItems: someItems }, testNode);
        value_of(testNode.childNodes[0]).should_contain_text('xalphax,xbetax,');
    },

    'Should be able to output HTML5 elements (even on IE<9, as long as you reference either innershiv.js or jQuery1.7+Modernizr)': function() {
        // Represents https://github.com/SteveSanderson/knockout/issues/194
        ko.utils.setHtml(testNode, "<div data-bind='foreach:someitems'><section data-bind='text: $data'></section></div>");
        var viewModel = {
            someitems: [ 'Alpha', 'Beta' ]
        };
        ko.applyBindings(viewModel, testNode);
        value_of(testNode).should_contain_html('<div data-bind="foreach:someitems"><section data-bind="text: $data">alpha</section><section data-bind="text: $data">beta</section></div>');
    },

    'Should be able to output HTML5 elements within container-less templates (same as above)': function() {
        // Represents https://github.com/SteveSanderson/knockout/issues/194
        ko.utils.setHtml(testNode, "xxx<!-- ko foreach:someitems --><div><section data-bind='text: $data'></section></div><!-- /ko -->");
        var viewModel = {
            someitems: [ 'Alpha', 'Beta' ]
        };
        ko.applyBindings(viewModel, testNode);
        value_of(testNode).should_contain_html('xxx<!-- ko foreach:someitems --><div><section data-bind="text: $data">alpha</section></div><div><section data-bind="text: $data">beta</section></div><!-- /ko -->');
    }
});
