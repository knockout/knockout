
describe('Dependent Observable DOM', function() {
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
})
