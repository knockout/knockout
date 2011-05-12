(function () {
    ko.utils.setHtml = function(node, html) {
        ko.utils.emptyDomNode(node);
        
        if ((html !== null) && (html !== undefined)) {
            if (typeof html != 'string')
                html = html.toString();
                
            var dummy = document.createElement("div");
            dummy.innerHTML = html;
            while (dummy.firstChild)
                node.appendChild(dummy.firstChild);
        }    	
    };
})();