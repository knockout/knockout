(function () {
    var leadingCommentRegex = /^(\s*)<!--(.*?)-->/;

    function simpleHtmlParse(html) {
        // Based on jQuery's "clean" function, but only accounting for table-related elements.
        // If you have referenced jQuery, this won't be used anyway - KO will use jQuery's "clean" function directly

        // Trim any leading whitespace/comment nodes, otherwise IE < 9 will discard them. We'll need to restore them after.
        html = html || "";
        var prefixNodes = [];
        while (html.match(leadingCommentRegex)) {
            html = html.replace(leadingCommentRegex, function() {
                var whitespace = arguments[1], comment = arguments[2];
                if (whitespace)
                    prefixNodes.push(document.createTextNode(whitespace));
                prefixNodes.push(document.createComment(comment));
                return "";
            });
        }
        
        // Trim whitespace, otherwise indexOf won't work as expected
        var tags = ko.utils.stringTrim(html).toLowerCase(), div = document.createElement("div");

        // Finds the first match from the left column, and returns the corresponding "wrap" data from the right column
        var wrap = tags.match(/^<(thead|tbody|tfoot)/)              && [1, "<table>", "</table>"] ||
                   !tags.indexOf("<tr")                             && [2, "<table><tbody>", "</tbody></table>"] ||
                   (!tags.indexOf("<td") || !tags.indexOf("<th"))   && [3, "<table><tbody><tr>", "</tr></tbody></table>"] ||
                   /* anything else */                                 [0, "", ""];

        // Go to html and back, then peel off extra wrappers
        div.innerHTML = wrap[1] + html + wrap[2];

        // Move to the right depth
        while (wrap[0]--)
            div = div.lastChild;

        return prefixNodes.concat(ko.utils.makeArray(div.childNodes));
    }
    
    ko.utils.parseHtmlFragment = function(html) {
        return typeof jQuery != 'undefined' ? jQuery['clean']([html]) // As below, benefit from jQuery's optimisations where possible
                                            : simpleHtmlParse(html);  // ... otherwise, this simple logic will do in most common cases.
    };
    
    ko.utils.setHtml = function(node, html) {
        ko.utils.emptyDomNode(node);
        
        if ((html !== null) && (html !== undefined)) {
            if (typeof html != 'string')
                html = html.toString();
            
            // jQuery contains a lot of sophisticated code to parse arbitrary HTML fragments,
            // for example <tr> elements which are not normally allowed to exist on their own.
            // If you've referenced jQuery we'll use that rather than duplicating its code.
            if (typeof jQuery != 'undefined') {
                jQuery(node)['html'](html);
            } else {
                // ... otherwise, use KO's own parsing logic.
                var parsedNodes = ko.utils.parseHtmlFragment(html);
                for (var i = 0; i < parsedNodes.length; i++)
                    node.appendChild(parsedNodes[i]);
            }            
        }    	
    };
})();

ko.exportSymbol('ko.utils.parseHtmlFragment', ko.utils.parseHtmlFragment);