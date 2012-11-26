describe('JSON posting', function() {
    it('Should stringify and post the supplied data to a supplied URL', function () {
    	var submittedForm;
        ko.utils.postJson('http://example.com/some/url', {myModel : {a : 1}}, { submitter : function(x) { submittedForm = x } });

        expect(submittedForm.action).toEqual('http://example.com/some/url');
        var input = submittedForm.childNodes[0];
        expect(input.tagName).toEqual('INPUT');
        expect(input.name).toEqual('myModel');
        expect(input.value).toEqual('{"a":1}');
    });

    it('Given an existing form, should take the URL from the form\'s \'action\' attribute', function() {
    	var existingForm = document.createElement("FORM");
    	existingForm.action = 'http://example.com/blah';

    	var submittedForm;
        ko.utils.postJson(existingForm, {myModel : {a : 1}}, { submitter : function(x) { submittedForm = x } });

        expect(submittedForm.action).toEqual('http://example.com/blah');
    });

    it('Given an existing form, should include any requested field values from that form', function() {
    	var existingForm = document.createElement("FORM");
    	existingForm.innerHTML = '<input name="someField" value="myValue"/><input name="anotherField" value="unwantedValue"/>';

    	var submittedForm;
        ko.utils.postJson(existingForm, {myModel : {a : 1}}, { includeFields : ['someField'], submitter : function(x) { submittedForm = x } });

        expect(ko.utils.getFormFields(submittedForm, 'someField')[0].value).toEqual('myValue');
        expect(ko.utils.getFormFields(submittedForm, 'anotherField').length).toEqual(0);
	});

	it('Given an existing form, should include Rails and ASP.NET MVC auth tokens by default', function() {
    	var existingForm = document.createElement("FORM");
    	existingForm.innerHTML = '<input name="__RequestVerificationToken_Lr4e" value="wantedval1"/>'
    						   + '<input name="__RequestVe" value="unwantedval"/>'
    						   + '<input name="authenticity_token" value="wantedval2"/>';

    	var submittedForm;
        ko.utils.postJson(existingForm, {myModel : {a : 1}}, { submitter : function(x) { submittedForm = x } });

        expect(ko.utils.getFormFields(submittedForm, '__RequestVerificationToken_Lr4e')[0].value).toEqual('wantedval1');
        expect(ko.utils.getFormFields(submittedForm, '__RequestVe').length).toEqual(0);
        expect(ko.utils.getFormFields(submittedForm, 'authenticity_token')[0].value).toEqual('wantedval2');
	});
});
