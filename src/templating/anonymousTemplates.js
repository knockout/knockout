(function() {
	var anonymousTemplatesDomDataKey = "__ko_anon_template__";
	
	ko.anonymousTemplates = {
		read: function(element) {
			return ko.utils.domData.get(element, anonymousTemplatesDomDataKey);
		},
		write: function(element, templateValue) {
			ko.utils.domData.set(element, anonymousTemplatesDomDataKey, templateValue);
		}
	};
	ko.exportSymbol('ko.anonymousTemplates.read', ko.anonymousTemplates.read);
	ko.exportSymbol('ko.anonymousTemplates.write', ko.anonymousTemplates.write);	
})();
