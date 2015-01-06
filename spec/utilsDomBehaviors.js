describe('setTextContent', function () {
    var element;

    beforeEach(function () {
        element = document.createElement('DIV');
    });

    // NOTE: will test innerHTML because <IE8 doesn't have textContent
    it('defaults to empty string', function () {

        ko.utils.setTextContent(element);
        expect(element.innerHTML).toEqual('');
    });

    it('sets text from plain values or observables', function () {

        ko.utils.setTextContent(element, 'test');
        expect(element.innerHTML).toEqual('test');

        ko.utils.setTextContent(element, ko.observable('change'));
        expect(element.innerHTML).toEqual('change');
    });

    it('overwrites existing text', function () {

        element.innerHTML = 'existing';

        ko.utils.setTextContent(element, 'changed');
        expect(element.innerHTML).toEqual('changed');
    });
});
