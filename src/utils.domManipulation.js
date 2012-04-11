(function () {
    var leadingCommentRegex = /^(\s*)<!--(.*?)-->/;

    ko.utils.parseHtmlFragment = ko.adapter.parseHtmlFragment;
    
    ko.utils.setHtml = function(node, html) {
        ko.utils.emptyDomNode(node);
        
        if ((html !== null) && (html !== undefined)) {
            if (typeof html != 'string')
                html = html.toString();
            
            ko.adapter.setHtml(node,html);
        }    	
    };
})();

ko.exportSymbol('utils.parseHtmlFragment', ko.utils.parseHtmlFragment);
ko.exportSymbol('utils.setHtml', ko.utils.setHtml);
