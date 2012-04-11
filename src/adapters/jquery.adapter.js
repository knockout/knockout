(function() {
    ko.adapter.parseHtmlFragment = function(html) {
        var elems = jQuery['clean']([html]);

        // As of jQuery 1.7.1, jQuery parses the HTML by appending it to some dummy parent nodes held in an in-memory document fragment.
        // Unfortunately, it never clears the dummy parent nodes from the document fragment, so it leaks memory over time.
        // Fix this by finding the top-most dummy parent element, and detaching it from its owner fragment.
        if (elems && elems[0]) {
            // Find the top-most parent element that's a direct child of a document fragment
            var elem = elems[0];
            while (elem.parentNode && elem.parentNode.nodeType !== 11 /* i.e., DocumentFragment */)
                elem = elem.parentNode;
            // ... then detach it
            if (elem.parentNode)
                elem.parentNode.removeChild(elem);
        }
        
        return elems;
    };

    ko.adapter.setHtml = function(node,html) {
        jQuery(node)['html'](html);
    };

    ko.exportSymbol("adapter.parseHtmlFragment",ko.adapter.parseHtmlFragment);
    ko.exportSymbol("adapter.setHtml",ko.adapter.setHtml);
})();
