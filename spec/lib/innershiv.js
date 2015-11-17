// http://bit.ly/ishiv | WTFPL License
window.innerShiv=function(){
	function h(c,e,b){
		return/^(?:area|br|col|embed|hr|img|input|link|meta|param)$/i.test(b)?c:e+"></"+b+">"
	}

	var c,
		e=document,
		j,
		g="abbr article aside audio canvas datalist details figcaption figure footer header hgroup mark meter nav output progress section summary time video".split(" ");

	var result = function(d,i){
		if(!c&&(c=e.createElement("div"),c.innerHTML="<nav></nav>",j=c.childNodes.length!==1)) {
			for(var b=e.createDocumentFragment(),f=g.length;f--;)
				b.createElement(g[f]);
			b.appendChild(c)
		}
		d=d.replace(/^\s\s*/,"").replace(/\s\s*$/,"").replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,"").replace(/(<([\w:]+)[^>]*?)\/>/g,h);
		c.innerHTML=(b=d.match(/^<(tbody|tr|td|col|colgroup|thead|tfoot)/i))?"<table>"+d+"</table>":d;
		b=b?c.getElementsByTagName(b[1])[0].parentNode:c;

		if(i===!1)
			return b.childNodes;
		for(var f=e.createDocumentFragment(),k=b.childNodes.length;k--;)
			f.appendChild(b.firstChild);
		return f
	}

	// Note that innerShiv is deprecated in favour of html5shiv. KO retains support for innerShiv for back-compat.
	//
	// innerShiv only works with KO custom elements if you've registered *all* your custom elements before
	// the first time innerShiv is invoked. This is because innerShiv caches the documentFragment it uses
	// for parsing. Since KO's tests need to register different components over time, this is a modified
	// version of innerShiv that supports a 'reset' method to clear its cache. You don't need this functionality
	// in production code.
	result.reset = function () { c = null; };

	return result;
}();
