
function parseMemoCommentHtml(commentHtml) {
    commentHtml = commentHtml.replace("<!--", "").replace("-->", "");
    return ko.memoization.parseMemoText(commentHtml);
}

describe('Memoization', {
    "Should only accept a function": function () {
        var threw = false;
        try { ko.memoization.memoize({}) }
        catch (ex) { threw = true; }
        value_of(threw).should_be(true);
    },

    "Should return an HTML comment": function () {
        var result = ko.memoization.memoize(function () { });
        value_of(typeof result).should_be("string");
        value_of(result.substring(0, 4)).should_be("<!--");
    },

    "Should call the function when unmemoizing": function () {
        var didCall = false;
        var memo = ko.memoization.memoize(function () { didCall = true });
        ko.memoization.unmemoize(parseMemoCommentHtml(memo));
        value_of(didCall).should_be(true);
    },

    "Should not be able to unmemoize more than once": function () {
        var memo = ko.memoization.memoize(function () { });
        ko.memoization.unmemoize(parseMemoCommentHtml(memo));

        var threw = false;
        try { ko.memoization.unmemoize(parseMemoCommentHtml(memo)) }
        catch (ex) { threw = true; }
        value_of(threw).should_be(true);
    },

    "Should be able to find memos in a DOM tree and unmemoize them, passing the memo node as a param": function () {
        var containerNode = document.createElement("DIV");
        var didCall = false;
        containerNode.innerHTML = "Hello " + ko.memoization.memoize(function (domNode) {
            value_of(domNode.parentNode).should_be(containerNode);
            didCall = true;
        });
        ko.memoization.unmemoizeDomNodeAndDescendants(containerNode);
        value_of(didCall).should_be(true);
    },

    "After unmemoizing a DOM tree, removes the memo nodes": function () {
        var containerNode = document.createElement("DIV");
        containerNode.innerHTML = "Hello " + ko.memoization.memoize(function () { });

        value_of(containerNode.childNodes.length).should_be(2);
        ko.memoization.unmemoizeDomNodeAndDescendants(containerNode);
        value_of(containerNode.childNodes.length).should_be(1);
    }
});