// Knockout JavaScript library v1.3.0rc
// (c) Steven Sanderson - http://knockoutjs.com/
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

(function(window,document,navigator,undefined){
function b(a){throw a;}var l=void 0,m=!0,o=null,p=!1,r,B;r="undefined"!==typeof exports?global:window;B=r.ko={};B.b=function(a,c){for(var d=a.split("."),e=r,f=0;f<d.length-1;f++)e=e[d[f]];e[d[d.length-1]]=c};B.l=function(a,c,d){a[c]=d};
B.a=new function(){function a(a,e){if("INPUT"!=a.tagName||!a.type)return p;if("click"!=e.toLowerCase())return p;var c=a.type.toLowerCase();return"checkbox"==c||"radio"==c}var c=/^(\s|\u00A0)+|(\s|\u00A0)+$/g,d={},e={};d[/Firefox\/2/i.test(navigator.userAgent)?"KeyboardEvent":"UIEvents"]=["keyup","keydown","keypress"];d.MouseEvents="click,dblclick,mousedown,mouseup,mousemove,mouseover,mouseout,mouseenter,mouseleave".split(",");for(var f in d){var h=d[f];if(h.length)for(var g=0,i=h.length;g<i;g++)e[h[g]]=
f}var j=function(){for(var a=3,e=document.createElement("div"),c=e.getElementsByTagName("i");e.innerHTML="<\!--[if gt IE "+ ++a+"]><i></i><![endif]--\>",c[0];);return 4<a?a:l}();return{Ca:["authenticity_token",/^__RequestVerificationToken(_.*)?$/],n:function(a,e){for(var c=0,f=a.length;c<f;c++)e(a[c])},k:function(a,e){if("function"==typeof Array.prototype.indexOf)return Array.prototype.indexOf.call(a,e);for(var c=0,f=a.length;c<f;c++)if(a[c]===e)return c;return-1},Wa:function(a,e,c){for(var f=0,d=
a.length;f<d;f++)if(e.call(c,a[f]))return a[f];return o},ca:function(a,e){var c=B.a.k(a,e);0<=c&&a.splice(c,1)},za:function(a){for(var a=a||[],e=[],c=0,f=a.length;c<f;c++)0>B.a.k(e,a[c])&&e.push(a[c]);return e},ba:function(a,e){for(var a=a||[],c=[],f=0,d=a.length;f<d;f++)c.push(e(a[f]));return c},aa:function(a,e){for(var a=a||[],c=[],f=0,d=a.length;f<d;f++)e(a[f])&&c.push(a[f]);return c},J:function(a,e){for(var c=0,f=e.length;c<f;c++)a.push(e[c]);return a},extend:function(a,e){for(var c in e)e.hasOwnProperty(c)&&
(a[c]=e[c]);return a},V:function(a){for(;a.firstChild;)B.removeNode(a.firstChild)},pa:function(a,e){B.a.V(a);e&&B.a.n(e,function(e){a.appendChild(e)})},Ka:function(a,e){var c=a.nodeType?[a]:a;if(0<c.length){for(var f=c[0],d=f.parentNode,h=0,g=e.length;h<g;h++)d.insertBefore(e[h],f);h=0;for(g=c.length;h<g;h++)B.removeNode(c[h])}},Ma:function(a,e){0<=navigator.userAgent.indexOf("MSIE 6")?a.setAttribute("selected",e):a.selected=e},w:function(a){return(a||"").replace(c,"")},Db:function(a,e){for(var c=
[],f=(a||"").split(e),d=0,h=f.length;d<h;d++){var g=B.a.w(f[d]);""!==g&&c.push(g)}return c},Cb:function(a,e){a=a||"";return e.length>a.length?p:a.substring(0,e.length)===e},hb:function(a){for(var e=Array.prototype.slice.call(arguments,1),c="return ("+a+")",f=0;f<e.length;f++)e[f]&&"object"==typeof e[f]&&(c="with(sc["+f+"]) { "+c+" } ");return(new Function("sc",c))(e)},fb:function(a,e){if(e.compareDocumentPosition)return 16==(e.compareDocumentPosition(a)&16);for(;a!=o;){if(a==e)return m;a=a.parentNode}return p},
ga:function(a){return B.a.fb(a,document)},s:function(e,c,f){if("undefined"!=typeof jQuery){if(a(e,c))var d=f,f=function(a,e){var c=this.checked;if(e)this.checked=e.Ya!==m;d.call(this,a);this.checked=c};jQuery(e).bind(c,f)}else"function"==typeof e.addEventListener?e.addEventListener(c,f,p):"undefined"!=typeof e.attachEvent?e.attachEvent("on"+c,function(a){f.call(e,a)}):b(Error("Browser doesn't support addEventListener or attachEvent"))},ta:function(c,f){(!c||!c.nodeType)&&b(Error("element must be a DOM node when calling triggerEvent"));
if("undefined"!=typeof jQuery){var d=[];a(c,f)&&d.push({Ya:c.checked});jQuery(c).trigger(f,d)}else if("function"==typeof document.createEvent)"function"==typeof c.dispatchEvent?(d=document.createEvent(e[f]||"HTMLEvents"),d.initEvent(f,m,m,window,0,0,0,0,0,p,p,p,p,0,c),c.dispatchEvent(d)):b(Error("The supplied element doesn't support dispatchEvent"));else if("undefined"!=typeof c.fireEvent){if("click"==f&&"INPUT"==c.tagName&&("checkbox"==c.type.toLowerCase()||"radio"==c.type.toLowerCase()))c.checked=
c.checked!==m;c.fireEvent("on"+f)}else b(Error("Browser doesn't support triggering events"))},d:function(a){return B.W(a)?a():a},eb:function(a,e){return 0<=B.a.k((a.className||"").split(/\s+/),e)},Qa:function(a,e,c){var f=B.a.eb(a,e);if(c&&!f)a.className=(a.className||"")+" "+e;else if(f&&!c){for(var c=(a.className||"").split(/\s+/),f="",d=0;d<c.length;d++)c[d]!=e&&(f+=c[d]+" ");a.className=B.a.w(f)}},outerHTML:function(a){if(j===l){var e=a.outerHTML;if("string"==typeof e)return e}e=window.document.createElement("div");
e.appendChild(a.cloneNode(m));return e.innerHTML},yb:function(a,e){for(var a=B.a.d(a),e=B.a.d(e),c=[],f=a;f<=e;f++)c.push(f);return c},ka:function(a){for(var e=[],c=0,f=a.length;c<f;c++)e.push(a[c]);return e},ob:6===j,pb:7===j,Da:function(a,e){for(var c=B.a.ka(a.getElementsByTagName("INPUT")).concat(B.a.ka(a.getElementsByTagName("TEXTAREA"))),f="string"==typeof e?function(a){return a.name===e}:function(a){return e.test(a.name)},d=[],h=c.length-1;0<=h;h--)f(c[h])&&d.push(c[h]);return d},vb:function(a){return"string"==
typeof a&&(a=B.a.w(a))?window.JSON&&window.JSON.parse?window.JSON.parse(a):(new Function("return "+a))():o},ra:function(a){("undefined"==typeof JSON||"undefined"==typeof JSON.stringify)&&b(Error("Cannot find JSON.stringify(). Some browsers (e.g., IE < 8) don't support it natively, but you can overcome this by adding a script reference to json2.js, downloadable from http://www.json.org/json2.js"));return JSON.stringify(B.a.d(a))},wb:function(a,e,c){var c=c||{},f=c.params||{},d=c.includeFields||this.Ca,
h=a;if("object"==typeof a&&"FORM"==a.tagName)for(var h=a.action,g=d.length-1;0<=g;g--)for(var j=B.a.Da(a,d[g]),i=j.length-1;0<=i;i--)f[j[i].name]=j[i].value;var e=B.a.d(e),u=document.createElement("FORM");u.style.display="none";u.action=h;u.method="post";for(var y in e)a=document.createElement("INPUT"),a.name=y,a.value=B.a.ra(B.a.d(e[y])),u.appendChild(a);for(y in f)a=document.createElement("INPUT"),a.name=y,a.value=f[y],u.appendChild(a);document.body.appendChild(u);c.submitter?c.submitter(u):u.submit();
setTimeout(function(){u.parentNode.removeChild(u)},0)}}};B.b("ko.utils",B.a);B.b("ko.utils.arrayForEach",B.a.n);B.b("ko.utils.arrayFirst",B.a.Wa);B.b("ko.utils.arrayFilter",B.a.aa);B.b("ko.utils.arrayGetDistinctValues",B.a.za);B.b("ko.utils.arrayIndexOf",B.a.k);B.b("ko.utils.arrayMap",B.a.ba);B.b("ko.utils.arrayPushAll",B.a.J);B.b("ko.utils.arrayRemoveItem",B.a.ca);B.b("ko.utils.extend",B.a.extend);B.b("ko.utils.fieldsIncludedWithJsonPost",B.a.Ca);B.b("ko.utils.getFormFields",B.a.Da);
B.b("ko.utils.postJson",B.a.wb);B.b("ko.utils.parseJson",B.a.vb);B.b("ko.utils.registerEventHandler",B.a.s);B.b("ko.utils.stringifyJson",B.a.ra);B.b("ko.utils.range",B.a.yb);B.b("ko.utils.toggleDomNodeCssClass",B.a.Qa);B.b("ko.utils.triggerEvent",B.a.ta);B.b("ko.utils.unwrapObservable",B.a.d);Function.prototype.bind||(Function.prototype.bind=function(a){var c=this,d=Array.prototype.slice.call(arguments),a=d.shift();return function(){return c.apply(a,d.concat(Array.prototype.slice.call(arguments)))}});
B.a.e=new function(){var a=0,c="__ko__"+(new Date).getTime(),d={};return{get:function(a,c){var d=B.a.e.getAll(a,p);return d===l?l:d[c]},set:function(a,c,d){d===l&&B.a.e.getAll(a,p)===l||(B.a.e.getAll(a,m)[c]=d)},getAll:function(e,f){var h=e[c];if(!(h&&"null"!==h)){if(!f)return;h=e[c]="ko"+a++;d[h]={}}return d[h]},clear:function(a){var f=a[c];f&&(delete d[f],a[c]=o)}}};B.b("ko.utils.domData",B.a.e);B.b("ko.utils.domData.clear",B.a.e.clear);
B.a.z=new function(){function a(a,c){var h=B.a.e.get(a,d);h===l&&c&&(h=[],B.a.e.set(a,d,h));return h}function c(e){var c=a(e,p);if(c)for(var c=c.slice(0),d=0;d<c.length;d++)c[d](e);B.a.e.clear(e);"function"==typeof jQuery&&"function"==typeof jQuery.cleanData&&jQuery.cleanData([e])}var d="__ko_domNodeDisposal__"+(new Date).getTime();return{wa:function(e,c){"function"!=typeof c&&b(Error("Callback must be a function"));a(e,m).push(c)},Ja:function(e,c){var h=a(e,p);h&&(B.a.ca(h,c),0==h.length&&B.a.e.set(e,
d,l))},F:function(a){if(!(1!=a.nodeType&&9!=a.nodeType)){c(a);var f=[];B.a.J(f,a.getElementsByTagName("*"));for(var a=0,d=f.length;a<d;a++)c(f[a])}},removeNode:function(a){B.F(a);a.parentNode&&a.parentNode.removeChild(a)}}};B.F=B.a.z.F;B.removeNode=B.a.z.removeNode;B.b("ko.cleanNode",B.F);B.b("ko.removeNode",B.removeNode);B.b("ko.utils.domNodeDisposal",B.a.z);B.b("ko.utils.domNodeDisposal.addDisposeCallback",B.a.z.wa);B.b("ko.utils.domNodeDisposal.removeDisposeCallback",B.a.z.Ja);
B.a.na=function(a){var c;if("undefined"!=typeof jQuery)c=jQuery.clean([a]);else{var d=B.a.w(a).toLowerCase();c=document.createElement("div");d=d.match(/^<(thead|tbody|tfoot)/)&&[1,"<table>","</table>"]||!d.indexOf("<tr")&&[2,"<table><tbody>","</tbody></table>"]||(!d.indexOf("<td")||!d.indexOf("<th"))&&[3,"<table><tbody><tr>","</tr></tbody></table>"]||[0,"",""];a="ignored<div>"+d[1]+a+d[2]+"</div>";for("function"==typeof window.innerShiv?c.appendChild(window.innerShiv(a)):c.innerHTML=a;d[0]--;)c=c.lastChild;
c=B.a.ka(c.lastChild.childNodes)}return c};B.a.Z=function(a,c){B.a.V(a);if(c!==o&&c!==l)if("string"!=typeof c&&(c=c.toString()),"undefined"!=typeof jQuery)jQuery(a).html(c);else for(var d=B.a.na(c),e=0;e<d.length;e++)a.appendChild(d[e])};B.b("ko.utils.parseHtmlFragment",B.a.na);B.b("ko.utils.setHtml",B.a.Z);
B.r=function(){function a(){return(4294967296*(1+Math.random())|0).toString(16).substring(1)}function c(a,f){if(a)if(8==a.nodeType){var d=B.r.Ha(a.nodeValue);d!=o&&f.push({cb:a,tb:d})}else if(1==a.nodeType)for(var d=0,g=a.childNodes,i=g.length;d<i;d++)c(g[d],f)}var d={};return{la:function(e){"function"!=typeof e&&b(Error("You can only pass a function to ko.memoization.memoize()"));var c=a()+a();d[c]=e;return"<\!--[ko_memo:"+c+"]--\>"},Ra:function(a,c){var h=d[a];h===l&&b(Error("Couldn't find any memo with ID "+
a+". Perhaps it's already been unmemoized."));try{return h.apply(o,c||[]),m}finally{delete d[a]}},Sa:function(a,f){var d=[];c(a,d);for(var g=0,i=d.length;g<i;g++){var j=d[g].cb,k=[j];f&&B.a.J(k,f);B.r.Ra(d[g].tb,k);j.nodeValue="";j.parentNode&&j.parentNode.removeChild(j)}},Ha:function(a){return(a=a.match(/^\[ko_memo\:(.*?)\]$/))?a[1]:o}}}();B.b("ko.memoization",B.r);B.b("ko.memoization.memoize",B.r.la);B.b("ko.memoization.unmemoize",B.r.Ra);B.b("ko.memoization.parseMemoText",B.r.Ha);
B.b("ko.memoization.unmemoizeDomNodeAndDescendants",B.r.Sa);B.Ba={throttle:function(a,c){a.throttleEvaluation=c;var d=o;return B.i({read:a,write:function(e){clearTimeout(d);d=setTimeout(function(){a(e)},c)}})}};B.b("ko.extenders",B.Ba);B.Oa=function(a,c){this.da=a;this.bb=c;B.l(this,"dispose",this.v)};B.Oa.prototype.v=function(){this.nb=m;this.bb()};
B.S=function(){this.u={};B.a.extend(this,B.S.fn);B.l(this,"subscribe",this.sa);B.l(this,"extend",this.extend);B.l(this,"notifySubscribers",this.N);B.l(this,"getSubscriptionsCount",this.kb)};
B.S.fn={sa:function(a,c,d){var d=d||"change",a=c?a.bind(c):a,e=new B.Oa(a,function(){B.a.ca(this.u[d],e)}.bind(this));this.u[d]||(this.u[d]=[]);this.u[d].push(e);return e},N:function(a,c){c=c||"change";this.u[c]&&B.a.n(this.u[c].slice(0),function(c){c&&c.nb!==m&&c.da(a)})},kb:function(){var a=0,c;for(c in this.u)this.u.hasOwnProperty(c)&&(a+=this.u[c].length);return a},extend:function(a){var c=this;if(a)for(var d in a){var e=B.Ba[d];"function"==typeof e&&(c=e(c,a[d]))}return c}};
B.Fa=function(a){return"function"==typeof a.sa&&"function"==typeof a.N};B.b("ko.subscribable",B.S);B.b("ko.isSubscribable",B.Fa);B.U=function(){var a=[];return{Xa:function(c){a.push({da:c,Aa:[]})},end:function(){a.pop()},Ia:function(c){B.Fa(c)||b("Only subscribable things can act as dependencies");if(0<a.length){var d=a[a.length-1];0<=B.a.k(d.Aa,c)||(d.Aa.push(c),d.da(c))}}}}();var C={undefined:m,"boolean":m,number:m,string:m};
B.A=function(a){function c(){if(0<arguments.length){if(!c.equalityComparer||!c.equalityComparer(d,arguments[0]))c.H(),d=arguments[0],c.G();return this}B.U.Ia(c);return d}var d=a;B.S.call(c);c.G=function(){c.N(d)};c.H=function(){c.N(d,"beforeChange")};B.a.extend(c,B.A.fn);B.l(c,"valueHasMutated",c.G);B.l(c,"valueWillMutate",c.H);return c};B.A.fn={B:B.A,equalityComparer:function(a,c){return a===o||typeof a in C?a===c:p}};B.W=function(a){return a===o||a===l||a.B===l?p:a.B===B.A?m:B.W(a.B)};
B.Q=function(a){return"function"==typeof a&&a.B===B.A?m:"function"==typeof a&&a.B===B.i&&a.lb?m:p};B.b("ko.observable",B.A);B.b("ko.isObservable",B.W);B.b("ko.isWriteableObservable",B.Q);
B.R=function(a){0==arguments.length&&(a=[]);a!==o&&a!==l&&!("length"in a)&&b(Error("The argument passed when initializing an observable array must be an array, or null, or undefined."));var c=new B.A(a);B.a.extend(c,B.R.fn);B.l(c,"remove",c.remove);B.l(c,"removeAll",c.zb);B.l(c,"destroy",c.fa);B.l(c,"destroyAll",c.ab);B.l(c,"indexOf",c.indexOf);B.l(c,"replace",c.replace);return c};
B.R.fn={remove:function(a){for(var c=this(),d=[],e="function"==typeof a?a:function(c){return c===a},f=0;f<c.length;f++){var h=c[f];e(h)&&(0===d.length&&this.H(),d.push(h),c.splice(f,1),f--)}d.length&&this.G();return d},zb:function(a){if(a===l){var c=this(),d=c.slice(0);this.H();c.splice(0,c.length);this.G();return d}return!a?[]:this.remove(function(c){return 0<=B.a.k(a,c)})},fa:function(a){var c=this(),d="function"==typeof a?a:function(c){return c===a};this.H();for(var e=c.length-1;0<=e;e--)d(c[e])&&
(c[e]._destroy=m);this.G()},ab:function(a){return a===l?this.fa(function(){return m}):!a?[]:this.fa(function(c){return 0<=B.a.k(a,c)})},indexOf:function(a){var c=this();return B.a.k(c,a)},replace:function(a,c){var d=this.indexOf(a);0<=d&&(this.H(),this()[d]=c,this.G())}};B.a.n("pop,push,reverse,shift,sort,splice,unshift".split(","),function(a){B.R.fn[a]=function(){var c=this();this.H();c=c[a].apply(c,arguments);this.G();return c}});
B.a.n(["slice"],function(a){B.R.fn[a]=function(){var c=this();return c[a].apply(c,arguments)}});B.b("ko.observableArray",B.R);function D(a,c){a&&"object"==typeof a?c=a:(c=c||{},c.read=a||c.read);"function"!=typeof c.read&&b("Pass a function that returns the value of the dependentObservable");return c}
B.i=function(a,c,d){function e(){B.a.n(q,function(a){a.v()});q=[]}function f(){var a=g.throttleEvaluation;a&&0<=a?(clearTimeout(v),v=setTimeout(h,a)):h()}function h(){if(j&&"function"==typeof d.disposeWhen&&d.disposeWhen())g.v();else{try{e();B.U.Xa(function(a){q.push(a.sa(f))});var a=d.read.call(d.owner||c);g.N(i,"beforeChange");i=a}finally{B.U.end()}g.N(i);j=m}}function g(){if(0<arguments.length)"function"===typeof d.write?d.write.apply(d.owner||c,arguments):b("Cannot write a value to a dependentObservable unless you specify a 'write' option. If you wish to read the current value, don't pass any parameters.");
else return j||h(),B.U.Ia(g),i}var i,j=p,d=D(a,d),k="object"==typeof d.disposeWhenNodeIsRemoved?d.disposeWhenNodeIsRemoved:o,n=o;if(k){n=function(){g.v()};B.a.z.wa(k,n);var t=d.disposeWhen;d.disposeWhen=function(){return!B.a.ga(k)||"function"==typeof t&&t()}}var q=[],v=o;g.jb=function(){return q.length};g.lb="function"===typeof d.write;g.v=function(){k&&B.a.z.Ja(k,n);e()};B.S.call(g);B.a.extend(g,B.i.fn);d.deferEvaluation!==m&&h();B.l(g,"dispose",g.v);B.l(g,"getDependenciesCount",g.jb);return g};
B.i.fn={B:B.i};B.i.B=B.A;B.b("ko.dependentObservable",B.i);B.b("ko.computed",B.i);
(function(){function a(e,f,h){h=h||new d;e=f(e);if(!("object"==typeof e&&e!==o&&e!==l&&!(e instanceof Date)))return e;var g=e instanceof Array?[]:{};h.save(e,g);c(e,function(c){var d=f(e[c]);switch(typeof d){case "boolean":case "number":case "string":case "function":g[c]=d;break;case "object":case "undefined":var k=h.get(d);g[c]=k!==l?k:a(d,f,h)}});return g}function c(a,c){if(a instanceof Array)for(var d=0;d<a.length;d++)c(d);else for(d in a)c(d)}function d(){var a=[],c=[];this.save=function(d,g){var i=
B.a.k(a,d);0<=i?c[i]=g:(a.push(d),c.push(g))};this.get=function(d){d=B.a.k(a,d);return 0<=d?c[d]:l}}B.Pa=function(c){0==arguments.length&&b(Error("When calling ko.toJS, pass the object you want to convert."));return a(c,function(a){for(var c=0;B.W(a)&&10>c;c++)a=a();return a})};B.toJSON=function(a){a=B.Pa(a);return B.a.ra(a)}})();B.b("ko.toJS",B.Pa);B.b("ko.toJSON",B.toJSON);
B.h={q:function(a){return"OPTION"==a.tagName?a.__ko__hasDomDataOptionValue__===m?B.a.e.get(a,B.c.options.ma):a.getAttribute("value"):"SELECT"==a.tagName?0<=a.selectedIndex?B.h.q(a.options[a.selectedIndex]):l:a.value},T:function(a,c){if("OPTION"==a.tagName)switch(typeof c){case "string":case "number":B.a.e.set(a,B.c.options.ma,l);"__ko__hasDomDataOptionValue__"in a&&delete a.__ko__hasDomDataOptionValue__;a.value=c;break;default:B.a.e.set(a,B.c.options.ma,c),a.__ko__hasDomDataOptionValue__=m,a.value=
""}else if("SELECT"==a.tagName)for(var d=a.options.length-1;0<=d;d--){if(B.h.q(a.options[d])==c){a.selectedIndex=d;break}}else{if(c===o||c===l)c="";a.value=c}}};B.b("ko.selectExtensions",B.h);B.b("ko.selectExtensions.readValue",B.h.q);B.b("ko.selectExtensions.writeValue",B.h.T);
B.j=function(){function a(a,e){for(var d=o;a!=d;)d=a,a=a.replace(c,function(a,c){return e[c]});return a}var c=/\@ko_token_(\d+)\@/g,d=/^[\_$a-z][\_$a-z0-9]*(\[.*?\])*(\.[\_$a-z][\_$a-z0-9]*(\[.*?\])*)*$/i,e=["true","false"];return{D:[],Y:function(c){var e=B.a.w(c);if(3>e.length)return[];"{"===e.charAt(0)&&(e=e.substring(1,e.length-1));for(var c=[],d=o,i,j=0;j<e.length;j++){var k=e.charAt(j);if(d===o)switch(k){case '"':case "'":case "/":d=j,i=k}else if(k==i&&"\\"!==e.charAt(j-1)){k=e.substring(d,j+
1);c.push(k);var n="@ko_token_"+(c.length-1)+"@",e=e.substring(0,d)+n+e.substring(j+1),j=j-(k.length-n.length),d=o}}i=d=o;for(var t=0,q=o,j=0;j<e.length;j++){k=e.charAt(j);if(d===o)switch(k){case "{":d=j;q=k;i="}";break;case "(":d=j;q=k;i=")";break;case "[":d=j,q=k,i="]"}k===q?t++:k===i&&(t--,0===t&&(k=e.substring(d,j+1),c.push(k),n="@ko_token_"+(c.length-1)+"@",e=e.substring(0,d)+n+e.substring(j+1),j-=k.length-n.length,d=o))}i=[];e=e.split(",");d=0;for(j=e.length;d<j;d++)t=e[d],q=t.indexOf(":"),
0<q&&q<t.length-1?(k=t.substring(q+1),i.push({key:a(t.substring(0,q),c),value:a(k,c)})):i.push({unknown:a(t,c)});return i},ia:function(a){for(var c="string"===typeof a?B.j.Y(a):a,g=[],a=[],i,j=0;i=c[j];j++)if(0<g.length&&g.push(","),i.key){var k;a:{k=i.key;var n=B.a.w(k);switch(n.length&&n.charAt(0)){case "'":case '"':break a;default:k="'"+n+"'"}}i=i.value;g.push(k);g.push(":");g.push(i);n=B.a.w(i);if(0<=B.a.k(e,B.a.w(n).toLowerCase())?0:n.match(d)!==o)0<a.length&&a.push(", "),a.push(k+" : function(__ko_value) { "+
i+" = __ko_value; }")}else i.unknown&&g.push(i.unknown);c=g.join("");0<a.length&&(c=c+", '_ko_property_writers' : { "+a.join("")+" } ");return c},rb:function(a,c){for(var e=0;e<a.length;e++)if(B.a.w(a[e].key)==c)return m;return p}}}();B.b("ko.jsonExpressionRewriting",B.j);B.b("ko.jsonExpressionRewriting.bindingRewriteValidators",B.j.D);B.b("ko.jsonExpressionRewriting.parseObjectLiteral",B.j.Y);B.b("ko.jsonExpressionRewriting.insertPropertyAccessorsIntoJson",B.j.ia);
(function(){function a(a){return 8==a.nodeType&&(f?a.text:a.nodeValue).match(h)}function c(a){return 8==a.nodeType&&(f?a.text:a.nodeValue).match(g)}function d(e,d){for(var f=e,g=1,h=[];f=f.nextSibling;){if(c(f)&&(g--,0===g))return h;h.push(f);a(f)&&g++}d||b(Error("Cannot find closing comment tag to match: "+e.nodeValue));return o}function e(a,c){var e=d(a,c);return e?0<e.length?e[e.length-1].nextSibling:a.nextSibling:o}var f="<\!--test--\>"===document.createComment("test").text,h=f?/^<\!--\s*ko\s+(.*\:.*)\s*--\>$/:
/^\s*ko\s+(.*\:.*)\s*$/,g=f?/^<\!--\s*\/ko\s*--\>$/:/^\s*\/ko\s*$/,i={ul:m,ol:m};B.f={C:{},childNodes:function(c){return a(c)?d(c):c.childNodes},ha:function(c){if(a(c))for(var c=B.f.childNodes(c),e=0,d=c.length;e<d;e++)B.removeNode(c[e]);else B.a.V(c)},pa:function(c,e){if(a(c)){B.f.ha(c);for(var d=c.nextSibling,f=0,g=e.length;f<g;f++)d.parentNode.insertBefore(e[f],d)}else B.a.pa(c,e)},xb:function(c,e){a(c)?c.parentNode.insertBefore(e,c.nextSibling):c.firstChild?c.insertBefore(e,c.firstChild):c.appendChild(e)},
mb:function(c,e,d){a(c)?c.parentNode.insertBefore(e,d.nextSibling):d.nextSibling?c.insertBefore(e,d.nextSibling):c.appendChild(e)},nextSibling:function(d){return a(d)?e(d).nextSibling:d.nextSibling&&c(d.nextSibling)?l:d.nextSibling},ua:function(c){return(c=a(c))?c[1]:o},ib:function(a){if(B.f.ua(a)){var c;c=B.f.childNodes(a);for(var e=[],d=0,f=c.length;d<f;d++)B.a.z.F(c[d]),e.push(B.a.outerHTML(c[d]));c=String.prototype.concat.apply("",e);B.f.ha(a);(new B.m.I(a)).text(c)}},Ga:function(d){if(i[d.tagName.toLowerCase()]){var f=
d.firstChild;if(f){do if(1===f.nodeType){var g;g=f.firstChild;var h=o;if(g){do if(h)h.push(g);else if(a(g)){var q=e(g,m);q?g=q:h=[g]}else c(g)&&(h=[g]);while(g=g.nextSibling)}if(g=h){h=f.nextSibling;for(q=0;q<g.length;q++)h?d.insertBefore(g[q],h):d.appendChild(g[q])}}while(f=f.nextSibling)}}}}})();B.L=function(){};
B.a.extend(B.L.prototype,{nodeHasBindings:function(a){switch(a.nodeType){case 1:return a.getAttribute("data-bind")!=o;case 8:return B.f.ua(a)!=o;default:return p}},getBindings:function(a,c){var d=this.getBindingsString(a,c);return d?this.parseBindingsString(d,c):o},getBindingsString:function(a){switch(a.nodeType){case 1:return a.getAttribute("data-bind");case 8:return B.f.ua(a);default:return o}},parseBindingsString:function(a,c){try{var d=c.$data,e=" { "+B.j.ia(a)+" } ";return B.a.hb(e,d===o?window:
d,c)}catch(f){b(Error("Unable to parse bindings.\nMessage: "+f+";\nBindings value: "+a))}}});B.L.instance=new B.L;B.b("ko.bindingProvider",B.L);
(function(){function a(a,d){for(var h,g=d.childNodes[0];h=g;)g=B.f.nextSibling(h),c(a,h,p)}function c(c,f,h){var g=m,i=1==f.nodeType;i&&B.f.Ga(f);if(i&&h||B.L.instance.nodeHasBindings(f))g=d(f,o,c,h).Bb;i&&g&&a(c,f)}function d(a,c,d,g){function i(a){return function(){return n[a]}}function j(){return n}var k=0;B.f.ib(a);var n,t;new B.i(function(){var q=d&&d instanceof B.K?d:new B.K(B.a.d(d)),v=q.$data;g&&B.Na(a,q);if(n=("function"==typeof c?c():c)||B.L.instance.getBindings(a,q)){if(0===k){k=1;for(var s in n){var w=
B.c[s];w&&8===a.nodeType&&!B.f.C[s]&&b(Error("The binding '"+s+"' cannot be used with virtual elements"));if(w&&"function"==typeof w.init&&(w=(0,w.init)(a,i(s),j,v,q))&&w.controlsDescendantBindings)t!==l&&b(Error("Multiple bindings ("+t+" and "+s+") are trying to control descendant bindings of the same element. You cannot use these bindings together on the same element.")),t=s}k=2}if(2===k)for(s in n)(w=B.c[s])&&"function"==typeof w.update&&(0,w.update)(a,i(s),j,v,q)}},o,{disposeWhenNodeIsRemoved:a});
return{Bb:t===l}}B.c={};B.K=function(a,c){this.$data=a;c?(this.$parent=c.$data,this.$parents=(c.$parents||[]).slice(0),this.$parents.unshift(this.$parent),this.$root=c.$root):(this.$parents=[],this.$root=a)};B.K.prototype.createChildContext=function(a){return new B.K(a,this)};B.Na=function(a,c){if(2==arguments.length)B.a.e.set(a,"__ko_bindingContext__",c);else return B.a.e.get(a,"__ko_bindingContext__")};B.ya=function(a,c,h){1===a.nodeType&&B.f.Ga(a);return d(a,c,h,m)};B.Ta=function(c,d){1===d.nodeType&&
a(c,d)};B.xa=function(a,d){d&&1!==d.nodeType&&8!==d.nodeType&&b(Error("ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node"));d=d||window.document.body;c(a,d,m)};B.ea=function(a){switch(a.nodeType){case 1:case 8:var c=B.Na(a);if(c)return c;if(a.parentNode)return B.ea(a.parentNode)}};B.$a=function(a){return(a=B.ea(a))?a.$data:l};B.b("ko.bindingHandlers",B.c);B.b("ko.applyBindings",B.xa);B.b("ko.applyBindingsToDescendants",B.Ta);B.b("ko.applyBindingsToNode",
B.ya);B.b("ko.contextFor",B.ea);B.b("ko.dataFor",B.$a)})();B.a.n(["click"],function(a){B.c[a]={init:function(c,d,e,f){return B.c.event.init.call(this,c,function(){var c={};c[a]=d();return c},e,f)}}});
B.c.event={init:function(a,c,d,e){var f=c()||{},h;for(h in f)(function(){var f=h;"string"==typeof f&&B.a.s(a,f,function(a){var h,k=c()[f];if(k){var n=d();try{h=k.apply(e,arguments)}finally{if(h!==m)a.preventDefault?a.preventDefault():a.returnValue=p}if(n[f+"Bubble"]===p)a.cancelBubble=m,a.stopPropagation&&a.stopPropagation()}})})()}};
B.c.submit={init:function(a,c,d,e){"function"!=typeof c()&&b(Error("The value for a submit binding must be a function to invoke on submit"));B.a.s(a,"submit",function(d){var h,g=c();try{h=g.call(e,a)}finally{if(h!==m)d.preventDefault?d.preventDefault():d.returnValue=p}})}};B.c.visible={update:function(a,c){var d=B.a.d(c()),e="none"!=a.style.display;if(d&&!e)a.style.display="";else if(!d&&e)a.style.display="none"}};
B.c.enable={update:function(a,c){var d=B.a.d(c());if(d&&a.disabled)a.removeAttribute("disabled");else if(!d&&!a.disabled)a.disabled=m}};B.c.disable={update:function(a,c){B.c.enable.update(a,function(){return!B.a.d(c())})}};function E(a,c,d){d&&c!==B.h.q(a)&&B.h.T(a,c);c!==B.h.q(a)&&B.a.ta(a,"change")}
B.c.value={init:function(a,c,d){var e=["change"],f=d().valueUpdate;f&&("string"==typeof f&&(f=[f]),B.a.J(e,f),e=B.a.za(e));B.a.n(e,function(e){var f=p;B.a.Cb(e,"after")&&(f=m,e=e.substring(5));var i=f?function(a){setTimeout(a,0)}:function(a){a()};B.a.s(a,e,function(){i(function(){var e=c(),f=B.h.q(a);B.Q(e)?e(f):(e=d(),e._ko_property_writers&&e._ko_property_writers.value&&e._ko_property_writers.value(f))})})})},update:function(a,c){var d=B.a.d(c()),e=B.h.q(a),f=d!=e;0===d&&0!==e&&"0"!==e&&(f=m);f&&
(e=function(){B.h.T(a,d)},e(),"SELECT"==a.tagName&&setTimeout(e,0));"SELECT"==a.tagName&&0<a.length&&E(a,d,p)}};
B.c.options={update:function(a,c,d){"SELECT"!=a.tagName&&b(Error("options binding applies only to SELECT elements"));for(var e=0==a.length,f=B.a.ba(B.a.aa(a.childNodes,function(a){return a.tagName&&"OPTION"==a.tagName&&a.selected}),function(a){return B.h.q(a)||a.innerText||a.textContent}),h=a.scrollTop,g=B.a.d(c());0<a.length;)B.F(a.options[0]),a.remove(0);if(g){d=d();"number"!=typeof g.length&&(g=[g]);if(d.optionsCaption){var i=document.createElement("OPTION");B.a.Z(i,d.optionsCaption);B.h.T(i,l);
a.appendChild(i)}for(var c=0,j=g.length;c<j;c++){var i=document.createElement("OPTION"),k="string"==typeof d.optionsValue?g[c][d.optionsValue]:g[c],k=B.a.d(k);B.h.T(i,k);var n=d.optionsText,k="function"==typeof n?n(g[c]):"string"==typeof n?g[c][n]:k;if(k===o||k===l)k="";k=B.a.d(k).toString();"string"==typeof i.innerText?i.innerText=k:i.textContent=k;a.appendChild(i)}g=a.getElementsByTagName("OPTION");c=i=0;for(j=g.length;c<j;c++)0<=B.a.k(f,B.h.q(g[c]))&&(B.a.Ma(g[c],m),i++);if(h)a.scrollTop=h;e&&
"value"in d&&E(a,B.a.d(d.value),m)}}};B.c.options.ma="__ko.bindingHandlers.options.optionValueDomData__";
B.c.selectedOptions={Ea:function(a){for(var c=[],a=a.childNodes,d=0,e=a.length;d<e;d++){var f=a[d];"OPTION"==f.tagName&&f.selected&&c.push(B.h.q(f))}return c},init:function(a,c,d){B.a.s(a,"change",function(){var a=c();B.Q(a)?a(B.c.selectedOptions.Ea(this)):(a=d(),a._ko_property_writers&&a._ko_property_writers.value&&a._ko_property_writers.value(B.c.selectedOptions.Ea(this)))})},update:function(a,c){"SELECT"!=a.tagName&&b(Error("values binding applies only to SELECT elements"));var d=B.a.d(c());if(d&&
"number"==typeof d.length)for(var e=a.childNodes,f=0,h=e.length;f<h;f++){var g=e[f];"OPTION"==g.tagName&&B.a.Ma(g,0<=B.a.k(d,B.h.q(g)))}}};B.c.text={update:function(a,c){var d=B.a.d(c());if(d===o||d===l)d="";"string"==typeof a.innerText?a.innerText=d:a.textContent=d}};B.c.html={init:function(){return{controlsDescendantBindings:m}},update:function(a,c){var d=B.a.d(c());B.a.Z(a,d)}};B.c.css={update:function(a,c){var d=B.a.d(c()||{}),e;for(e in d)if("string"==typeof e){var f=B.a.d(d[e]);B.a.Qa(a,e,f)}}};
B.c.style={update:function(a,c){var d=B.a.d(c()||{}),e;for(e in d)if("string"==typeof e){var f=B.a.d(d[e]);a.style[e]=f||""}}};B.c.uniqueName={init:function(a,c){if(c())a.name="ko_unique_"+ ++B.c.uniqueName.Za,(B.a.ob||B.a.pb)&&a.mergeAttributes(document.createElement("<input name='"+a.name+"'/>"),p)}};B.c.uniqueName.Za=0;
B.c.checked={init:function(a,c,d){B.a.s(a,"click",function(){var e;if("checkbox"==a.type)e=a.checked;else if("radio"==a.type&&a.checked)e=a.value;else return;var f=c();"checkbox"==a.type&&B.a.d(f)instanceof Array?(e=B.a.k(B.a.d(f),a.value),a.checked&&0>e?f.push(a.value):!a.checked&&0<=e&&f.splice(e,1)):B.Q(f)?f()!==e&&f(e):(f=d(),f._ko_property_writers&&f._ko_property_writers.checked&&f._ko_property_writers.checked(e))});"radio"==a.type&&!a.name&&B.c.uniqueName.init(a,function(){return m})},update:function(a,
c){var d=B.a.d(c());if("checkbox"==a.type)a.checked=d instanceof Array?0<=B.a.k(d,a.value):d;else if("radio"==a.type)a.checked=a.value==d}};B.c.attr={update:function(a,c){var d=B.a.d(c())||{},e;for(e in d)if("string"==typeof e){var f=B.a.d(d[e]);f===p||f===o||f===l?a.removeAttribute(e):a.setAttribute(e,f.toString())}}};
B.c.hasfocus={init:function(a,c,d){function e(a){var e=c();a!=B.a.d(e)&&(B.Q(e)?e(a):(e=d(),e._ko_property_writers&&e._ko_property_writers.hasfocus&&e._ko_property_writers.hasfocus(a)))}B.a.s(a,"focus",function(){e(m)});B.a.s(a,"focusin",function(){e(m)});B.a.s(a,"blur",function(){e(p)});B.a.s(a,"focusout",function(){e(p)})},update:function(a,c){var d=B.a.d(c());d?a.focus():a.blur();B.a.ta(a,d?"focusin":"focusout")}};
B.c["with"]={o:function(a){return function(){var c=a();return{"if":c,data:c,templateEngine:B.p.M}}},init:function(a,c){return B.c.template.init(a,B.c["with"].o(c))},update:function(a,c,d,e,f){return B.c.template.update(a,B.c["with"].o(c),d,e,f)}};B.j.D["with"]=p;B.f.C["with"]=m;B.c["if"]={o:function(a){return function(){return{"if":a(),templateEngine:B.p.M}}},init:function(a,c){return B.c.template.init(a,B.c["if"].o(c))},update:function(a,c,d,e,f){return B.c.template.update(a,B.c["if"].o(c),d,e,f)}};
B.j.D["if"]=p;B.f.C["if"]=m;B.c.ifnot={o:function(a){return function(){return{ifnot:a(),templateEngine:B.p.M}}},init:function(a,c){return B.c.template.init(a,B.c.ifnot.o(c))},update:function(a,c,d,e,f){return B.c.template.update(a,B.c.ifnot.o(c),d,e,f)}};B.j.D.ifnot=p;B.f.C.ifnot=m;
B.c.foreach={o:function(a){return function(){var c=B.a.d(a());return!c||"number"==typeof c.length?{foreach:c,templateEngine:B.p.M}:{foreach:c.data,includeDestroyed:c.includeDestroyed,afterAdd:c.afterAdd,beforeRemove:c.beforeRemove,afterRender:c.afterRender,templateEngine:B.p.M}}},init:function(a,c){return B.c.template.init(a,B.c.foreach.o(c))},update:function(a,c,d,e,f){return B.c.template.update(a,B.c.foreach.o(c),d,e,f)}};B.j.D.foreach=p;B.f.C.foreach=m;B.b("ko.allowedVirtualElementBindings",B.f.C);
B.t=function(){};B.t.prototype.renderTemplateSource=function(){b("Override renderTemplateSource in your ko.templateEngine subclass")};B.t.prototype.createJavaScriptEvaluatorBlock=function(){b("Override createJavaScriptEvaluatorBlock in your ko.templateEngine subclass")};
B.t.prototype.makeTemplateSource=function(a){if("string"==typeof a){var c=document.getElementById(a);c||b(Error("Cannot find template with ID "+a));return new B.m.g(c)}if(1==a.nodeType||8==a.nodeType)return new B.m.I(a);b(Error("Unrecognised template type: "+a))};B.t.prototype.renderTemplate=function(a,c,d){return this.renderTemplateSource(this.makeTemplateSource(a),c,d)};B.t.prototype.isTemplateRewritten=function(a){return this.allowTemplateRewriting===p?m:this.X&&this.X[a]?m:this.makeTemplateSource(a).data("isRewritten")};
B.t.prototype.rewriteTemplate=function(a,c){var d=this.makeTemplateSource(a),e=c(d.text());d.text(e);d.data("isRewritten",m);if("string"==typeof a)this.X=this.X||{},this.X[a]=m};B.b("ko.templateEngine",B.t);
B.$=function(){function a(a,c,d){for(var a=B.j.Y(a),g=B.j.D,i=0;i<a.length;i++){var j=a[i].key;if(g.hasOwnProperty(j)){var k=g[j];"function"===typeof k?(j=k(a[i].value))&&b(Error(j)):k||b(Error("This template engine does not support the '"+j+"' binding within its templates"))}}a="ko.templateRewriting.applyMemoizedBindingsToNextSibling(function() {             return (function() { return { "+B.j.ia(a)+" } })()         })";return d.createJavaScriptEvaluatorBlock(a)+c}var c=/(<[a-z]+\d*(\s+(?!data-bind=)[a-z0-9\-]+(=(\"[^\"]*\"|\'[^\']*\'))?)*\s+)data-bind=(["'])([\s\S]*?)\5/gi,
d=/<\!--\s*ko\b\s*([\s\S]*?)\s*--\>/g;return{gb:function(a,c){c.isTemplateRewritten(a)||c.rewriteTemplate(a,function(a){return B.$.ub(a,c)})},ub:function(e,f){return e.replace(c,function(c,d,e,j,k,n,t){return a(t,d,f)}).replace(d,function(c,d){return a(d,"<\!-- ko --\>",f)})},Ua:function(a){return B.r.la(function(c,d){c.nextSibling&&B.ya(c.nextSibling,a,d)})}}}();B.b("ko.templateRewriting",B.$);B.b("ko.templateRewriting.applyMemoizedBindingsToNextSibling",B.$.Ua);B.m={};B.m.g=function(a){this.g=a};
B.m.g.prototype.text=function(){if(0==arguments.length)return"script"==this.g.tagName.toLowerCase()?this.g.text:this.g.innerHTML;var a=arguments[0];"script"==this.g.tagName.toLowerCase()?this.g.text=a:B.a.Z(this.g,a)};B.m.g.prototype.data=function(a){if(1===arguments.length)return B.a.e.get(this.g,"templateSourceData_"+a);B.a.e.set(this.g,"templateSourceData_"+a,arguments[1])};B.m.I=function(a){this.g=a};B.m.I.prototype=new B.m.g;
B.m.I.prototype.text=function(){if(0==arguments.length)return B.a.e.get(this.g,"__ko_anon_template__");B.a.e.set(this.g,"__ko_anon_template__",arguments[0])};B.b("ko.templateSources",B.m);B.b("ko.templateSources.domElement",B.m.g);B.b("ko.templateSources.anonymousTemplate",B.m.I);
(function(){function a(a,c,d){for(var g=0;node=a[g];g++)node.parentNode===c&&(1===node.nodeType||8===node.nodeType)&&d(node)}function c(a,c,h,g,i){var i=i||{},j=i.templateEngine||d;B.$.gb(h,j);h=j.renderTemplate(h,g,i);("number"!=typeof h.length||0<h.length&&"number"!=typeof h[0].nodeType)&&b("Template engine must return an array of DOM nodes");j=p;switch(c){case "replaceChildren":B.f.pa(a,h);j=m;break;case "replaceNode":B.a.Ka(a,h);j=m;break;case "ignoreTargetNode":break;default:b(Error("Unknown renderMode: "+
c))}j&&(B.va(h,g),i.afterRender&&i.afterRender(h,g.$data));return h}var d;B.qa=function(a){a!=l&&!(a instanceof B.t)&&b("templateEngine must inherit from ko.templateEngine");d=a};B.va=function(c,d){var h=B.a.J([],c),g=0<c.length?c[0].parentNode:o;a(h,g,function(a){B.xa(d,a)});a(h,g,function(a){B.r.Sa(a,[d])})};B.oa=function(a,f,h,g,i){h=h||{};(h.templateEngine||d)==l&&b("Set a template engine before calling renderTemplate");i=i||"replaceChildren";if(g){var j=g.nodeType?g:0<g.length?g[0]:o;return new B.i(function(){var d=
f&&f instanceof B.K?f:new B.K(B.a.d(f)),n="function"==typeof a?a(d.$data):a,d=c(g,i,n,d,h);"replaceNode"==i&&(g=d,j=g.nodeType?g:0<g.length?g[0]:o)},o,{disposeWhen:function(){return!j||!B.a.ga(j)},disposeWhenNodeIsRemoved:j&&"replaceNode"==i?j.parentNode:j})}return B.r.la(function(c){B.oa(a,f,h,c,"replaceNode")})};B.Ab=function(a,d,h,g,i){function j(a,c){var d=k(a);B.va(c,d);h.afterRender&&h.afterRender(c,d.$data)}function k(a){return i.createChildContext(B.a.d(a))}return new B.i(function(){var i=
B.a.d(d)||[];"undefined"==typeof i.length&&(i=[i]);i=B.a.aa(i,function(a){return h.includeDestroyed||a===l||a===o||!B.a.d(a._destroy)});B.a.La(g,i,function(d){var f="function"==typeof a?a(d):a;return c(o,"ignoreTargetNode",f,k(d),h)},h,j)},o,{disposeWhenNodeIsRemoved:g})};B.c.template={init:function(a,c){var d=B.a.d(c());"string"!=typeof d&&!d.name&&1==a.nodeType&&((new B.m.I(a)).text(a.innerHTML),B.a.V(a));return{controlsDescendantBindings:m}},update:function(a,c,d,g,i){c=B.a.d(c());g=m;"string"==
typeof c?d=c:(d=c.name,"if"in c&&(g=g&&B.a.d(c["if"])),"ifnot"in c&&(g=g&&!B.a.d(c.ifnot)));var j=o;"undefined"!=typeof c.foreach?j=B.Ab(d||a,g&&c.foreach||[],c,a,i):g?(i="object"==typeof c&&"data"in c?i.createChildContext(B.a.d(c.data)):i,j=B.oa(d||a,i,c,a)):B.f.ha(a);i=j;(c=B.a.e.get(a,"__ko__templateSubscriptionDomDataKey__"))&&"function"==typeof c.v&&c.v();B.a.e.set(a,"__ko__templateSubscriptionDomDataKey__",i)}};B.j.D.template=function(a){a=B.j.Y(a);return 1==a.length&&a[0].unknown?o:B.j.rb(a,
"name")?o:"This template engine does not support anonymous templates nested within its templates"};B.f.C.template=m})();B.b("ko.setTemplateEngine",B.qa);B.b("ko.renderTemplate",B.oa);
B.a.O=function(a,c,d){if(d===l)return B.a.O(a,c,1)||B.a.O(a,c,10)||B.a.O(a,c,Number.MAX_VALUE);for(var a=a||[],c=c||[],e=a,f=c,h=[],g=0;g<=f.length;g++)h[g]=[];for(var g=0,i=Math.min(e.length,d);g<=i;g++)h[0][g]=g;g=1;for(i=Math.min(f.length,d);g<=i;g++)h[g][0]=g;for(var i=e.length,j,k=f.length,g=1;g<=i;g++){j=Math.max(1,g-d);for(var n=Math.min(k,g+d);j<=n;j++)h[j][g]=e[g-1]===f[j-1]?h[j-1][g-1]:Math.min(h[j-1][g]===l?Number.MAX_VALUE:h[j-1][g]+1,h[j][g-1]===l?Number.MAX_VALUE:h[j][g-1]+1)}d=a.length;
e=c.length;f=[];g=h[e][d];if(g===l)h=o;else{for(;0<d||0<e;){i=h[e][d];k=0<e?h[e-1][d]:g+1;n=0<d?h[e][d-1]:g+1;j=0<e&&0<d?h[e-1][d-1]:g+1;if(k===l||k<i-1)k=g+1;if(n===l||n<i-1)n=g+1;j<i-1&&(j=g+1);k<=n&&k<j?(f.push({status:"added",value:c[e-1]}),e--):(n<k&&n<j?f.push({status:"deleted",value:a[d-1]}):(f.push({status:"retained",value:a[d-1]}),e--),d--)}h=f.reverse()}return h};B.b("ko.utils.compareArrays",B.a.O);
(function(){function a(a){if(2<a.length){for(var c=a[0],f=a[a.length-1],h=[c];c!==f;){c=c.nextSibling;if(!c)return;h.push(c)}Array.prototype.splice.apply(a,[0,a.length].concat(h))}}function c(c,e,f,h){var g=[],c=B.i(function(){var c=e(f)||[];0<g.length&&(a(g),B.a.Ka(g,c),h&&h(f,c));g.splice(0,g.length);B.a.J(g,c)},o,{disposeWhenNodeIsRemoved:c,disposeWhen:function(){return 0==g.length||!B.a.ga(g[0])}});return{sb:g,i:c}}B.a.La=function(d,e,f,h,g){for(var e=e||[],h=h||{},i=B.a.e.get(d,"setDomNodeChildrenFromArrayMapping_lastMappingResult")===
l,j=B.a.e.get(d,"setDomNodeChildrenFromArrayMapping_lastMappingResult")||[],k=B.a.ba(j,function(a){return a.Va}),n=B.a.O(k,e),e=[],t=0,q=[],k=[],v=o,s=0,w=n.length;s<w;s++)switch(n[s].status){case "retained":var x=j[t];e.push(x);0<x.P.length&&(v=x.P[x.P.length-1]);t++;break;case "deleted":j[t].i.v();a(j[t].P);B.a.n(j[t].P,function(a){q.push({element:a,index:s,value:n[s].value});v=a});t++;break;case "added":var x=n[s].value,z=c(d,f,x,g),u=z.sb;e.push({Va:n[s].value,P:u,i:z.i});for(var z=0,y=u.length;z<
y;z++){var A=u[z];k.push({element:A,index:s,value:n[s].value});v==o?B.f.xb(d,A):B.f.mb(d,A,v);v=A}g&&g(x,u)}B.a.n(q,function(a){B.F(a.element)});f=p;if(!i){if(h.afterAdd)for(s=0;s<k.length;s++)h.afterAdd(k[s].element,k[s].index,k[s].value);if(h.beforeRemove){for(s=0;s<q.length;s++)h.beforeRemove(q[s].element,q[s].index,q[s].value);f=m}}f||B.a.n(q,function(a){B.removeNode(a.element)});B.a.e.set(d,"setDomNodeChildrenFromArrayMapping_lastMappingResult",e)}})();
B.b("ko.utils.setDomNodeChildrenFromArrayMapping",B.a.La);B.p=function(){this.allowTemplateRewriting=p};B.p.prototype=new B.t;B.p.prototype.renderTemplateSource=function(a){a=a.text();return B.a.na(a)};B.p.M=new B.p;B.qa(B.p.M);B.b("ko.nativeTemplateEngine",B.p);
(function(){B.ja=function(){var a=this.qb=function(){if("undefined"==typeof jQuery||!jQuery.tmpl)return 0;try{if(0<=jQuery.tmpl.tag.tmpl.open.toString().indexOf("__"))return 2}catch(a){}return 1}();this.renderTemplateSource=function(d,e,f){f=f||{};2>a&&b(Error("Your version of jQuery.tmpl is too old. Please upgrade to jQuery.tmpl 1.0.0pre or later."));var h=d.data("precompiled");h||(h=d.text()||"",h=jQuery.template(o,"{{ko_with $item.koBindingContext}}"+h+"{{/ko_with}}"),d.data("precompiled",h));
d=[e.$data];e=jQuery.extend({koBindingContext:e},f.templateOptions);e=jQuery.tmpl(h,d,e);e.appendTo(document.createElement("div"));jQuery.fragments={};return e};this.createJavaScriptEvaluatorBlock=function(a){return"{{ko_code ((function() { return "+a+" })()) }}"};this.addTemplate=function(a,c){document.write("<script type='text/html' id='"+a+"'>"+c+"<\/script>")};if(0<a)jQuery.tmpl.tag.ko_code={open:"__.push($1 || '');"},jQuery.tmpl.tag.ko_with={open:"with($1) {",close:"} "}};B.ja.prototype=new B.t;
var a=new B.ja;0<a.qb&&B.qa(a);B.b("ko.jqueryTmplTemplateEngine",B.ja)})();
})(window,document,navigator);
