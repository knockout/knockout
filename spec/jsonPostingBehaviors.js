describe('JSON posting', {
    'Should stringify and post the supplied data to a supplied URL': function () {
    	var submittedForm;
        ko.utils.postJson('http://example.com/some/url', {myModel : {a : 1}}, { submitter : function(x) { submittedForm = x } });

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
        ko.utils.postJson(existingForm, {myModel : {a : 1}}, { submitter : function(x) { submittedForm = x } });

        value_of(submittedForm.action).should_be('http://example.com/blah');
    },

    'Given an existing form, should include any requested field values from that form': function() {
    	var existingForm = document.createElement("FORM");
    	existingForm.innerHTML = '<input name="someField" value="myValue"/><input name="anotherField" value="unwantedValue"/>';

    	var submittedForm;
        ko.utils.postJson(existingForm, {myModel : {a : 1}}, { includeFields : ['someField'], submitter : function(x) { submittedForm = x } });

        value_of(ko.utils.getFormFields(submittedForm, 'someField')[0].value).should_be('myValue');
        value_of(ko.utils.getFormFields(submittedForm, 'anotherField').length).should_be(0);
	},

	'Given an existing form, should include Rails and ASP.NET MVC auth tokens by default' : function() {
    	var existingForm = document.createElement("FORM");
    	existingForm.innerHTML = '<input name="__RequestVerificationToken_Lr4e" value="wantedval1"/>'
    						   + '<input name="__RequestVe" value="unwantedval"/>'
    						   + '<input name="authenticity_token" value="wantedval2"/>';

    	var submittedForm;
        ko.utils.postJson(existingForm, {myModel : {a : 1}}, { submitter : function(x) { submittedForm = x } });

        value_of(ko.utils.getFormFields(submittedForm, '__RequestVerificationToken_Lr4e')[0].value).should_be('wantedval1');
        value_of(ko.utils.getFormFields(submittedForm, '__RequestVe').length).should_be(0);
        value_of(ko.utils.getFormFields(submittedForm, 'authenticity_token')[0].value).should_be('wantedval2');
	}
});
