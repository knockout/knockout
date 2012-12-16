var startingTextDomDataKey = '__ko_startingText';
ko.bindingHandlers['text'] = {
	init: function(element, valueAccessor) {
		//cache any starting text
		var firstChild = ko.virtualElements.firstChild(element);
		if (!firstChild)
			return;
		var startingText = ko.virtualElements.firstChild(element).data;
		if(startingText)
			element[startingTextDomDataKey] = startingText;
	},
	update: function(element, valueAccessor) {
		var value = ko.utils.unwrapObservable(valueAccessor());
		//if the binding is not an array, replace the contents
		if(toString.call(value) !== '[object Array]')
			return ko.utils.setTextContent(element, value);

		//if it is an array then apply interpolation
		var args = [];
		for(var arg in value) {
			args.push(ko.utils.unwrapObservable(value[arg]));
		}
	
		var formattedText = element[startingTextDomDataKey].replace(/{(\d+)}/g, function(match, number) {
			if (args[number] === void 0) {
				return match;
			} else {
				return args[number];
			}
		});
		ko.utils.setTextContent(element, formattedText);
	}
};

ko.virtualElements.allowedBindings['text'] = true;