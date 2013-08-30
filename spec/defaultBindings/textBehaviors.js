describe('Binding: Text', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should assign the value to the node, HTML-encoding the value', function () {
        var model = { textProp: "'Val <with> \"special\" <i>characters</i>'" };
        testNode.innerHTML = "<span data-bind='text:textProp'></span>";
        ko.applyBindings(model, testNode);
        expect(testNode.childNodes[0].textContent || testNode.childNodes[0].innerText).toEqual(model.textProp);
    });

    it('Should assign an empty string as value if the model value is null', function () {
        testNode.innerHTML = "<span data-bind='text:(null)' ></span>";
        ko.applyBindings(null, testNode);
        var actualText = "textContent" in testNode.childNodes[0] ? testNode.childNodes[0].textContent : testNode.childNodes[0].innerText;
        expect(actualText).toEqual("");
    });

    it('Should assign an empty string as value if the model value is undefined', function () {
        testNode.innerHTML = "<span data-bind='text:undefined' ></span>";
        ko.applyBindings(null, testNode);
        var actualText = "textContent" in testNode.childNodes[0] ? testNode.childNodes[0].textContent : testNode.childNodes[0].innerText;
        expect(actualText).toEqual("");
    });

    it('Should work with virtual elements, adding a text node between the comments', function () {
        var observable = ko.observable("Some text");
        testNode.innerHTML = "xxx <!-- ko text: textProp --><!-- /ko -->";
        ko.applyBindings({textProp: observable}, testNode);
        expect(testNode).toContainText("xxx Some text");
        expect(testNode).toContainHtml("xxx <!-- ko text: textprop -->some text<!-- /ko -->");

        // update observable; should update text
        observable("New text");
        expect(testNode).toContainText("xxx New text");
        expect(testNode).toContainHtml("xxx <!-- ko text: textprop -->new text<!-- /ko -->");

        // clear observable; should remove text
        observable(undefined);
        expect(testNode).toContainText("xxx ");
        expect(testNode).toContainHtml("xxx <!-- ko text: textprop --><!-- /ko -->");
    });

    it('Should work with virtual elements, removing any existing stuff between the comments', function () {
        testNode.innerHTML = "xxx <!--ko text: undefined-->some random thing<span> that won't be here later</span><!--/ko-->";
        ko.applyBindings(null, testNode);
        expect(testNode).toContainText("xxx ");
        expect(testNode).toContainHtml("xxx <!--ko text: undefined--><!--/ko-->");
    });

    it('Should not attempt data binding on the generated text node', function() {
        this.restoreAfter(ko.bindingProvider, 'instance');

        // Since custom binding providers can regard text nodes as bindable, it would be a
        // security risk to bind against user-supplied text (XSS).

        // First replace the binding provider with one that's hardcoded to replace all text
        // content with a special message, via a binding handler that operates on text nodes
        var originalBindingProvider = ko.bindingProvider.instance;
        ko.bindingProvider.instance = {
            nodeHasBindings: function(node, bindingContext) {
                return true;
            },
            getBindingAccessors: function(node, bindingContext) {
                if (node.nodeType === 3) {
                    return {
                        replaceTextNodeContent: function() { return "should not see this value in the output"; }
                    };
                } else {
                    return originalBindingProvider.getBindingAccessors(node, bindingContext);
                }
            }
        };
        ko.bindingHandlers.replaceTextNodeContent = {
            update: function(textNode, valueAccessor) { textNode.data = valueAccessor(); }
        };

        // Now check that, after applying the "text" binding, the emitted text node does *not*
        // get replaced by the special message.
        testNode.innerHTML = "<span data-bind='text: sometext'></span>";
        ko.applyBindings({ sometext: 'hello' }, testNode);
        expect("textContent" in testNode ? testNode.textContent : testNode.innerText).toEqual('hello');
    });
});