// Knockout JavaScript library v1.2.0pre
// (c) 2010 Steven Sanderson - http://knockoutjs.com/
// License: Ms-Pl (http://www.opensource.org/licenses/ms-pl.html)

(function(window,undefined){ 
function a(f){throw f;}var m=true,o=null,p=false,q=window.ko={};q.b=function(f,c){for(var b=f.split("."),d=window,e=0;e<b.length-1;e++)d=d[b[e]];d[b[b.length-1]]=c};q.h=function(f,c,b){f[c]=b};
q.a=new function(){var f=/^(\s|\u00A0)+|(\s|\u00A0)+$/g;return{ca:["authenticity_token",/^__RequestVerificationToken(_.*)?$/],i:function(c,b){for(var d=0,e=c.length;d<e;d++)b(c[d])},g:function(c,b){if(typeof c.indexOf=="function")return c.indexOf(b);for(var d=0,e=c.length;d<e;d++)if(c[d]==b)return d;return-1},Aa:function(c,b,d){for(var e=0,g=c.length;e<g;e++)if(b.call(d,c[e]))return c[e];return o},$:function(c,b){var d=q.a.g(c,b);d>=0&&c.splice(d,1)},Z:function(c){c=c||[];for(var b=[],d=0,e=c.length;d<
e;d++)q.a.g(b,c[d])<0&&b.push(c[d]);return b},K:function(c,b){c=c||[];for(var d=[],e=0,g=c.length;e<g;e++)d.push(b(c[e]));return d},J:function(c,b){c=c||[];for(var d=[],e=0,g=c.length;e<g;e++)b(c[e])&&d.push(c[e]);return d},L:function(c,b){for(var d=0,e=b.length;d<e;d++)c.push(b[d])},ba:function(c){for(;c.firstChild;){q.a.e.N(c.firstChild);c.removeChild(c.firstChild)}},Ya:function(c,b){q.a.ba(c);b&&q.a.i(b,function(d){c.appendChild(d)})},la:function(c,b){var d=c.nodeType?[c]:c;if(d.length>0){for(var e=
d[0],g=e.parentNode,h=0,i=b.length;h<i;h++)g.insertBefore(b[h],e);h=0;for(i=d.length;h<i;h++){q.a.e.N(d[h]);g.removeChild(d[h])}}},oa:function(c,b){if(navigator.userAgent.indexOf("MSIE 6")>=0)c.setAttribute("selected",b);else c.selected=b},La:function(c,b){if(!c||c.nodeType!=1)return[];var d=[];c.getAttribute(b)!==o&&d.push(c);for(var e=c.getElementsByTagName("*"),g=0,h=e.length;g<h;g++)e[g].getAttribute(b)!==o&&d.push(e[g]);return d},l:function(c){return(c||"").replace(f,"")},cb:function(c,b){for(var d=
[],e=(c||"").split(b),g=0,h=e.length;g<h;g++){var i=q.a.l(e[g]);i!==""&&d.push(i)}return d},Za:function(c,b){c=c||"";if(b.length>c.length)return p;return c.substring(0,b.length)===b},Ja:function(c,b){if(b===undefined)return(new Function("return "+c))();with(b)return eval("("+c+")")},Ha:function(c,b){if(b.compareDocumentPosition)return(b.compareDocumentPosition(c)&16)==16;for(;c!=o;){if(c==b)return m;c=c.parentNode}return p},A:function(c){return q.a.Ha(c,document)},o:function(c,b,d){if(typeof jQuery!=
"undefined")jQuery(c).bind(b,d);else if(typeof c.addEventListener=="function")c.addEventListener(b,d,p);else if(typeof c.attachEvent!="undefined")c.attachEvent("on"+b,function(e){d.call(c,e)});else a(Error("Browser doesn't support addEventListener or attachEvent"))},ta:function(c,b){if(!(c&&c.nodeType))a(Error("element must be a DOM node when calling triggerEvent"));if(typeof document.createEvent=="function")if(typeof c.dispatchEvent=="function"){var d=document.createEvent(b=="click"?"MouseEvents":
"HTMLEvents");d.initEvent(b,m,m,window,0,0,0,0,0,p,p,p,p,0,c);c.dispatchEvent(d)}else a(Error("The supplied element doesn't support dispatchEvent"));else if(typeof c.fireEvent!="undefined"){if(b=="click")if(c.tagName=="INPUT"&&(c.type.toLowerCase()=="checkbox"||c.type.toLowerCase()=="radio"))c.checked=c.checked!==m;c.fireEvent("on"+b)}else a(Error("Browser doesn't support triggering events"))},d:function(c){return q.C(c)?c():c},Ga:function(c,b){return q.a.g((c.className||"").split(/\s+/),b)>=0},sa:function(c,
b,d){var e=q.a.Ga(c,b);if(d&&!e)c.className=(c.className||"")+" "+b;else if(e&&!d){d=(c.className||"").split(/\s+/);e="";for(var g=0;g<d.length;g++)if(d[g]!=b)e+=d[g]+" ";c.className=q.a.l(e)}},Va:function(c,b){c=q.a.d(c);b=q.a.d(b);for(var d=[],e=c;e<=b;e++)d.push(e);return d},ha:function(c){for(var b=[],d=c.length-1;d>=0;d--)b.push(c[d]);return b},Q:/MSIE 6/i.test(navigator.userAgent),Oa:/MSIE 7/i.test(navigator.userAgent),ea:function(c,b){for(var d=q.a.ha(c.getElementsByTagName("INPUT")).concat(q.a.ha(c.getElementsByTagName("TEXTAREA"))),
e=typeof b=="string"?function(i){return i.name===b}:function(i){return b.test(i.name)},g=[],h=d.length-1;h>=0;h--)e(d[h])&&g.push(d[h]);return g},F:function(c){if(typeof c=="string")if(c=q.a.l(c)){if(window.JSON&&window.JSON.parse)return window.JSON.parse(c);return(new Function("return "+c))()}return o},U:function(c){if(typeof JSON=="undefined"||typeof JSON.stringify=="undefined")a(Error("Cannot find JSON.stringify(). Some browsers (e.g., IE < 8) don't support it natively, but you can overcome this by adding a script reference to json2.js, downloadable from http://www.json.org/json2.js"));
return JSON.stringify(q.a.d(c))},Ta:function(c,b,d){d=d||{};var e=d.params||{},g=d.includeFields||this.ca,h=c;if(typeof c=="object"&&c.tagName=="FORM"){h=c.action;for(var i=g.length-1;i>=0;i--)for(var j=q.a.ea(c,g[i]),l=j.length-1;l>=0;l--)e[j[l].name]=j[l].value}b=q.a.d(b);var k=document.createElement("FORM");k.style.display="none";k.action=h;k.method="post";for(var n in b){c=document.createElement("INPUT");c.name=n;c.value=q.a.U(q.a.d(b[n]));k.appendChild(c)}for(n in e){c=document.createElement("INPUT");
c.name=n;c.value=e[n];k.appendChild(c)}document.body.appendChild(k);d.submitter?d.submitter(k):k.submit();setTimeout(function(){k.parentNode.removeChild(k)},0)},e:{ab:0,w:"__ko__"+(new Date).getTime(),bb:{},t:function(c,b){var d=q.a.e.da(c,p);return d===undefined?undefined:d[b]},ma:function(c,b,d){q.a.e.da(c,m)[b]=d},da:function(c,b){var d=c[q.a.e.w];if(!d){if(!b)return;d=c[q.a.e.w]="ko"+q.a.e.ab++;q.a.e[d]={}}return q.a.e[d]},M:function(c){var b=c[q.a.e.w];if(b){delete q.a.e[b];c[q.a.e.w]=o}},N:function(c){if(!(c.nodeType!=
1&&c.nodeType!=9)){q.a.e.M(c);c=c.getElementsByTagName("*");for(var b=0,d=c.length;b<d;b++)q.a.e.M(c[b])}}}}};q.b("ko.utils",q.a);q.b("ko.utils.arrayForEach",q.a.i);q.b("ko.utils.arrayFirst",q.a.Aa);q.b("ko.utils.arrayFilter",q.a.J);q.b("ko.utils.arrayGetDistinctValues",q.a.Z);q.b("ko.utils.arrayIndexOf",q.a.g);q.b("ko.utils.arrayMap",q.a.K);q.b("ko.utils.arrayPushAll",q.a.L);q.b("ko.utils.arrayRemoveItem",q.a.$);q.b("ko.utils.fieldsIncludedWithJsonPost",q.a.ca);q.b("ko.utils.getFormFields",q.a.ea);
q.b("ko.utils.postJson",q.a.Ta);q.b("ko.utils.parseJson",q.a.F);q.b("ko.utils.registerEventHandler",q.a.o);q.b("ko.utils.stringifyJson",q.a.U);q.b("ko.utils.range",q.a.Va);q.b("ko.utils.toggleDomNodeCssClass",q.a.sa);q.b("ko.utils.triggerEvent",q.a.ta);q.b("ko.utils.unwrapObservable",q.a.d);Function.prototype.bind||(Function.prototype.bind=function(f){var c=this,b=Array.prototype.slice.call(arguments);f=b.shift();return function(){return c.apply(f,b.concat(Array.prototype.slice.call(arguments)))}});
q.j=function(){function f(){return((1+Math.random())*4294967296|0).toString(16).substring(1)}function c(d,e){if(d)if(d.nodeType==8){var g=q.j.ja(d.nodeValue);g!=o&&e.push({Fa:d,Qa:g})}else if(d.nodeType==1){g=0;for(var h=d.childNodes,i=h.length;g<i;g++)c(h[g],e)}}var b={};return{S:function(d){if(typeof d!="function")a(Error("You can only pass a function to ko.memoization.memoize()"));var e=f()+f();b[e]=d;return"<!--[ko_memo:"+e+"]--\>"},ua:function(d,e){var g=b[d];if(g===undefined)a(Error("Couldn't find any memo with ID "+
d+". Perhaps it's already been unmemoized."));try{g.apply(o,e||[]);return m}finally{delete b[d]}},va:function(d,e){var g=[];c(d,g);for(var h=0,i=g.length;h<i;h++){var j=g[h].Fa,l=[j];e&&q.a.L(l,e);q.j.ua(g[h].Qa,l);j.nodeValue="";j.parentNode&&j.parentNode.removeChild(j)}},ja:function(d){return(d=d.match(/^\[ko_memo\:(.*?)\]$/))?d[1]:o}}}();q.b("ko.memoization",q.j);q.b("ko.memoization.memoize",q.j.S);q.b("ko.memoization.unmemoize",q.j.ua);q.b("ko.memoization.parseMemoText",q.j.ja);
q.b("ko.memoization.unmemoizeDomNodeAndDescendants",q.j.va);q.$a=function(f,c){this.Ca=f;this.s=c;q.h(this,"dispose",this.s)};q.V=function(){var f=[];this.W=function(c,b){var d=new q.$a(b?function(){c.call(b)}:c,function(){q.a.$(f,d)});f.push(d);return d};this.v=function(c){q.a.i(f.slice(0),function(b){b&&b.Ca(c)})};this.Ma=function(){return f.length};q.h(this,"subscribe",this.W);q.h(this,"notifySubscribers",this.v);q.h(this,"getSubscriptionsCount",this.Ma)};
q.ga=function(f){return typeof f.W=="function"&&typeof f.v=="function"};q.b("ko.subscribable",q.V);q.b("ko.isSubscribable",q.ga);q.z=function(){var f=[];return{Ba:function(){f.push([])},end:function(){return f.pop()},ka:function(c){if(!q.ga(c))a("Only subscribable things can act as dependencies");f.length>0&&f[f.length-1].push(c)}}}();q.Ua=function(f,c){return f!=c};q.qa=function(f){if(typeof f.checkValueChanged!="function")f.checkValueChanged=f.checkValueChanged?q.Ua:p;return f};
q.aa=function(f,c,b){return!b.checkValueChanged||b.checkValueChanged(f,c)};q.q=function(f,c){function b(){if(arguments.length>0){var e=arguments[0];if(q.aa(d,e,c)){d=e;b.v(d)}return this}else{q.z.ka(b);return d}}var d=f;c=c||{};c=q.qa(c);b.n=q.q;b.H=function(){b.v(d)};q.V.call(b);q.h(b,"valueHasMutated",b.H);return b};q.C=function(f){if(f===o||f===undefined||f.n===undefined)return p;if(f.n===q.q)return m;return q.C(f.n)};
q.D=function(f){if(typeof f=="function"&&f.n===q.q)return m;if(typeof f=="function"&&f.n===q.m&&f.Na)return m;return p};q.b("ko.observable",q.q);q.b("ko.isObservable",q.C);q.b("ko.isWriteableObservable",q.D);
q.Sa=function(f){var c=new q.q(f);q.a.i(["pop","push","reverse","shift","sort","splice","unshift"],function(b){c[b]=function(){var d=c();d=d[b].apply(d,arguments);c.H();return d}});q.a.i(["slice"],function(b){c[b]=function(){var d=c();return d[b].apply(d,arguments)}});c.remove=function(b){for(var d=c(),e=[],g=[],h=typeof b=="function"?b:function(k){return k===b},i=0,j=d.length;i<j;i++){var l=d[i];h(l)?g.push(l):e.push(l)}c(e);return g};c.Wa=function(b){if(b===undefined){var d=c();c([]);return d}if(!b)return[];
return c.remove(function(e){return q.a.g(b,e)>=0})};c.O=function(b){for(var d=c(),e=typeof b=="function"?b:function(h){return h===b},g=d.length-1;g>=0;g--)if(e(d[g]))d[g]._destroy=m;c.H()};c.Ea=function(b){if(b===undefined)return c.O(function(){return m});if(!b)return[];return c.O(function(d){return q.a.g(b,d)>=0})};c.indexOf=function(b){var d=c();return q.a.g(d,b)};c.replace=function(b,d){var e=c.indexOf(b);if(e>=0){c()[e]=d;c.H()}};q.h(c,"remove",c.remove);q.h(c,"removeAll",c.Wa);q.h(c,"destroy",
c.O);q.h(c,"destroyAll",c.Ea);q.h(c,"indexOf",c.indexOf);return c};q.b("ko.observableArray",q.Sa);
q.m=function(f,c,b){function d(){q.a.i(i,function(k){k.s()});i=[]}function e(k){d();q.a.i(k,function(n){i.push(n.W(g))})}function g(){if(l&&typeof b.disposeWhen=="function")if(b.disposeWhen()){h.s();return}try{q.z.Ba();j=b.owner?b.read.call(b.owner):b.read()}finally{var k=q.a.Z(q.z.end());e(k)}h.v(j);l=m}function h(){if(arguments.length>0)if(typeof b.write==="function"){var k=arguments[0];if(q.aa(j,k,b))b.owner?b.write.call(b.owner,k):b.write(k)}else a("Cannot write a value to a dependentObservable unless you specify a 'write' option. If you wish to read the current value, don't pass any parameters.");
else{l||g();q.z.ka(h);return j}}if(f&&typeof f=="object")b=f;else{b=b||{};b.read=f||b.read;b.owner=c||b.owner}b=q.qa(b);if(typeof b.read!="function")a("Pass a function that returns the value of the dependentObservable");var i=[],j,l=p;h.n=q.m;h.Ka=function(){return i.length};h.Na=typeof b.write==="function";h.s=function(){d()};q.V.call(h);b.deferEvaluation!==m&&g();q.h(h,"dispose",h.s);q.h(h,"getDependenciesCount",h.Ka);return h};q.m.n=q.q;q.b("ko.dependentObservable",q.m);
(function(){function f(d,e,g){g=g||new b;d=e(d);if(!(typeof d=="object"&&d!==o&&d!==undefined))return d;var h=d instanceof Array?[]:{};g.save(d,h);c(d,function(i){var j=e(d[i]);switch(typeof j){case "boolean":case "number":case "string":case "function":h[i]=j;break;case "object":case "undefined":var l=g.t(j);h[i]=l!==undefined?l:f(j,e,g)}});return h}function c(d,e){if(d instanceof Array)for(var g=0;g<d.length;g++)e(g);else for(g in d)e(g)}function b(){var d=[],e=[];this.save=function(g,h){var i=q.a.g(d,
g);if(i>=0)e[i]=h;else{d.push(g);e.push(h)}};this.t=function(g){g=q.a.g(d,g);return g>=0?e[g]:undefined}}q.ra=function(d){if(arguments.length==0)a(Error("When calling ko.toJS, pass the object you want to convert."));return f(d,function(e){for(var g=0;q.C(e)&&g<10;g++)e=e();return e})};q.toJSON=function(d){d=q.ra(d);return q.a.U(d)}})();q.b("ko.toJS",q.ra);q.b("ko.toJSON",q.toJSON);
q.f={k:function(f){if(f.tagName=="OPTION"){if(f.__ko__hasDomDataOptionValue__===m)return q.a.e.t(f,q.c.options.ia);return f.getAttribute("value")}else return f.tagName=="SELECT"?f.selectedIndex>=0?q.f.k(f.options[f.selectedIndex]):undefined:f.value},I:function(f,c){if(f.tagName=="OPTION")switch(typeof c){case "string":case "number":q.a.e.M(f);"__ko__hasDomDataOptionValue__"in f&&delete f.__ko__hasDomDataOptionValue__;f.value=c;break;default:q.a.e.ma(f,q.c.options.ia,c);f.__ko__hasDomDataOptionValue__=
m;f.value=""}else if(f.tagName=="SELECT")for(var b=f.options.length-1;b>=0;b--){if(q.f.k(f.options[b])==c){f.selectedIndex=b;break}}else{if(c===o||c===undefined)c="";f.value=c}}};q.b("ko.selectExtensions",q.f);q.b("ko.selectExtensions.readValue",q.f.k);q.b("ko.selectExtensions.writeValue",q.f.I);
q.p=function(){function f(e,g){return e.replace(c,function(h,i){return g[i]})}var c=/\[ko_token_(\d+)\]/g,b=/^[\_$a-z][\_$a-z0-9]*(\[.*?\])*(\.[\_$a-z][\_$a-z0-9]*(\[.*?\])*)*$/i,d=["true","false"];return{F:function(e){e=q.a.l(e);if(e.length<3)return{};for(var g=[],h=o,i,j=e.charAt(0)=="{"?1:0;j<e.length;j++){var l=e.charAt(j);if(h===o)switch(l){case '"':case "'":case "/":h=j;i=l;break;case "{":h=j;i="}";break;case "[":h=j;i="]"}else if(l==i){l=e.substring(h,j+1);g.push(l);var k="[ko_token_"+(g.length-
1)+"]";e=e.substring(0,h)+k+e.substring(j+1);j-=l.length-k.length;h=o}}h={};e=e.split(",");i=0;for(j=e.length;i<j;i++){k=e[i];var n=k.indexOf(":");if(n>0&&n<k.length-1){l=q.a.l(k.substring(0,n));k=q.a.l(k.substring(n+1));if(l.charAt(0)=="{")l=l.substring(1);if(k.charAt(k.length-1)=="}")k=k.substring(0,k.length-1);l=q.a.l(f(l,g));k=q.a.l(f(k,g));h[l]=k}}return h},P:function(e){var g=q.p.F(e),h=[],i;for(i in g){var j=g[i],l;l=j;l=q.a.g(d,q.a.l(l).toLowerCase())>=0?p:l.match(b)!==o;if(l){h.length>0&&
h.push(", ");h.push(i+" : function(__ko_value) { "+j+" = __ko_value; }")}}if(h.length>0)e=e+", '_ko_property_writers' : { "+h.join("")+" } ";return e}}}();q.b("ko.jsonExpressionRewriting",q.p);q.b("ko.jsonExpressionRewriting.parseJson",q.p.F);q.b("ko.jsonExpressionRewriting.insertPropertyAccessorsIntoJson",q.p.P);q.c={};
q.Y=function(f,c,b){function d(i){return function(){return h[i]}}function e(){return h}var g=m,h;new q.m(function(){var i;if(!(i=typeof c=="function"?c():c)){var j=f.getAttribute("data-bind");try{var l=" { "+q.p.P(j)+" } ";i=q.a.Ja(l,b===o?window:b)}catch(k){a(Error("Unable to parse binding attribute.\nMessage: "+k+";\nAttribute value: "+j))}}h=i;if(g)for(var n in h)q.c[n]&&typeof q.c[n].init=="function"&&(0,q.c[n].init)(f,d(n),e,b);for(n in h)q.c[n]&&typeof q.c[n].update=="function"&&(0,q.c[n].update)(f,
d(n),e,b)},o,{disposeWhen:function(){return!q.a.A(f)}});g=p};q.xa=function(f,c){if(c&&c.nodeType==undefined)a(Error("ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node (note: this is a breaking change since KO version 1.05)"));c=c||window.document.body;var b=q.a.La(c,"data-bind");q.a.i(b,function(d){q.Y(d,o,f)})};q.b("ko.bindingHandlers",q.c);q.b("ko.applyBindings",q.xa);
q.c.click={init:function(f,c,b,d){q.a.o(f,"click",function(e){var g,h=c(),i=b();try{g=h.call(d)}finally{if(g!==m)if(e.preventDefault)e.preventDefault();else e.returnValue=p}if(i.clickBubble===p){e.cancelBubble=m;e.stopPropagation&&e.stopPropagation()}})}};
q.c.submit={init:function(f,c,b,d){if(typeof c()!="function")a(Error("The value for a submit binding must be a function to invoke on submit"));q.a.o(f,"submit",function(e){var g,h=c();try{g=h.call(d,f)}finally{if(g!==m)if(e.preventDefault)e.preventDefault();else e.returnValue=p}})}};q.c.visible={update:function(f,c){var b=q.a.d(c()),d=f.style.display!="none";if(b&&!d)f.style.display="";else if(!b&&d)f.style.display="none"}};
q.c.enable={update:function(f,c){var b=q.a.d(c());if(b&&f.disabled)f.removeAttribute("disabled");else if(!b&&!f.disabled)f.disabled=m}};q.c.disable={update:function(f,c){q.c.enable.update(f,function(){return!q.a.d(c())})}};
q.c.value={init:function(f,c,b){var d=b().valueUpdate||"change",e=p;if(q.a.Za(d,"after")){e=m;d=d.substring(5)}var g=e?function(h){setTimeout(h,0)}:function(h){h()};q.a.o(f,d,function(){g(function(){var h=c(),i=q.f.k(f);if(q.D(h))h(i);else{h=b();h._ko_property_writers&&h._ko_property_writers.value&&h._ko_property_writers.value(i)}})})},update:function(f,c){var b=q.a.d(c()),d=q.f.k(f),e=b!=d;if(b===0&&d!==0&&d!=="0")e=m;if(e){d=function(){q.f.I(f,b)};d();f.tagName=="SELECT"&&setTimeout(d,0)}if(f.tagName==
"SELECT"){d=q.f.k(f);d!==b&&q.a.ta(f,"change")}}};
q.c.options={update:function(f,c,b){if(f.tagName!="SELECT")a(Error("options binding applies only to SELECT elements"));var d=q.a.K(q.a.J(f.childNodes,function(k){return k.tagName&&k.tagName=="OPTION"&&k.selected}),function(k){return q.f.k(k)||k.innerText||k.textContent}),e=f.scrollTop,g=q.a.d(c());q.a.ba(f);if(g){var h=b();if(typeof g.length!="number")g=[g];if(h.optionsCaption){var i=document.createElement("OPTION");i.innerHTML=h.optionsCaption;q.f.I(i,undefined);f.appendChild(i)}b=0;for(c=g.length;b<
c;b++){i=document.createElement("OPTION");var j=typeof h.optionsValue=="string"?g[b][h.optionsValue]:g[b],l=h.optionsText;optionText=typeof l=="function"?l(g[b]):typeof l=="string"?g[b][l]:j;j=q.a.d(j);optionText=q.a.d(optionText);q.f.I(i,j);i.innerHTML=optionText.toString();f.appendChild(i)}g=f.getElementsByTagName("OPTION");b=h=0;for(c=g.length;b<c;b++)if(q.a.g(d,q.f.k(g[b]))>=0){q.a.oa(g[b],m);h++}if(e)f.scrollTop=e}}};q.c.options.ia="__ko.bindingHandlers.options.optionValueDomData__";
q.c.selectedOptions={fa:function(f){var c=[];f=f.childNodes;for(var b=0,d=f.length;b<d;b++){var e=f[b];e.tagName=="OPTION"&&e.selected&&c.push(q.f.k(e))}return c},init:function(f,c,b){q.a.o(f,"change",function(){var d=c();if(q.D(d))d(q.c.selectedOptions.fa(this));else{d=b();d._ko_property_writers&&d._ko_property_writers.value&&d._ko_property_writers.value(q.c.selectedOptions.fa(this))}})},update:function(f,c){if(f.tagName!="SELECT")a(Error("values binding applies only to SELECT elements"));var b=
q.a.d(c());if(b&&typeof b.length=="number")for(var d=f.childNodes,e=0,g=d.length;e<g;e++){var h=d[e];h.tagName=="OPTION"&&q.a.oa(h,q.a.g(b,q.f.k(h))>=0)}}};q.c.text={update:function(f,c){var b=q.a.d(c());if(b===o||b===undefined)b="";typeof f.innerText=="string"?f.innerText=b:f.textContent=b}};q.c.html={update:function(f,c){var b=q.a.d(c());if(b===o||b===undefined)b="";f.innerHTML=b}};
q.c.css={update:function(f,c){var b=q.a.d(c()||{}),d;for(d in b)if(typeof d=="string"){var e=q.a.d(b[d]);q.a.sa(f,d,e)}}};q.c.style={update:function(f,c){var b=q.a.d(c()||{}),d;for(d in b)if(typeof d=="string"){var e=q.a.d(b[d]);f.style[d]=e||""}}};q.c.uniqueName={init:function(f,c){if(c()){f.name="ko_unique_"+ ++q.c.uniqueName.Da;q.a.Q&&f.mergeAttributes(document.createElement("<INPUT name='"+f.name+"'/>"),p)}}};q.c.uniqueName.Da=0;
q.c.checked={init:function(f,c,b){function d(){var e;if(f.type=="checkbox")e=f.checked;else if(f.type=="radio"&&f.checked)e=f.value;else return;var g=c();if(f.type=="checkbox"&&q.a.d(g)instanceof Array){e=q.a.g(q.a.d(g),f.value);if(f.checked&&e<0)g.push(f.value);else!f.checked&&e>=0&&g.splice(e,1)}else if(q.D(g))g()!==e&&g(e);else{g=b();g._ko_property_writers&&g._ko_property_writers.checked&&g._ko_property_writers.checked(e)}}q.a.o(f,"change",d);q.a.o(f,"click",d);f.type=="radio"&&!f.name&&q.c.uniqueName.init(f,
function(){return m})},update:function(f,c){var b=q.a.d(c());if(f.type=="checkbox"){f.checked=b instanceof Array?q.a.g(b,f.value)>=0:b;b&&q.a.Q&&f.mergeAttributes(document.createElement("<INPUT type='checkbox' checked='checked' />"),p)}else if(f.type=="radio"){f.checked=f.value==b;if(f.value==b&&(q.a.Q||q.a.Oa))f.mergeAttributes(document.createElement("<INPUT type='radio' checked='checked' />"),p)}}};
q.X=function(){this.renderTemplate=function(){a("Override renderTemplate in your ko.templateEngine subclass")};this.isTemplateRewritten=function(){a("Override isTemplateRewritten in your ko.templateEngine subclass")};this.rewriteTemplate=function(){a("Override rewriteTemplate in your ko.templateEngine subclass")};this.createJavaScriptEvaluatorBlock=function(){a("Override createJavaScriptEvaluatorBlock in your ko.templateEngine subclass")}};q.b("ko.templateEngine",q.X);
q.G=function(){var f=/(<[a-z]+\d*(\s+(?!data-bind=)[a-z0-9]+(=(\"[^\"]*\"|\'[^\']*\'))?)*\s+)data-bind=(["'])([\s\S]*?)\5/g;return{Ia:function(c,b){b.isTemplateRewritten(c)||b.rewriteTemplate(c,function(d){return q.G.Ra(d,b)})},Ra:function(c,b){return c.replace(f,function(d,e,g,h,i,j,l){d=l;d=q.p.P(d);return b.createJavaScriptEvaluatorBlock("ko.templateRewriting.applyMemoizedBindingsToNextSibling(function() {                     return (function() { return { "+d+" } })()                 })")+e})},
ya:function(c){return q.j.S(function(b,d){b.nextSibling&&q.Y(b.nextSibling,c,d)})}}}();q.b("ko.templateRewriting",q.G);q.b("ko.templateRewriting.applyMemoizedBindingsToNextSibling",q.G.ya);
(function(){function f(b,d,e,g,h){var i=q.a.d(g);h=h||{};var j=h.templateEngine||c;q.G.Ia(e,j);e=j.renderTemplate(e,i,h);if(typeof e.length!="number"||e.length>0&&typeof e[0].nodeType!="number")a("Template engine must return an array of DOM nodes");e&&q.a.i(e,function(l){q.j.va(l,[g])});switch(d){case "replaceChildren":q.a.Ya(b,e);break;case "replaceNode":q.a.la(b,e);break;case "ignoreTargetNode":break;default:a(Error("Unknown renderMode: "+d))}h.afterRender&&h.afterRender(e,g);return e}var c;q.pa=
function(b){if(b!=undefined&&!(b instanceof q.X))a("templateEngine must inherit from ko.templateEngine");c=b};q.T=function(b,d,e,g,h){e=e||{};if((e.templateEngine||c)==undefined)a("Set a template engine before calling renderTemplate");h=h||"replaceChildren";if(g){var i=g.nodeType?g:g.length>0?g[0]:o;return new q.m(function(){var j=typeof b=="function"?b(d):b;j=f(g,h,j,d,e);if(h=="replaceNode"){g=j;i=g.nodeType?g:g.length>0?g[0]:o}},o,{disposeWhen:function(){return!i||!q.a.A(i)}})}else return q.j.S(function(j){q.T(b,
d,e,j,"replaceNode")})};q.Xa=function(b,d,e,g){new q.m(function(){var h=q.a.d(d)||[];if(typeof h.length=="undefined")h=[h];h=q.a.J(h,function(i){return e.includeDestroyed||!i._destroy});q.a.na(g,h,function(i){var j=typeof b=="function"?b(i):b;return f(o,"ignoreTargetNode",j,i,e)},e)},o,{disposeWhen:function(){return!q.a.A(g)}})};q.c.template={update:function(b,d,e,g){d=q.a.d(d());e=typeof d=="string"?d:d.name;if(typeof d.foreach!="undefined")q.Xa(e,d.foreach||[],{templateOptions:d.templateOptions,
afterAdd:d.afterAdd,beforeRemove:d.beforeRemove,includeDestroyed:d.includeDestroyed,afterRender:d.afterRender},b);else{var h=d.data;q.T(e,typeof h=="undefined"?g:h,{templateOptions:d.templateOptions,afterRender:d.afterRender},b)}}}})();q.b("ko.setTemplateEngine",q.pa);q.b("ko.renderTemplate",q.T);
q.a.r=function(f,c,b){if(b===undefined)return q.a.r(f,c,1)||q.a.r(f,c,10)||q.a.r(f,c,Number.MAX_VALUE);else{f=f||[];c=c||[];for(var d=f,e=c,g=[],h=0;h<=e.length;h++)g[h]=[];h=0;for(var i=Math.min(d.length,b);h<=i;h++)g[0][h]=h;h=1;for(i=Math.min(e.length,b);h<=i;h++)g[h][0]=h;i=d.length;var j,l=e.length;for(h=1;h<=i;h++){var k=Math.min(l,h+b);for(j=Math.max(1,h-b);j<=k;j++)g[j][h]=d[h-1]===e[j-1]?g[j-1][h-1]:Math.min(g[j-1][h]===undefined?Number.MAX_VALUE:g[j-1][h]+1,g[j][h-1]===undefined?Number.MAX_VALUE:
g[j][h-1]+1)}f=f;c=c;b=f.length;d=c.length;e=[];h=g[d][b];if(h===undefined)g=o;else{for(;b>0||d>0;){i=g[d][b];j=d>0?g[d-1][b]:h+1;l=b>0?g[d][b-1]:h+1;k=d>0&&b>0?g[d-1][b-1]:h+1;if(j===undefined||j<i-1)j=h+1;if(l===undefined||l<i-1)l=h+1;if(k<i-1)k=h+1;if(j<=l&&j<k){e.push({status:"added",value:c[d-1]});d--}else{if(l<j&&l<k)e.push({status:"deleted",value:f[b-1]});else{e.push({status:"retained",value:f[b-1]});d--}b--}}g=e.reverse()}return g}};q.b("ko.utils.compareArrays",q.a.r);
(function(){function f(c,b){var d=[];q.m(function(){var e=c(b)||[];d.length>0&&q.a.la(d,e);d.splice(0,d.length);q.a.L(d,e)},o,{disposeWhen:function(){return d.length==0||!q.a.A(d[0])}});return d}q.a.na=function(c,b,d,e){b=b||[];e=e||{};var g=q.a.e.t(c,"setDomNodeChildrenFromArrayMapping_lastMappingResult")===undefined,h=q.a.e.t(c,"setDomNodeChildrenFromArrayMapping_lastMappingResult")||[],i=q.a.K(h,function(s){return s.za}),j=q.a.r(i,b);b=[];var l=0,k=[];i=[];for(var n=o,r=0,w=j.length;r<w;r++)switch(j[r].status){case "retained":var t=
h[l];b.push(t);if(t.B.length>0)n=t.B[t.B.length-1];l++;break;case "deleted":q.a.i(h[l].B,function(s){k.push({element:s,index:r,value:j[r].value});n=s});l++;break;case "added":t=f(d,j[r].value);b.push({za:j[r].value,B:t});for(var v=0,x=t.length;v<x;v++){var u=t[v];i.push({element:u,index:r,value:j[r].value});if(n==o)c.firstChild?c.insertBefore(u,c.firstChild):c.appendChild(u);else n.nextSibling?c.insertBefore(u,n.nextSibling):c.appendChild(u);n=u}}q.a.i(k,function(s){q.a.e.N(s.element)});d=p;if(!g){if(e.afterAdd)for(r=
0;r<i.length;r++)e.afterAdd(i[r].element,i[r].index,i[r].value);if(e.beforeRemove){for(r=0;r<k.length;r++)e.beforeRemove(k[r].element,k[r].index,k[r].value);d=m}}d||q.a.i(k,function(s){s.element.parentNode&&s.element.parentNode.removeChild(s.element)});q.a.e.ma(c,"setDomNodeChildrenFromArrayMapping_lastMappingResult",b)}})();q.b("ko.utils.setDomNodeChildrenFromArrayMapping",q.a.na);
q.R=function(){function f(b){var d=document.getElementById(b);if(d==o)a(Error("Cannot find template with ID="+b));return d}this.u=function(){if(typeof jQuery=="undefined"||!jQuery.tmpl)return 0;if(jQuery.tmpl.tag)return 2;return 1}();var c=RegExp("__ko_apos__","g");this.renderTemplate=function(b,d,e){e=e||{};if(this.u==0)a(Error("jquery.tmpl not detected.\nTo use KO's default template engine, reference jQuery and jquery.tmpl. See Knockout installation documentation for more details."));if(this.u==
1){e='<script type="text/html">'+f(b).text+"<\/script>";d=jQuery.tmpl(e,d)[0].text.replace(c,"'");return jQuery.clean([d],document)}d=[d];b=f(b).text;return jQuery.tmpl(b,d,e.templateOptions)};this.isTemplateRewritten=function(b){return f(b).Pa===m};this.rewriteTemplate=function(b,d){var e=f(b),g=d(e.text);if(this.u==1){g=q.a.l(g);g=g.replace(/([\s\S]*?)(\${[\s\S]*?}|{{[\=a-z][\s\S]*?}}|$)/g,function(h,i,j){return i.replace(/\'/g,"__ko_apos__")+j})}e.text=g;e.Pa=m};this.createJavaScriptEvaluatorBlock=
function(b){if(this.u==1)return"{{= "+b+"}}";return"{{ko_code ((function() { return "+b+" })()) }}"};this.wa=function(b,d){document.write("<script type='text/html' id='"+b+"'>"+d+"<\/script>")};q.h(this,"addTemplate",this.wa);if(this.u>1)jQuery.tmpl.tag.ko_code={open:"_.push($1 || '');"}};q.R.prototype=new q.X;q.pa(new q.R);q.b("ko.jqueryTmplTemplateEngine",q.R);
})(window);                  
