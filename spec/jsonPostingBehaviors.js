describe('JSON posting', {
    'Should stringify and post the supplied data to a supplied URL': function () {
    	var submittedForm;
        ko.utils.postJson('http://example.com/some/url', {myModel : {a : 1}}, undefined, undefined, function(x) { submittedForm = x });
        value_of(submittedForm.action).should_be('http://example.com/some/url');        
        var input = submittedForm.childNodes[0];
        value_of(input.tagName).should_be('INPUT');
        value_of(input.name).should_be('myModel');
        value_of(input.value).should_be('{"a":1}');
    },
    
    'Given an existing form, should take the URL from the form\'s \'action\' attribute': function() {
    	var existingForm = document.createElement("FORM");
    	existingForm.action = 'http://example.com/blah';
    	var submittedForm;
        ko.utils.postJson(existingForm, {myModel : {a : 1}}, undefined, undefined, function(x) { submittedForm = x });
        value_of(submittedForm.action).should_be('http://example.com/blah');            	
    },
    
    'Given an existing form, should include any authenticity tokens from that form': function() {
    	var existingForm = document.createElement("FORM");
    	existingForm.innerHTML = '<input name="someAuthToken" value="myAuthValue"/>';
    	var submittedForm;
        ko.utils.postJson(existingForm, {myModel : {a : 1}}, undefined, ['someAuthToken'], function(x) { submittedForm = x });
        var authTokenSubmittedValue = ko.utils.getFormFieldValue(submittedForm, 'someAuthToken');
        value_of(authTokenSubmittedValue).should_be('myAuthValue');
	}
});