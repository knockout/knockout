describe('Binding: Text', {
    before_each: JSSpec.prepareTestNode,

    'Should assign the value to the node, HTML-encoding the value': function () {
        var model = { textProp: "'Val <with> \"special\" <i>characters</i>'" };
        testNode.innerHTML = "<span data-bind='text:textProp'></span>";
        ko.applyBindings(model, testNode);
        value_of(testNode.childNodes[0].textContent || testNode.childNodes[0].innerText).should_be(model.textProp);
    },

    'Should assign an empty string as value if the model value is null': function () {
        testNode.innerHTML = "<span data-bind='text:(null)' ></span>";
        ko.applyBindings(null, testNode);
        var actualText = "textContent" in testNode.childNodes[0] ? testNode.childNodes[0].textContent : testNode.childNodes[0].innerText;
        value_of(actualText).should_be("");
    },

    'Should assign an empty string as value if the model value is undefined': function () {
        testNode.innerHTML = "<span data-bind='text:undefined' ></span>";
        ko.applyBindings(null, testNode);
        var actualText = "textContent" in testNode.childNodes[0] ? testNode.childNodes[0].textContent : testNode.childNodes[0].innerText;
        value_of(actualText).should_be("");
    },

    'Should work with virtual elements, adding a text node between the comments': function () {
        var observable = ko.observable("Some text");
        testNode.innerHTML = "xxx <!-- ko text: textProp --><!-- /ko -->";
        ko.applyBindings({textProp: observable}, testNode);
        value_of(testNode).should_contain_text("xxx Some text");
        value_of(testNode).should_contain_html("xxx <!-- ko text: textprop -->some text<!-- /ko -->");

        // update observable; should update text
        observable("New text");
        value_of(testNode).should_contain_text("xxx New text");
        value_of(testNode).should_contain_html("xxx <!-- ko text: textprop -->new text<!-- /ko -->");

        // clear observable; should remove text
        observable(undefined);
        value_of(testNode).should_contain_text("xxx ");
        value_of(testNode).should_contain_html("xxx <!-- ko text: textprop --><!-- /ko -->");
    },

    'Should work with virtual elements, removing any existing stuff between the comments': function () {
        testNode.innerHTML = "xxx <!--ko text: undefined-->some random thing<span> that won't be here later</span><!--/ko-->";
        ko.applyBindings(null, testNode);
        value_of(testNode).should_contain_text("xxx ");
        value_of(testNode).should_contain_html("xxx <!--ko text: undefined--><!--/ko-->");
    }
});