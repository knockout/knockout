/*
 * jQuery Templating Plugin
 *   NOTE: Created for demonstration purposes.
 * Copyright 2010, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
(function(jQuery){
	// Override the DOM manipulation function
	var oldManip = jQuery.fn.domManip,
		htmlExpr = /^[^<]*(<[\w\W]+>)[^>]*$/;
	
	jQuery.fn.extend({
		render: function( data, options ) {
			return this.map(function(i, tmpl){
				return jQuery.render( tmpl, data, options );
			});
		},
		
		// This will allow us to do: .append( "template", dataObject )
		domManip: function( args ) {
			// This appears to be a bug in the appendTo, etc. implementation
			// it should be doing .call() instead of .apply(). See #6227
			if ( args.length > 1 && args[0].nodeType ) {
				arguments[0] = [ jQuery.makeArray(args) ];
			}

			if ( args.length >= 2 && typeof args[0] === "string" && typeof args[1] !== "string" ) {
				arguments[0] = [ jQuery.render( args[0], args[1], args[2] ) ];
			}
			
			return oldManip.apply( this, arguments );
		}
	});
	
	jQuery.extend({
		render: function( tmpl, data, options ) {
			var fn, node;
			
			if ( typeof tmpl === "string" ) {
				// Use a pre-defined template, if available
				fn = jQuery.templates[ tmpl ];
				if ( !fn && !htmlExpr.test( tmpl ) ) {
					// it is a selector
					node = jQuery( tmpl ).get( 0 );
				}
				else {
					fn = jQuery.tmpl( tmpl );
				}
			} else if ( tmpl instanceof jQuery ) {
				node = tmpl.get( 0 );
			} else if ( tmpl.nodeType ) {
				node = tmpl;
			}
			
			if ( !fn && node ) {
				var elemData = jQuery.data( node );
				fn = elemData.tmpl || (elemData.tmpl = jQuery.tmpl( node.innerHTML ));
			}
			
			// We assume that if the template string is being passed directly
			// in the user doesn't want it cached. They can stick it in
			// jQuery.templates to cache it.
			
			var context = {
				data: data,
				index: 0,
				dataItem: data,
				options: options || {}
			};

			if ( jQuery.isArray( data ) ) {
				return jQuery.map( data, function( data, i ) {
					context.index = i;
					context.dataItem = data;
					return fn.call( data, jQuery, context );
				});

			} else {
				return fn.call( data, jQuery, context );
			}
		},
		
		// You can stick pre-built template functions here
		templates: {},

		/*
		 * For example, someone could do:
		 *   jQuery.templates.foo = jQuery.tmpl("some long templating string");
		 *   $("#test").append("foo", data);
		 */

		tmplcmd: {
			"each": {
				_default: [ null, "$i" ],
				prefix: "jQuery.each($1,function($2){with(this){",
				suffix: "}});"
			},
			"if": {
				prefix: "if($1){",
				suffix: "}"
			},
			"else": {
				prefix: "}else{"
			},
			"html": {
				prefix: "_.push(typeof ($1)==='function'?($1).call(this):$1);"
			},
			"=": {
				_default: [ "this" ],
				prefix: "_.push($.encode(typeof ($1)==='function'?($1).call(this):$1));"
			}
		},

		encode: function( text ) {
			return text != null ? document.createTextNode( text.toString() ).nodeValue : "";
		},

		tmpl: function(str, data, i, options) {
			// Generate a reusable function that will serve as a template
			// generator (and which will be cached).
			
			var fn = new Function("jQuery","$context",
				"var $=jQuery,$data=$context.dataItem,$i=$context.index,_=[];_.data=$data;_.index=$i;" +

				// Introduce the data as local variables using with(){}
				"with($data){_.push('" +

				// Convert the template into pure JavaScript
				str
					.replace(/[\r\t\n]/g, " ")
					.replace(/\${([^}]*)}/g, "{{= $1}}")
					.replace(/{{(\/?)(\w+|.)(?:\((.*?)\))?(?: (.*?))?}}/g, function(all, slash, type, fnargs, args) {
						var tmpl = jQuery.tmplcmd[ type ];

						if ( !tmpl ) {
							throw "Template not found: " + type;
						}

						var def = tmpl._default;

						return "');" + tmpl[slash ? "suffix" : "prefix"]
							.split("$1").join(args || (def ? def[0] : ""))
							.split("$2").join(fnargs || (def ? def[1] : "")) + "_.push('";
					})
				+ "');};return $(_.join('')).get();");
				
			// Provide some basic currying to the user
			// TODO: When currying, the fact that only the dataItem and index are passed
			// in means we cannot know the value of 'data' although we know 'dataItem' and 'index'
			// If this api took the array and index, we could know all 3 values.
			// e.g. instead of this:
			//  tmpl(tmpl, foo[i], i) // foo[i] passed in is the dataItem
			// this:
			//  tmpl(tmpl, foo, i) // foo[i] used internally to get dataItem
			// If you intend data to be as is,
			//  tmpl(tmpl, foo) or tmpl(tmpl, foo, null, options)			
			return data ? fn.call( this, jQuery, { data: null, dataItem: data, index: i, options: options } ) : fn;
		}
	});
})(jQuery);
