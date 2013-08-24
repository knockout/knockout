
describe('Dependent Observable DOM', function() {
    beforeEach(jasmine.prepareTestNode);

    it('Should register DOM node disposal callback only if active after the initial evaluation', function() {
        // Set up an active one
        var nodeForActive = document.createElement('DIV'),
            observable = ko.observable('initial'),
            activeDependentObservable = ko.dependentObservable({ read: function() { return observable(); }, disposeWhenNodeIsRemoved: nodeForActive });
        var nodeForInactive = document.createElement('DIV')
            inactiveDependentObservable = ko.dependentObservable({ read: function() { return 123; }, disposeWhenNodeIsRemoved: nodeForInactive });

        expect(activeDependentObservable.isActive()).toEqual(true);
        expect(inactiveDependentObservable.isActive()).toEqual(false);

        // Infer existence of disposal callbacks from presence/absence of DOM data. This is really just an implementation detail,
        // and so it's unusual to rely on it in a spec. However, the presence/absence of the callback isn't exposed in any other way,
        // and if the implementation ever changes, this spec should automatically fail because we're checking for both the positive
        // and negative cases.
        expect(ko.utils.domData.clear(nodeForActive)).toEqual(true);    // There was a callback
        expect(ko.utils.domData.clear(nodeForInactive)).toEqual(false); // There was no callback
    });

    it('Should dispose when DOM node is removed from the document and computed is re-evaluated', function() {
        // Create node and add it to the document
        var node = document.createElement('DIV');
        testNode.appendChild(node);

        // Create a computed that is disposed when the node is removed
        var observable = ko.observable('initial'),
            computed = ko.computed({
                read: function() { return observable(); },
                disposeWhenNodeIsRemoved: node
            });

        // Update computed and check that it's still active
        observable('second');
        expect(computed.isActive()).toEqual(true);

        // Remove the node, update the computed, and check that it was disposed
        testNode.removeChild(node);
        observable('third');
        expect(computed.isActive()).toEqual(false);
    });

    it('Should dispose when DOM node is removed from the document, but not before it\'s added', function() {
        var node = document.createElement('DIV'),
            observable = ko.observable('initial'),
            computed = ko.computed({
                read: function() { return observable(); },
                disposeWhenNodeIsRemoved: node
            });

        // Update computed and check that it's still active
        observable('second');
        expect(computed.isActive()).toEqual(true);

        // Add the node, update the computed, and check that it is still active
        testNode.appendChild(node);
        observable('third');
        expect(computed.isActive()).toEqual(true);

        // Remove the node, update the computed, and check that it was disposed
        testNode.removeChild(node);
        observable('fourth');
        expect(computed.isActive()).toEqual(false);
    });
})
