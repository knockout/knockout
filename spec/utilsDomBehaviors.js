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
    beforeEach(jasmine.prepareTestNode);

    it ('if jQuery is referenced, should use jQuery eventing with useOnlyNativeEvents option set to false', function() {
        if (typeof jQuery === 'undefined') {
            return; // Nothing to test. Run the specs with jQuery referenced for this to do anything.
        }

        this.restoreAfter(ko.options, 'useOnlyNativeEvents');

        var element = document.createElement('button');
        var eventFired = false;
        var jQueryModified = false;

        testNode.appendChild(element);

        // Set the option to true.
        ko.options.useOnlyNativeEvents = false;

        // Verify jQuery is used in event binding.
        ko.utils.registerEventHandler(element, 'click', function(eventArgs) {
            eventFired = true;
            jQueryModified = !!eventArgs.originalEvent;
        });

        // Trigger the event natively (jQuery intercepts and creates new event object, which we can test)
        element.click();
        expect(eventFired && jQueryModified).toBe(true);

        // Also trigger an event through ko.utils.triggerEvent to show that it creates a jQuery event directly
        eventFired = jQueryModified = false;
        ko.utils.triggerEvent(element, 'click');
        expect(eventFired && !jQueryModified).toBe(true);
    });

    it ('should not use jQuery eventing with useOnlyNativeEvents option set to true', function() {
        this.restoreAfter(ko.options, 'useOnlyNativeEvents');

        var element = document.createElement('button');
        var eventFired = false;
        var jQueryModified = false;

        testNode.appendChild(element);

        // Set the option to true.
        ko.options.useOnlyNativeEvents = true;

        // Verify jQuery is not used in event binding.
        ko.utils.registerEventHandler(element, 'click', function(eventArgs) {
            eventFired = true;
            jQueryModified = !!eventArgs.originalEvent;
        });

        // Trigger the event natively
        element.click();
        expect(eventFired && !jQueryModified).toBe(true);

        // Also trigger an event through ko.utils.triggerEvent to show that it triggers a native event
        eventFired = jQueryModified = false;
        ko.utils.triggerEvent(element, 'click');
        expect(eventFired && !jQueryModified).toBe(true);
    });
});

describe('cloneNodes', function () {
    beforeEach(jasmine.prepareTestNode);

    it ('should return clones', function() {
        var newNodes = ko.utils.cloneNodes([testNode]);
        var isClone = testNode.isSameNode ? !testNode.isSameNode(newNodes[0]) && testNode.isEqualNode(newNodes[0]) : testNode !== newNodes[0];
        expect(isClone).toBe(true);
    });

    it ('should clone deeply', function() {
        var child = document.createElement('DIV');
        testNode.appendChild(child);

        var newNodes = ko.utils.cloneNodes([testNode]);
        var newChild = newNodes[0].childNodes[0];

        var childIsClone = child.isSameNode ? !child.isSameNode(newChild) && child.isEqualNode(newChild) : child !== newChild;

        expect(childIsClone).toBe(true);
    });
});
