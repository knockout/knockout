
describe('DOM node disposal', {
    before_each: function () {
        testNode = document.createElement("div");
    },

    'Should run registered disposal callbacks when a node is cleaned': function () {
        var didRun = false;
        ko.utils.domNodeDisposal.addDisposeCallback(testNode, function() { didRun = true });

        value_of(didRun).should_be(false);
        ko.cleanNode(testNode);
        value_of(didRun).should_be(true);
    },

    'Should run registered disposal callbacks on descendants when a node is cleaned': function () {
        var didRun = false;
        var childNode = document.createElement("DIV");
        var grandChildNode = document.createElement("DIV");
        testNode.appendChild(childNode);
        childNode.appendChild(grandChildNode);
        ko.utils.domNodeDisposal.addDisposeCallback(grandChildNode, function() { didRun = true });

        value_of(didRun).should_be(false);
        ko.cleanNode(testNode);
        value_of(didRun).should_be(true);
    },

    'Should run registered disposal callbacks and detach from DOM when a node is removed': function () {
        var didRun = false;
        var childNode = document.createElement("DIV");
        testNode.appendChild(childNode);
        ko.utils.domNodeDisposal.addDisposeCallback(childNode, function() { didRun = true });

        value_of(didRun).should_be(false);
        value_of(testNode.childNodes.length).should_be(1);
        ko.removeNode(childNode);
        value_of(didRun).should_be(true);
        value_of(testNode.childNodes.length).should_be(0);
    },

    'Should be able to remove previously-registered disposal callbacks': function() {
        var didRun = false;
        var callback = function() { didRun = true };
        ko.utils.domNodeDisposal.addDisposeCallback(testNode, callback);

        value_of(didRun).should_be(false);
        ko.utils.domNodeDisposal.removeDisposeCallback(testNode, callback);
        ko.cleanNode(testNode);
        value_of(didRun).should_be(false); // Didn't run only because we removed it
    },

    'Should be able to attach disposal callback to a node that has been cloned': function() {
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
    },

    'Should be registered during the creation of dependent observables only if active after the initial evaluation': function() {
        // Set up an active one
        var nodeForActive = document.createElement('DIV'),
            observable = ko.observable('initial'),
            activeDependentObservable = ko.dependentObservable({ read: function() { return observable(); }, disposeWhenNodeIsRemoved: nodeForActive });
        var nodeForInactive = document.createElement('DIV'),
            inactiveDependentObservable = ko.dependentObservable({ read: function() { return 123; }, disposeWhenNodeIsRemoved: nodeForInactive });

        value_of(activeDependentObservable.isActive()).should_be(true);
        value_of(inactiveDependentObservable.isActive()).should_be(false);

        // Infer existence of disposal callbacks from presence/absence of DOM data. This is really just an implementation detail,
        // and so it's unusual to rely on it in a spec. However, the presence/absence of the callback isn't exposed in any other way,
        // and if the implementation ever changes, this spec should automatically fail because we're checking for both the positive
        // and negative cases.
        value_of(ko.utils.domData.clear(nodeForActive)).should_be(true);    // There was a callback
        value_of(ko.utils.domData.clear(nodeForInactive)).should_be(false); // There was no callback
    }
});
