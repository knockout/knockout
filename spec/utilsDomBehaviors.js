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

describe('registerEventHandler', function() {
    it ('should not use jQuery eventing with preferJQueryEvents option set to false', function() {
        var jQueryLoaded = (typeof jQuery !== 'undefined');
        var element = document.createElement('DIV');
        var eventFired = false;
        var jQueryUsed = false;

        // Set the option to true.
        ko.options.preferJQueryEvents = false;

        // If jQuery is present, verify jQuery is not used in event binding.
        if (jQueryLoaded) {
            ko.utils.registerEventHandler(element, 'click', function(eventArgs) {
                eventFired = true;
                jQueryUsed = !!eventArgs.originalEvent;
            });
        }

        // Trigger the event.
        ko.utils.triggerEvent(element, 'click');

        // Reset the option.
        ko.options.preferJQueryEvents = true;

        expect(!jQueryLoaded || (eventFired && !jQueryUsed)).toBe(true);
    });
});
