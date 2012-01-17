(function() { 
    // A template source represents a read/write way of accessing a template. This is to eliminate the need for template loading/saving
    // logic to be duplicated in every template engine (and means they can all work with anonymous templates, etc.)
    //
    // Two are provided by default:
    //  1. ko.templateSources.domElement       - reads/writes the text content of an arbitrary DOM element
    //  2. ko.templateSources.anonymousElement - uses ko.utils.domData to read/write text *associated* with the DOM element, but 
    //                                           without reading/writing the actual element text content, since it will be overwritten
    //                                           with the rendered template output.
    // You can implement your own template source if you want to fetch/store templates somewhere other than in DOM elements.
    // Template sources need to have the following functions:
    //   text() 			- returns the template text from your storage location
    //   text(value)		- writes the supplied template text to your storage location
    //   data(key)			- reads values stored using data(key, value) - see below
    //   data(key, value)	- associates "value" with this template and the key "key". Is used to store information like "isRewritten".
    //
    // Optionally, template sources can also have the following functions:
    //   fragment()         - returns a DOM fragment representing this template, where available
    //   fragment(value)    - writes the given DOM fragment to your storage location
    // If a DOM fragment is available for a given template source, template engines are encouraged to use it in preference over text()
    // for improved speed. However, all templateSources must supply text() even if they don't supply fragment().
    //
    // Once you've implemented a templateSource, make your template engine use it by subclassing whatever template engine you were
    // using and overriding "makeTemplateSource" to return an instance of your custom template source.
    
    ko.templateSources = {};
    
    // ---- ko.templateSources.domElement -----
    
    ko.templateSources.domElement = function(element) {
        this.domElement = element;
    }
    
    ko.templateSources.domElement.prototype['text'] = function(/* valueToWrite */) {
        if (arguments.length == 0) {
            return this.domElement.tagName.toLowerCase() == "script" ? this.domElement.text : this.domElement.innerHTML;
        } else {
            var valueToWrite = arguments[0];
            if (this.domElement.tagName.toLowerCase() == "script")
                this.domElement.text = valueToWrite;
            else
                ko.utils.setHtml(this.domElement, valueToWrite);
        }
    };
    
    ko.templateSources.domElement.prototype['data'] = function(key /*, valueToWrite */) {
        if (arguments.length === 1) {
            return ko.utils.domData.get(this.domElement, "templateSourceData_" + key);
        } else {
            ko.utils.domData.set(this.domElement, "templateSourceData_" + key, arguments[1]);
        }
    };
    
    // ---- ko.templateSources.anonymousTemplate -----
    // To optimise the document fragment case, the underlying storage is a document fragment
    // However, for compatibility, you can also read/write "text" - it will be parsed/serialized to/from the underlying storage on demand
    // Since there is only one underlying storage location, there is no possibility of text/fragment inconsistency

    var anonymousTemplatesDomDataKey = "__ko_anon_template__",
        anonymousTemplatesTextCacheDomDataKey = "__ko_anon_template_text__";
    ko.templateSources.anonymousTemplate = function(element) {		
        this.domElement = element;
    }
    ko.templateSources.anonymousTemplate.prototype = new ko.templateSources.domElement();
    ko.templateSources.anonymousTemplate.prototype['text'] = function(/* valueToWrite */) {
        if (arguments.length == 0) {
            // For speed, the serialized text is cached (and invalidated when you write to fragment)
            var cachedText = ko.utils.domData.get(this.domElement, anonymousTemplatesTextCacheDomDataKey);
            if (cachedText === undefined) {
                var dummyContainer = document.createElement('div'),
                    frag = this['fragment']();
                if (frag)
                    dummyContainer.appendChild(frag);
                cachedText = dummyContainer.innerHTML;
                this['text'](cachedText); // Calling .appendChild above empties the doc frag; this line recreates it
            }
            return cachedText;
        } else {
            var valueToWrite = arguments[0],
                parsedElements = ko.utils.parseHtmlFragment(valueToWrite),
                frag = ko.utils.moveNodesToDocumentFragment(parsedElements);
            this['fragment'](frag);
            ko.utils.domData.set(this.domElement, anonymousTemplatesTextCacheDomDataKey, valueToWrite);
        }
    };
    ko.templateSources.domElement.prototype['fragment'] = function(/* valueToWrite */) {
        if (arguments.length == 0) {
            return ko.utils.domData.get(this.domElement, anonymousTemplatesDomDataKey);
        } else {
            var valueToWrite = arguments[0];
            ko.utils.domData.set(this.domElement, anonymousTemplatesDomDataKey, valueToWrite);
            ko.utils.domData.set(this.domElement, anonymousTemplatesTextCacheDomDataKey, undefined);
        }
    };
    
    ko.exportSymbol('templateSources', ko.templateSources);
    ko.exportSymbol('templateSources.domElement', ko.templateSources.domElement);
    ko.exportSymbol('templateSources.anonymousTemplate', ko.templateSources.anonymousTemplate);
})();