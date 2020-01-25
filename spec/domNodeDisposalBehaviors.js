
describe('DOM node disposal', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should run registered disposal callbacks when a node is cleaned', function () {
        var didRun = false;
        ko.utils.domNodeDisposal.addDisposeCallback(testNode, function() { didRun = true });

        expect(didRun).toEqual(false);
        ko.cleanNode(testNode);
        expect(didRun).toEqual(true);
    });

    it('Should run registered disposal callbacks on descendants when a node is cleaned', function () {
        var didRun = false;
        var childNode = document.createElement("DIV");
        var grandChildNode = document.createElement("DIV");
        testNode.appendChild(childNode);
        childNode.appendChild(grandChildNode);
        ko.utils.domNodeDisposal.addDisposeCallback(grandChildNode, function() { didRun = true });

        expect(didRun).toEqual(false);
        ko.cleanNode(testNode);
        expect(didRun).toEqual(true);
    });

    it('Should run registered disposal callbacks and detach from DOM when a node is removed', function () {
        var didRun = false;
        var childNode = document.createElement("DIV");
        testNode.appendChild(childNode);
        ko.utils.domNodeDisposal.addDisposeCallback(childNode, function() { didRun = true });

        expect(didRun).toEqual(false);
        expect(testNode.childNodes.length).toEqual(1);
        ko.removeNode(childNode);
        expect(didRun).toEqual(true);
        expect(testNode.childNodes.length).toEqual(0);
    });

    it('Should be able to remove previously-registered disposal callbacks', function() {
        var didRun = false;
        var callback = function() { didRun = true };
        ko.utils.domNodeDisposal.addDisposeCallback(testNode, callback);

        expect(didRun).toEqual(false);
        ko.utils.domNodeDisposal.removeDisposeCallback(testNode, callback);
        ko.cleanNode(testNode);
        expect(didRun).toEqual(false); // Didn't run only because we removed it
    });

    it('Should not clean descendant nodes that are removed by a parent dispose handler', function() {
        var childNode = document.createElement("DIV");
        var grandChildNode = document.createElement("DIV");
        var childSpy = jasmine.createSpy('childSpy')
            .andCallFake(function() {
                childNode.removeChild(grandChildNode);
            });
        var grandChildSpy = jasmine.createSpy('grandChildSpy');

        testNode.appendChild(childNode);
        childNode.appendChild(grandChildNode);
        ko.utils.domNodeDisposal.addDisposeCallback(childNode, childSpy);
        ko.utils.domNodeDisposal.addDisposeCallback(grandChildNode, grandChildSpy);

        ko.cleanNode(testNode);
        expect(childSpy).toHaveBeenCalledWith(childNode);
        expect(grandChildSpy).not.toHaveBeenCalled();
    });

    it('Should not clean nodes that are removed by a comment dispose handler', function() {
        var childNode = document.createComment("ko comment");
        var grandChildNode = document.createElement("DIV");
        var childNode2 = document.createComment("ko comment");
        var childSpy = jasmine.createSpy('childSpy')
            .andCallFake(function() {
                testNode.removeChild(grandChildNode);
            });
        var grandChildSpy = jasmine.createSpy('grandChildSpy');
        var child2Spy = jasmine.createSpy('child2Spy');

        testNode.appendChild(childNode);
        testNode.appendChild(grandChildNode);
        testNode.appendChild(childNode2);
        ko.utils.domNodeDisposal.addDisposeCallback(childNode, childSpy);
        ko.utils.domNodeDisposal.addDisposeCallback(grandChildNode, grandChildSpy);
        ko.utils.domNodeDisposal.addDisposeCallback(childNode2, child2Spy);

        ko.cleanNode(testNode);
        expect(childSpy).toHaveBeenCalledWith(childNode);
        expect(grandChildSpy).not.toHaveBeenCalled();
        expect(child2Spy).toHaveBeenCalledWith(childNode2);
    });

    it('Should continue cleaning if a cleaned node is removed in a handler', function() {
        var childNode = document.createElement("DIV");
        var childNode2 = document.createElement("DIV");
        var removeChildSpy = jasmine.createSpy('removeChildSpy')
            .andCallFake(function() {
                testNode.removeChild(childNode);
            });
        var childSpy = jasmine.createSpy('childSpy');

        // Test by removing the node itself
        testNode.appendChild(childNode);
        testNode.appendChild(childNode2);
        ko.utils.domNodeDisposal.addDisposeCallback(childNode, removeChildSpy);
        ko.utils.domNodeDisposal.addDisposeCallback(childNode2, childSpy);

        ko.cleanNode(testNode);
        expect(removeChildSpy).toHaveBeenCalledWith(childNode);
        expect(childSpy).toHaveBeenCalledWith(childNode2);

        removeChildSpy.reset();
        childSpy.reset();

        // Test by removing a previous node
        var childNode3 = document.createElement("DIV");
        testNode.appendChild(childNode);
        testNode.appendChild(childNode2);
        testNode.appendChild(childNode3);
        ko.utils.domNodeDisposal.addDisposeCallback(childNode2, removeChildSpy);
        ko.utils.domNodeDisposal.addDisposeCallback(childNode3, childSpy);

        ko.cleanNode(testNode);
        expect(removeChildSpy).toHaveBeenCalledWith(childNode2);
        expect(childSpy).toHaveBeenCalledWith(childNode3);

        removeChildSpy.reset();
        childSpy.reset();

        // Test by removing a comment node
        var childNode = document.createComment("ko comment");
        testNode.appendChild(childNode);
        testNode.appendChild(childNode2);
        ko.utils.domNodeDisposal.addDisposeCallback(childNode, removeChildSpy);
        ko.utils.domNodeDisposal.addDisposeCallback(childNode2, childSpy);

        ko.cleanNode(testNode);
        expect(removeChildSpy).toHaveBeenCalledWith(childNode);
        expect(childSpy).toHaveBeenCalledWith(childNode2);
    });

    it('Should be able to attach disposal callback to a node that has been cloned', function() {
        // This represents bug https://github.com/SteveSanderson/knockout/issues/324
        // IE < 9 copies expando properties when cloning nodes, so if the node already has some DOM data associated with it,
        // the DOM data key will be copied too. This causes a problem for disposal, because if the original node gets disposed,
        // the shared DOM data is disposed, and then it becomes an error to try to set new DOM data on the clone.
        // The solution is to make the DOM-data-setting logic able to recover from the scenario by detecting that the original
        // DOM data is gone, and therefore recreating a new DOM data store for the clone.

        // Create an element with DOM data
        var originalNode = document.createElement("DIV");
        ko.utils.domNodeDisposal.addDisposeCallback(originalNode, function() { });

        // Clone it, then dispose it. Then check it's still safe to associate DOM data with the clone.
        var cloneNode = originalNode.cloneNode(true);
        ko.cleanNode(originalNode);
        ko.utils.domNodeDisposal.addDisposeCallback(cloneNode, function() { });
    });

    it('Should be able to clean any user data by overwriting "cleanExternalData"', function() {
        this.restoreAfter(ko.utils.domNodeDisposal, 'cleanExternalData'); // restore original function when done

        ko.utils.domNodeDisposal.cleanExternalData = function (node) {
            if (node['ko_test'])
                node['ko_test'] = undefined;
        };

        testNode['ko_test'] = "mydata";
        expect(testNode['ko_test']).toEqual("mydata");

        ko.cleanNode(testNode);
        expect(testNode['ko_test']).toBeUndefined();
    });

    it('If jQuery is referenced, should clear jQuery data when a node is cleaned', function() {
        if (typeof jQuery === 'undefined') {
            return; // Nothing to test. Run the specs with jQuery referenced for this to do anything.
        }

        var obj = {};
        jQuery.data(testNode, 'ko_test', obj);
        expect(jQuery.data(testNode, 'ko_test')).toBe(obj);

        ko.cleanNode(testNode);
        expect(jQuery.data(testNode, 'ko_test')).toBeUndefined();
    });

    it('If jQuery is referenced, should be able to prevent jQuery data from being cleared by overwriting "cleanExternalData"', function() {
        if (typeof jQuery === 'undefined') {
            return; // Nothing to test. Run the specs with jQuery referenced for this to do anything.
        }

        this.restoreAfter(ko.utils.domNodeDisposal, 'cleanExternalData'); // restore original function when done

        ko.utils.domNodeDisposal.cleanExternalData = function () {};

        var obj = {};
        jQuery.data(testNode, 'ko_test', obj);
        expect(jQuery.data(testNode, 'ko_test')).toBe(obj);

        ko.cleanNode(testNode);
        expect(jQuery.data(testNode, 'ko_test')).toBe(obj);
    });
});
