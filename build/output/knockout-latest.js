// Knockout JavaScript library v1.1.1pre
// (c) 2010 Steven Sanderson - http://knockoutjs.com/
// License: Ms-Pl (http://www.opensource.org/licenses/ms-pl.html)

function a(f){throw f;}var m=true,n=null,p=false,q=window.ko={};q.b=function(f,b){for(var d=f.split("."),c=window,e=0;e<d.length-1;e++)c=c[d[e]];c[d[d.length-1]]=b};q.g=function(f,b,d){f[b]=d};
q.a=new function(){var f=/^(\s|\u00A0)+|(\s|\u00A0)+$/g;return{ca:["authenticity_token",/^__RequestVerificationToken(_.*)?$/],h:function(b,d){for(var c=0,e=b.length;c<e;c++)d(b[c])},i:function(b,d){if(typeof b.indexOf=="function")return b.indexOf(d);for(var c=0,e=b.length;c<e;c++)if(b[c]==d)return c;return-1},ya:function(b,d,c){for(var e=0,g=b.length;e<g;e++)if(d.call(c,b[e]))return b[e];return n},Z:function(b,d){var c=q.a.i(b,d);c>=0&&b.splice(c,1)},Y:function(b){b=b||[];for(var d=[],c=0,e=b.length;c<
e;c++)q.a.i(d,b[c])<0&&d.push(b[c]);return d},K:function(b,d){b=b||[];for(var c=[],e=0,g=b.length;e<g;e++)c.push(d(b[e]));return c},J:function(b,d){b=b||[];for(var c=[],e=0,g=b.length;e<g;e++)d(b[e])&&c.push(b[e]);return c},L:function(b,d){for(var c=0,e=d.length;c<e;c++)b.push(d[c])},ba:function(b){for(;b.firstChild;){q.a.e.M(b.firstChild);b.removeChild(b.firstChild)}},Ta:function(b,d){q.a.ba(b);d&&q.a.h(d,function(c){b.appendChild(c)})},ma:function(b,d){var c=b.nodeType?[b]:b;if(c.length>0){for(var e=
c[0],g=e.parentNode,h=0,i=d.length;h<i;h++)g.insertBefore(d[h],e);h=0;for(i=c.length;h<i;h++){q.a.e.M(c[h]);g.removeChild(c[h])}}},pa:function(b,d){if(navigator.userAgent.indexOf("MSIE 6")>=0)b.setAttribute("selected",d);else b.selected=d},Ka:function(b,d){if(!b||b.nodeType!=1)return[];var c=[];b.getAttribute(d)!==n&&c.push(b);for(var e=b.getElementsByTagName("*"),g=0,h=e.length;g<h;g++)e[g].getAttribute(d)!==n&&c.push(e[g]);return c},m:function(b){return(b||"").replace(f,"")},$a:function(b,d){for(var c=
[],e=(b||"").split(d),g=0,h=e.length;g<h;g++){var i=q.a.m(e[g]);i!==""&&c.push(i)}return c},Ua:function(b,d){b=b||"";if(d.length>b.length)return p;return b.substring(0,d.length)===d},Ha:function(b,d){if(d===undefined)return(new Function("return "+b))();with(d)return eval("("+b+")")},Fa:function(b,d){if(d.compareDocumentPosition)return(d.compareDocumentPosition(b)&16)==16;for(;b!=n;){if(b==d)return m;b=b.parentNode}return p},B:function(b){return q.a.Fa(b,document)},l:function(b,d,c){if(typeof jQuery!=
"undefined")jQuery(b).bind(d,c);else if(typeof b.addEventListener=="function")b.addEventListener(d,c,p);else if(typeof b.attachEvent!="undefined")b.attachEvent("on"+d,function(e){c.call(b,e)});else a(Error("Browser doesn't support addEventListener or attachEvent"))},Xa:function(b,d){if(!(b&&b.nodeType))a(Error("element must be a DOM node when calling triggerEvent"));if(typeof document.createEvent=="function")if(typeof b.dispatchEvent=="function"){var c=document.createEvent(d=="click"?"MouseEvents":
"HTMLEvents");c.initEvent(d,m,m,window,0,0,0,0,0,p,p,p,p,0,b);b.dispatchEvent(c)}else a(Error("The supplied element doesn't support dispatchEvent"));else if(typeof b.fireEvent!="undefined"){if(d=="click")if(b.tagName=="INPUT"&&(b.type.toLowerCase()=="checkbox"||b.type.toLowerCase()=="radio"))b.checked=b.checked!==m;b.fireEvent("on"+d)}else a(Error("Browser doesn't support triggering events"))},d:function(b){return q.P(b)?b():b},Ea:function(b,d){return q.a.i((b.className||"").split(/\s+/),d)>=0},Wa:function(b,
d,c){var e=q.a.Ea(b,d);if(c&&!e)b.className=(b.className||"")+" "+d;else if(e&&!c){c=(b.className||"").split(/\s+/);e="";for(var g=0;g<c.length;g++)if(c[g]!=d)e+=c[g]+" ";b.className=q.a.m(e)}},Qa:function(b,d){b=q.a.d(b);d=q.a.d(d);for(var c=[],e=b;e<=d;e++)c.push(e);return c},ia:function(b){for(var d=[],c=b.length-1;c>=0;c--)d.push(b[c]);return d},O:/MSIE 6/i.test(navigator.userAgent),fa:function(b,d){for(var c=q.a.ia(b.getElementsByTagName("INPUT")).concat(q.a.ia(b.getElementsByTagName("TEXTAREA"))),
e=typeof d=="string"?function(i){return i.name===d}:function(i){return d.test(i.name)},g=[],h=c.length-1;h>=0;h--)e(c[h])&&g.push(c[h]);return g},w:function(b){if(typeof b=="string")if(b=q.a.m(b)){if(window.JSON&&window.JSON.parse)return window.JSON.parse(b);return(new Function("return "+b))()}return n},T:function(b){if(typeof JSON=="undefined"||typeof JSON.stringify=="undefined")a(Error("Cannot find JSON.stringify(). Some browsers (e.g., IE < 8) don't support it natively, but you can overcome this by adding a script reference to json2.js, downloadable from http://www.json.org/json2.js"));
return JSON.stringify(q.a.d(b))},Pa:function(b,d,c){c=c||{};var e=c.params||{},g=c.includeFields||this.ca,h=b;if(typeof b=="object"&&b.tagName=="FORM"){h=b.action;for(var i=g.length-1;i>=0;i--)for(var j=q.a.fa(b,g[i]),k=j.length-1;k>=0;k--)e[j[k].name]=j[k].value}d=q.a.d(d);var l=document.createElement("FORM");l.style.display="none";l.action=h;l.method="post";for(var o in d){b=document.createElement("INPUT");b.name=o;b.value=q.a.T(q.a.d(d[o]));l.appendChild(b)}for(o in e){b=document.createElement("INPUT");
b.name=o;b.value=e[o];l.appendChild(b)}document.body.appendChild(l);c.submitter?c.submitter(l):l.submit();setTimeout(function(){l.parentNode.removeChild(l)},0)},e:{Ya:0,z:"__ko__"+(new Date).getTime(),Za:{},t:function(b,d){var c=q.a.e.ea(b,p);return c===undefined?undefined:c[d]},na:function(b,d,c){q.a.e.ea(b,m)[d]=c},ea:function(b,d){var c=b[q.a.e.z];if(!c){if(!d)return;c=b[q.a.e.z]="ko"+q.a.e.Ya++;q.a.e[c]={}}return q.a.e[c]},$:function(b){var d=b[q.a.e.z];if(d){delete q.a.e[d];b[q.a.e.z]=n}},M:function(b){if(!(b.nodeType!=
1&&b.nodeType!=9)){q.a.e.$(b);b=b.getElementsByTagName("*");for(var d=0,c=b.length;d<c;d++)q.a.e.$(b[d])}}},type:function(b){if(typeof b==="object"&&b.constructor.toString().match(/date/i)!==n)return"date";return typeof b}}};q.b("ko.utils",q.a);q.b("ko.utils.arrayForEach",q.a.h);q.b("ko.utils.arrayFirst",q.a.ya);q.b("ko.utils.arrayFilter",q.a.J);q.b("ko.utils.arrayGetDistinctValues",q.a.Y);q.b("ko.utils.arrayIndexOf",q.a.i);q.b("ko.utils.arrayMap",q.a.K);q.b("ko.utils.arrayPushAll",q.a.L);
q.b("ko.utils.arrayRemoveItem",q.a.Z);q.b("ko.utils.fieldsIncludedWithJsonPost",q.a.ca);q.b("ko.utils.getFormFields",q.a.fa);q.b("ko.utils.postJson",q.a.Pa);q.b("ko.utils.parseJson",q.a.w);q.b("ko.utils.stringifyJson",q.a.T);q.b("ko.utils.range",q.a.Qa);q.b("ko.utils.triggerEvent",q.a.Xa);q.b("ko.utils.type",q.a.type);q.b("ko.utils.unwrapObservable",q.a.d);
Function.prototype.bind||(Function.prototype.bind=function(f){var b=this,d=Array.prototype.slice.call(arguments);f=d.shift();return function(){return b.apply(f,d.concat(Array.prototype.slice.call(arguments)))}});
q.j=function(){function f(){return((1+Math.random())*4294967296|0).toString(16).substring(1)}function b(c,e){if(c)if(c.nodeType==8){var g=q.j.ka(c.nodeValue);g!=n&&e.push({Da:c,Na:g})}else if(c.nodeType==1){g=0;for(var h=c.childNodes,i=h.length;g<i;g++)b(h[g],e)}}var d={};return{R:function(c){if(typeof c!="function")a(Error("You can only pass a function to ko.memoization.memoize()"));var e=f()+f();d[e]=c;return"<!--[ko_memo:"+e+"]--\>"},sa:function(c,e){var g=d[c];if(g===undefined)a(Error("Couldn't find any memo with ID "+
c+". Perhaps it's already been unmemoized."));try{g.apply(n,e||[]);return m}finally{delete d[c]}},ta:function(c,e){var g=[];b(c,g);for(var h=0,i=g.length;h<i;h++){var j=g[h].Da,k=[j];e&&q.a.L(k,e);q.j.sa(g[h].Na,k);j.nodeValue="";j.parentNode&&j.parentNode.removeChild(j)}},ka:function(c){return(c=c.match(/^\[ko_memo\:(.*?)\]$/))?c[1]:n}}}();q.b("ko.memoization",q.j);q.b("ko.memoization.memoize",q.j.R);q.b("ko.memoization.unmemoize",q.j.sa);q.b("ko.memoization.parseMemoText",q.j.ka);
q.b("ko.memoization.unmemoizeDomNodeAndDescendants",q.j.ta);q.Va=function(f,b){this.Aa=f;this.s=b;q.g(this,"dispose",this.s)};q.U=function(){var f=[];this.V=function(b,d){var c=new q.Va(d?function(){b.call(d)}:b,function(){q.a.Z(f,c)});f.push(c);return c};this.v=function(b){q.a.h(f.slice(0),function(d){d&&d.Aa(b)})};this.La=function(){return f.length};q.g(this,"subscribe",this.V);q.g(this,"notifySubscribers",this.v);q.g(this,"getSubscriptionsCount",this.La)};
q.ha=function(f){return typeof f.V=="function"&&typeof f.v=="function"};q.b("ko.subscribable",q.U);q.b("ko.isSubscribable",q.ha);q.A=function(){var f=[];return{za:function(){f.push([])},end:function(){return f.pop()},la:function(b){if(!q.ha(b))a("Only subscribable things can act as dependencies");f.length>0&&f[f.length-1].push(b)}}}();
q.o=function(f){function b(c){if(arguments.length>0){d=c;b.v(d);return this}else{q.A.la(b);return d}}var d=f;b.p=q.o;b.H=function(){b.v(d)};q.U.call(b);q.g(b,"valueHasMutated",b.H);return b};q.P=function(f){if(f===n||f===undefined||f.p===undefined)return p;if(f.p===q.o)return m;return q.P(f.p)};q.D=function(f){return typeof f=="function"&&f.p===q.o};q.b("ko.observable",q.o);q.b("ko.isObservable",q.P);q.b("ko.isWriteableObservable",q.D);
q.ja=function(f){var b=new q.o(f);q.a.h(["pop","push","reverse","shift","sort","splice","unshift"],function(d){b[d]=function(){var c=b();c=c[d].apply(c,arguments);b.H();return c}});q.a.h(["slice"],function(d){b[d]=function(){var c=b();return c[d].apply(c,arguments)}});b.remove=function(d){for(var c=b(),e=[],g=[],h=typeof d=="function"?d:function(l){return l===d},i=0,j=c.length;i<j;i++){var k=c[i];h(k)?g.push(k):e.push(k)}b(e);return g};b.Ra=function(d){if(!d)return[];return b.remove(function(c){return q.a.i(d,
c)>=0})};b.aa=function(d){for(var c=b(),e=typeof d=="function"?d:function(h){return h===d},g=c.length-1;g>=0;g--)if(e(c[g]))c[g]._destroy=m;b.H()};b.Ca=function(d){if(!d)return[];return b.aa(function(c){return q.a.i(d,c)>=0})};b.indexOf=function(d){var c=b();return q.a.i(c,d)};b.replace=function(d,c){var e=b.indexOf(d);if(e>=0){b()[e]=c;b.H()}};q.g(b,"remove",b.remove);q.g(b,"removeAll",b.Ra);q.g(b,"destroy",b.aa);q.g(b,"destroyAll",b.Ca);q.g(b,"indexOf",b.indexOf);return b};
q.b("ko.observableArray",q.ja);
q.n=function(f,b,d){function c(){q.a.h(i,function(l){l.s()});i=[]}function e(l){c();q.a.h(l,function(o){i.push(o.V(g))})}function g(){if(!k&&d&&typeof d.disposeWhen=="function")if(d.disposeWhen()){h.s();return}try{q.A.za();j=b?f.call(b):f()}finally{var l=q.a.Y(q.A.end());e(l)}h.v(j);k=p}function h(){if(arguments.length>0)a("Cannot write a value to a dependentObservable. Do not pass any parameters to it");q.A.la(h);return j}if(typeof f!="function")a("Pass a function that returns the value of the dependentObservable");var i=
[],j,k=m;h.p=q.n;h.Ja=function(){return i.length};h.s=function(){c()};q.U.call(h);g();q.g(h,"dispose",h.s);q.g(h,"getDependenciesCount",h.Ja);return h};q.n.p=q.o;q.b("ko.dependentObservable",q.n);
(function(){function f(c,e){if(c instanceof Array)for(var g=0;g<c.length;g++)e(g);else for(g in c)e(g)}function b(c,e,g,h,i,j){h=h||new d;c=e(c);if(!(q.a.type(c)=="object"&&c!==n&&c!==undefined))return g(c,i);var k=c instanceof Array,l=k?[]:{};i=g(l,i);h.save(c,i);f(c,function(o){var r=e(c[o],j,o);switch(q.a.type(r)){case "boolean":case "number":case "string":case "function":case "date":l[o]=g(r,k);break;case "object":case "undefined":var v=h.t(r);l[o]=v!==undefined?v:b(r,e,g,h,k,o)}});return i}function d(){var c=
[],e=[];this.save=function(g,h){var i=q.a.i(c,g);if(i>=0)e[i]=h;else{c.push(g);e.push(h)}};this.t=function(g){g=q.a.i(c,g);return g>=0?e[g]:undefined}}q.da=function(c,e){if(arguments.length==0)a(Error("When calling ko.fromJS, pass the object you want to convert."));if(e===undefined)e=function(g){return g};return b(c,e,function(g,h){g=q.a.d(g);if(h)return g;if(g instanceof Array)return q.ja(g);if(q.a.type(g)=="object"&&g!==n)return g;return q.o(g)})};q.ra=function(c){if(arguments.length==0)a(Error("When calling ko.toJS, pass the object you want to convert."));
return b(c,function(e){return q.a.d(e)},function(e){return e})};q.Ia=function(c,e){var g=q.a.w(c);return q.da(g,e)};q.toJSON=function(c){c=q.ra(c);return q.a.T(c)}})();q.b("ko.fromJS",q.da);q.b("ko.fromJSON",q.Ia);q.b("ko.toJS",q.ra);q.b("ko.toJSON",q.toJSON);
q.f={k:function(f){if(f.tagName=="OPTION"){var b=f.getAttribute("value");if(b!==q.c.options.F)return b;return q.a.e.t(f,q.c.options.F)}else return f.tagName=="SELECT"?f.selectedIndex>=0?q.f.k(f.options[f.selectedIndex]):undefined:f.value},I:function(f,b){if(f.tagName=="OPTION"){q.a.e.na(f,q.c.options.F,b);f.value=q.c.options.F}else if(f.tagName=="SELECT")for(var d=f.options.length-1;d>=0;d--){if(q.f.k(f.options[d])==b){f.selectedIndex=d;break}}else f.value=b}};q.b("ko.selectExtensions",q.f);
q.b("ko.selectExtensions.readValue",q.f.k);q.b("ko.selectExtensions.writeValue",q.f.I);
q.q=function(){function f(e,g){return e.replace(b,function(h,i){return g[i]})}var b=/\[ko_token_(\d+)\]/g,d=/^[\_$a-z][\_$a-z]*(\[.*?\])*(\.[\_$a-z][\_$a-z]*(\[.*?\])*)*$/i,c=["true","false"];return{w:function(e){e=q.a.m(e);if(e.length<3)return{};for(var g=[],h=n,i,j=e.charAt(0)=="{"?1:0;j<e.length;j++){var k=e.charAt(j);if(h===n)switch(k){case '"':case "'":case "/":h=j;i=k;break;case "{":h=j;i="}";break;case "[":h=j;i="]"}else if(k==i){k=e.substring(h,j+1);g.push(k);var l="[ko_token_"+(g.length-
1)+"]";e=e.substring(0,h)+l+e.substring(j+1);j-=k.length-l.length;h=n}}h={};e=e.split(",");i=0;for(j=e.length;i<j;i++){l=e[i];var o=l.indexOf(":");if(o>0&&o<l.length-1){k=q.a.m(l.substring(0,o));l=q.a.m(l.substring(o+1));if(k.charAt(0)=="{")k=k.substring(1);if(l.charAt(l.length-1)=="}")l=l.substring(0,l.length-1);k=q.a.m(f(k,g));l=q.a.m(f(l,g));h[k]=l}}return h},N:function(e){var g=q.q.w(e),h=[],i;for(i in g){var j=g[i],k;k=j;k=q.a.i(c,q.a.m(k).toLowerCase())>=0?p:k.match(d)!==n;if(k){h.length>0&&
h.push(", ");h.push(i+" : function(__ko_value) { "+j+" = __ko_value; }")}}if(h.length>0)e=e+", '_ko_property_writers' : { "+h.join("")+" } ";return e}}}();q.b("ko.jsonExpressionRewriting",q.q);q.b("ko.jsonExpressionRewriting.parseJson",q.q.w);q.b("ko.jsonExpressionRewriting.insertPropertyAccessorsIntoJson",q.q.N);q.c={};
q.X=function(f,b,d){var c=m;new q.n(function(){var e;if(!(e=typeof b=="function"?b():b)){var g=f.getAttribute("data-bind");try{var h=" { "+q.q.N(g)+" } ";e=q.a.Ha(h,d===n?window:d)}catch(i){a(Error("Unable to parse binding attribute.\nMessage: "+i+";\nAttribute value: "+g))}}e=e;if(c)for(var j in e)q.c[j]&&typeof q.c[j].init=="function"&&(0,q.c[j].init)(f,e[j],e,d);for(j in e)q.c[j]&&typeof q.c[j].update=="function"&&(0,q.c[j].update)(f,e[j],e,d)},n,{disposeWhen:function(){return!q.a.B(f)}});c=p};
q.va=function(f,b){if(b&&b.nodeType==undefined)a(Error("ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node (note: this is a breaking change since KO version 1.05)"));b=b||window.document.body;var d=q.a.Ka(b,"data-bind");q.a.h(d,function(c){q.X(c,n,f)})};q.b("ko.bindingHandlers",q.c);q.b("ko.applyBindings",q.va);
q.c.click={init:function(f,b,d,c){q.a.l(f,"click",function(e){var g;try{g=b.call(c)}finally{if(g!==m)if(e.preventDefault)e.preventDefault();else e.returnValue=p}})}};q.c.submit={init:function(f,b,d,c){if(typeof b!="function")a(Error("The value for a submit binding must be a function to invoke on submit"));q.a.l(f,"submit",function(e){var g;try{g=b.call(c,f)}finally{if(g!==m)if(e.preventDefault)e.preventDefault();else e.returnValue=p}})}};
q.c.visible={update:function(f,b){b=q.a.d(b);var d=f.style.display!="none";if(b&&!d)f.style.display="";else if(!b&&d)f.style.display="none"}};q.c.enable={update:function(f,b){if((b=q.a.d(b))&&f.disabled)f.removeAttribute("disabled");else if(!b&&!f.disabled)f.disabled=m}};q.c.disable={update:function(f,b){q.c.enable.update(f,!q.a.d(b))}};
q.c.value={init:function(f,b,d){var c=d.valueUpdate||"change",e=p;if(q.a.Ua(c,"after")){e=m;c=c.substring(5)}var g=e?function(h){setTimeout(h,0)}:function(h){h()};if(q.D(b))q.a.l(f,c,function(){g(function(){b(q.f.k(this))}.bind(this))});else d._ko_property_writers&&d._ko_property_writers.value&&q.a.l(f,c,function(){g(function(){d._ko_property_writers.value(q.f.k(this))}.bind(this))})},update:function(f,b){var d=q.a.d(b);if(d!=q.f.k(f)){var c=function(){q.f.I(f,d)};c();f.tagName=="SELECT"&&setTimeout(c,
0)}}};
q.c.options={update:function(f,b,d){if(f.tagName!="SELECT")a(Error("options binding applies only to SELECT elements"));var c=q.a.K(q.a.J(f.childNodes,function(j){return j.tagName&&j.tagName=="OPTION"&&j.selected}),function(j){return q.f.k(j)||j.innerText||j.textContent});b=q.a.d(b);q.a.ba(f);if(b){if(typeof b.length!="number")b=[b];if(d.optionsCaption){var e=document.createElement("OPTION");e.innerHTML=d.optionsCaption;q.f.I(e,undefined);f.appendChild(e)}for(var g=0,h=b.length;g<h;g++){e=document.createElement("OPTION");var i=
typeof d.optionsValue=="string"?b[g][d.optionsValue]:b[g];if(typeof i=="object")q.f.I(e,i);else e.value=i.toString();e.innerHTML=(typeof d.optionsText=="string"?b[g][d.optionsText]:i).toString();f.appendChild(e)}f=f.getElementsByTagName("OPTION");g=b=0;for(h=f.length;g<h;g++)if(q.a.i(c,q.f.k(f[g]))>=0){q.a.pa(f[g],m);b++}}}};q.c.options.F="__ko.bindingHandlers.options.optionValueDomData__";
q.c.selectedOptions={ga:function(f){var b=[];f=f.childNodes;for(var d=0,c=f.length;d<c;d++){var e=f[d];e.tagName=="OPTION"&&e.selected&&b.push(q.f.k(e))}return b},init:function(f,b,d){if(q.D(b))q.a.l(f,"change",function(){b(q.c.selectedOptions.ga(this))});else d._ko_property_writers&&d._ko_property_writers.value&&q.a.l(f,"change",function(){d._ko_property_writers.value(q.c.selectedOptions.ga(this))})},update:function(f,b){if(f.tagName!="SELECT")a(Error("values binding applies only to SELECT elements"));
var d=q.a.d(b);if(d&&typeof d.length=="number")for(var c=f.childNodes,e=0,g=c.length;e<g;e++){var h=c[e];h.tagName=="OPTION"&&q.a.pa(h,q.a.i(d,q.f.k(h))>=0)}}};q.c.text={update:function(f,b){b=q.a.d(b);typeof f.innerText=="string"?f.innerText=b:f.textContent=b}};q.c.css={update:function(f,b){b=b||{};for(var d in b)if(typeof d=="string"){var c=q.a.d(b[d]);q.a.Wa(f,d,c)}}};q.c.style={update:function(f,b){b=q.a.d(b||{});for(var d in b)if(typeof d=="string"){var c=q.a.d(b[d]);f.style[d]=c||""}}};
q.c.uniqueName={init:function(f,b){if(b){f.name="ko_unique_"+ ++q.c.uniqueName.Ba;q.a.O&&f.mergeAttributes(document.createElement("<INPUT name='"+f.name+"'/>"),p)}}};q.c.uniqueName.Ba=0;
q.c.checked={init:function(f,b,d){if(q.D(b)){var c;if(f.type=="checkbox")c=function(){b(this.checked)};else if(f.type=="radio")c=function(){this.checked&&b(this.value)};if(c){q.a.l(f,"change",c);q.a.l(f,"click",c)}}else if(d._ko_property_writers&&d._ko_property_writers.checked){if(f.type=="checkbox")c=function(){d._ko_property_writers.checked(this.checked)};else if(f.type=="radio")c=function(){this.checked&&d._ko_property_writers.checked(this.value)};if(c){q.a.l(f,"change",c);q.a.l(f,"click",c)}}f.type==
"radio"&&!f.name&&q.c.uniqueName.init(f,m)},update:function(f,b){b=q.a.d(b);if(f.type=="checkbox")(f.checked=b)&&q.a.O&&f.mergeAttributes(document.createElement("<INPUT type='checkbox' checked='checked' />"),p);else if(f.type=="radio"){f.checked=f.value==b;f.value==b&&q.a.O&&f.mergeAttributes(document.createElement("<INPUT type='radio' checked='checked' />"),p)}}};
q.W=function(){this.renderTemplate=function(){a("Override renderTemplate in your ko.templateEngine subclass")};this.isTemplateRewritten=function(){a("Override isTemplateRewritten in your ko.templateEngine subclass")};this.rewriteTemplate=function(){a("Override rewriteTemplate in your ko.templateEngine subclass")};this.createJavaScriptEvaluatorBlock=function(){a("Override createJavaScriptEvaluatorBlock in your ko.templateEngine subclass")}};q.b("ko.templateEngine",q.W);
q.G=function(){var f=/(<[a-z]+(\s+(?!data-bind=)[a-z0-9]+(=(\"[^\"]*\"|\'[^\']*\'))?)*\s+)data-bind=(["'])(.*?)\5/g;return{Ga:function(b,d){d.isTemplateRewritten(b)||d.rewriteTemplate(b,function(c){return q.G.Oa(c,d)})},Oa:function(b,d){return b.replace(f,function(c,e,g,h,i,j,k){c=k;c=q.q.N(c);return d.createJavaScriptEvaluatorBlock("ko.templateRewriting.applyMemoizedBindingsToNextSibling(function() {                     return (function() { return { "+c+" } })()                 })")+e})},wa:function(b){return q.j.R(function(d,
c){d.nextSibling&&q.X(d.nextSibling,b,c)})}}}();q.b("ko.templateRewriting",q.G);q.b("ko.templateRewriting.applyMemoizedBindingsToNextSibling",q.G.wa);
(function(){function f(d,c,e,g,h){var i=q.a.d(g);h=h||{};var j=h.templateEngine||b;q.G.Ga(e,j);e=j.renderTemplate(e,i,h);if(typeof e.length!="number"||e.length>0&&typeof e[0].nodeType!="number")a("Template engine must return an array of DOM nodes");e&&q.a.h(e,function(k){q.j.ta(k,[g])});switch(c){case "replaceChildren":q.a.Ta(d,e);break;case "replaceNode":q.a.ma(d,e);break;case "ignoreTargetNode":break;default:a(Error("Unknown renderMode: "+c))}return e}var b;q.qa=function(d){if(d!=undefined&&!(d instanceof
q.W))a("templateEngine must inherit from ko.templateEngine");b=d};q.S=function(d,c,e,g,h){e=e||{};if((e.templateEngine||b)==undefined)a("Set a template engine before calling renderTemplate");h=h||"replaceChildren";if(g){var i=g.nodeType?g:g.length>0?g[0]:n;return new q.n(function(){var j=f(g,h,d,c,e);if(h=="replaceNode"){g=j;i=g.nodeType?g:g.length>0?g[0]:n}},n,{disposeWhen:function(){return!i||!q.a.B(i)}})}else return q.j.R(function(j){q.S(d,c,e,j,"replaceNode")})};q.Sa=function(d,c,e,g){new q.n(function(){var h=
q.a.d(c)||[];if(typeof h.length=="undefined")h=[h];h=q.a.J(h,function(i){return e.includeDestroyed||!i._destroy});q.a.oa(g,h,function(i){return f(n,"ignoreTargetNode",d,i,e)},e)},n,{disposeWhen:function(){return!q.a.B(g)}})};q.c.template={update:function(d,c,e,g){e=typeof c=="string"?c:c.name;if(typeof c.foreach!="undefined")q.Sa(e,c.foreach||[],{afterAdd:c.afterAdd,beforeRemove:c.beforeRemove,includeDestroyed:c.includeDestroyed},d);else{c=c.data;q.S(e,typeof c=="undefined"?g:c,n,d)}}}})();
q.b("ko.setTemplateEngine",q.qa);q.b("ko.renderTemplate",q.S);
q.a.r=function(f,b,d){if(d===undefined)return q.a.r(f,b,1)||q.a.r(f,b,10)||q.a.r(f,b,Number.MAX_VALUE);else{f=f||[];b=b||[];for(var c=f,e=b,g=[],h=0;h<=e.length;h++)g[h]=[];h=0;for(var i=Math.min(c.length,d);h<=i;h++)g[0][h]=h;h=1;for(i=Math.min(e.length,d);h<=i;h++)g[h][0]=h;i=c.length;var j,k=e.length;for(h=1;h<=i;h++){var l=Math.min(k,h+d);for(j=Math.max(1,h-d);j<=l;j++)g[j][h]=c[h-1]===e[j-1]?g[j-1][h-1]:Math.min(g[j-1][h]===undefined?Number.MAX_VALUE:g[j-1][h]+1,g[j][h-1]===undefined?Number.MAX_VALUE:
g[j][h-1]+1)}f=f;b=b;d=f.length;c=b.length;e=[];h=g[c][d];if(h===undefined)g=n;else{for(;d>0||c>0;){i=g[c][d];j=c>0?g[c-1][d]:h+1;k=d>0?g[c][d-1]:h+1;l=c>0&&d>0?g[c-1][d-1]:h+1;if(j===undefined||j<i-1)j=h+1;if(k===undefined||k<i-1)k=h+1;if(l<i-1)l=h+1;if(j<=k&&j<l){e.push({status:"added",value:b[c-1]});c--}else{if(k<j&&k<l)e.push({status:"deleted",value:f[d-1]});else{e.push({status:"retained",value:f[d-1]});c--}d--}}g=e.reverse()}return g}};q.b("ko.utils.compareArrays",q.a.r);
(function(){function f(b,d){var c=[];q.n(function(){var e=b(d)||[];c.length>0&&q.a.ma(c,e);c.splice(0,c.length);q.a.L(c,e)},n,{disposeWhen:function(){return c.length==0||!q.a.B(c[0])}});return c}q.a.oa=function(b,d,c,e){d=d||[];e=e||{};var g=q.a.e.t(b,"setDomNodeChildrenFromArrayMapping_lastMappingResult")===undefined,h=q.a.e.t(b,"setDomNodeChildrenFromArrayMapping_lastMappingResult")||[],i=q.a.K(h,function(s){return s.xa}),j=q.a.r(i,d);d=[];var k=0,l=[];i=[];for(var o=n,r=0,v=j.length;r<v;r++)switch(j[r].status){case "retained":var t=
h[k];d.push(t);if(t.C.length>0)o=t.C[t.C.length-1];k++;break;case "deleted":q.a.h(h[k].C,function(s){l.push({element:s,index:r,value:j[r].value});o=s});k++;break;case "added":t=f(c,j[r].value);d.push({xa:j[r].value,C:t});for(var w=0,x=t.length;w<x;w++){var u=t[w];i.push({element:u,index:r,value:j[r].value});if(o==n)b.firstChild?b.insertBefore(u,b.firstChild):b.appendChild(u);else o.nextSibling?b.insertBefore(u,o.nextSibling):b.appendChild(u);o=u}}q.a.h(l,function(s){q.a.e.M(s.element)});c=p;if(!g){e.afterAdd&&
e.afterAdd(i.element,i.index,i.value);if(e.beforeRemove){e.beforeRemove(l.element,l.index,l.value);c=m}}c||q.a.h(l,function(s){s.element.parentNode&&s.element.parentNode.removeChild(s.element)});q.a.e.na(b,"setDomNodeChildrenFromArrayMapping_lastMappingResult",d)}})();q.b("ko.utils.setDomNodeChildrenFromArrayMapping",q.a.oa);
q.Q=function(){function f(d){var c=document.getElementById(d);if(c==n)a(Error("Cannot find template with ID="+d));return c}this.u=function(){if(typeof jQuery=="undefined"||!jQuery.tmpl)return 0;if(jQuery.tmpl.tag)return 2;return 1}();var b=RegExp("__ko_apos__","g");this.renderTemplate=function(d,c){if(this.u==0)a(Error("jquery.tmpl not detected.\nTo use KO's default template engine, reference jQuery and jquery.tmpl. See Knockout installation documentation for more details."));if(this.u==1){var e=
'<script type="text/html">'+f(d).text+"<\/script>";e=jQuery.tmpl(e,c)[0].text.replace(b,"'");return jQuery.clean([e],document)}c=[c];e=f(d).text;return jQuery.tmpl(e,c)};this.isTemplateRewritten=function(d){return f(d).Ma===m};this.rewriteTemplate=function(d,c){var e=f(d),g=c(e.text);if(this.u==1){g=q.a.m(g);g=g.replace(/([\s\S]*?)(\${[\s\S]*?}|{{[\=a-z][\s\S]*?}}|$)/g,function(h,i,j){return i.replace(/\'/g,"__ko_apos__")+j})}e.text=g;e.Ma=m};this.createJavaScriptEvaluatorBlock=function(d){if(this.u==
1)return"{{= "+d+"}}";return"{{ko_code ((function() { return "+d+" })()) }}"};this.ua=function(d,c){document.write("<script type='text/html' id='"+d+"'>"+c+"<\/script>")};q.g(this,"addTemplate",this.ua);if(this.u>1)jQuery.tmpl.tag.ko_code={open:"_.push($1 || '');"}};q.Q.prototype=new q.W;q.qa(new q.Q);q.b("ko.jqueryTmplTemplateEngine",q.Q);
