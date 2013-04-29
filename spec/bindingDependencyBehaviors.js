describe('Binding dependencies', function() {
    beforeEach(jasmine.prepareTestNode);

    it('If the binding handler depends on an observable, invokes the init handler once and the update handler whenever a new value is available', function () {
        var observable = new ko.observable();
        var initPassedValues = [], updatePassedValues = [];
        ko.bindingHandlers.test = {
            init: function (element, valueAccessor) { initPassedValues.push(valueAccessor()()); },
            update: function (element, valueAccessor) { updatePassedValues.push(valueAccessor()()); }
        };
        testNode.innerHTML = "<div data-bind='test: myObservable'></div>";

        ko.applyBindings({ myObservable: observable }, testNode);
        expect(initPassedValues.length).toEqual(1);
        expect(updatePassedValues.length).toEqual(1);
        expect(initPassedValues[0]).toBeUndefined();
        expect(updatePassedValues[0]).toBeUndefined();

        observable("A");
        expect(initPassedValues.length).toEqual(1);
        expect(updatePassedValues.length).toEqual(2);
        expect(updatePassedValues[1]).toEqual("A");
    });

    it('If the associated DOM element was removed by KO, handler subscriptions are disposed immediately', function () {
        var observable = new ko.observable("A");
        ko.bindingHandlers.anyHandler = {
            update: function (element, valueAccessor) { valueAccessor(); }
        };
        testNode.innerHTML = "<div data-bind='anyHandler: myObservable()'></div>";
        ko.applyBindings({ myObservable: observable }, testNode);

        expect(observable.getSubscriptionsCount()).toEqual(1);

        ko.removeNode(testNode);

        expect(observable.getSubscriptionsCount()).toEqual(0);
    });

    it('If the associated DOM element was removed independently of KO, handler subscriptions are disposed on the next evaluation', function () {
        var observable = new ko.observable("A");
        ko.bindingHandlers.anyHandler = {
            update: function (element, valueAccessor) { valueAccessor(); }
        };
        testNode.innerHTML = "<div data-bind='anyHandler: myObservable()'></div>";
        ko.applyBindings({ myObservable: observable }, testNode);

        expect(observable.getSubscriptionsCount()).toEqual(1);

        testNode.parentNode.removeChild(testNode);
        observable("B"); // Force re-evaluation

        expect(observable.getSubscriptionsCount()).toEqual(0);
    });

    it('If the binding attribute involves an observable, re-invokes the bindings if the observable notifies a change', function () {
        var observable = new ko.observable({ message: "hello" });
        var passedValues = [];
        ko.bindingHandlers.test = { update: function (element, valueAccessor) { passedValues.push(valueAccessor()); } };
        testNode.innerHTML = "<div data-bind='test: myObservable().message'></div>";

        ko.applyBindings({ myObservable: observable }, testNode);
        expect(passedValues.length).toEqual(1);
        expect(passedValues[0]).toEqual("hello");

        observable({ message: "goodbye" });
        expect(passedValues.length).toEqual(2);
        expect(passedValues[1]).toEqual("goodbye");
    });

    it('Should not reinvoke init for notifications triggered during first evaluation', function () {
        var observable = ko.observable('A');
        var initCalls = 0;
        ko.bindingHandlers.test = {
            init: function (element, valueAccessor) {
                initCalls++;

                var value = valueAccessor();

                // Read the observable (to set up a dependency on it), and then also write to it (to trigger re-eval of bindings)
                // This logic probably wouldn't be in init but might be indirectly invoked by init
                value();
                value('B');
            }
        };
        testNode.innerHTML = "<div data-bind='test: myObservable'></div>";

        ko.applyBindings({ myObservable: observable }, testNode);
        expect(initCalls).toEqual(1);
    });

    it('Should not run update before init, even if an associated observable is updated by a different binding before init', function() {
        // Represents the "theoretical issue" posed by Ryan in comments on https://github.com/SteveSanderson/knockout/pull/193

        var observable = ko.observable('A'), hasInittedSecondBinding = false, hasUpdatedSecondBinding = false;
        ko.bindingHandlers.test1 = {
            init: function(element, valueAccessor) {
                // Read the observable (to set up a dependency on it), and then also write to it (to trigger re-eval of bindings)
                // This logic probably wouldn't be in init but might be indirectly invoked by init
                var value = valueAccessor();
                value();
                value('B');
            }
        }
        ko.bindingHandlers.test2 = {
            init: function() {
                hasInittedSecondBinding = true;
            },
            update: function() {
                if (!hasInittedSecondBinding)
                    throw new Error("Called 'update' before 'init'");
                hasUpdatedSecondBinding = true;
            }
        }
        testNode.innerHTML = "<div data-bind='test1: myObservable, test2: true'></div>";

        ko.applyBindings({ myObservable: observable }, testNode);
        expect(hasUpdatedSecondBinding).toEqual(true);
    });

    it('Should be able to get all updates to observables in both init and update', function() {
        var lastBoundValueInit, lastBoundValueUpdate;
        ko.bindingHandlers.testInit = {
            init: function(element, valueAccessor) {
                ko.dependentObservable(function() {
                    lastBoundValueInit = ko.utils.unwrapObservable(valueAccessor());
                });
            }
        };
        ko.bindingHandlers.testUpdate = {
            update: function(element, valueAccessor) {
                lastBoundValueUpdate = ko.utils.unwrapObservable(valueAccessor());
            }
        };
        testNode.innerHTML = "<div data-bind='testInit: myProp()'></div><div data-bind='testUpdate: myProp()'></div>";
        var vm = ko.observable({ myProp: ko.observable("initial value") });
        ko.applyBindings(vm, testNode);
        expect(lastBoundValueInit).toEqual("initial value");
        expect(lastBoundValueUpdate).toEqual("initial value");

        // update value of observable
        vm().myProp("second value");
        expect(lastBoundValueInit).toEqual("second value");
        expect(lastBoundValueUpdate).toEqual("second value");

        // update value of observable to another observable
        vm().myProp(ko.observable("third value"));
        expect(lastBoundValueInit).toEqual("third value");
        expect(lastBoundValueUpdate).toEqual("third value");

        // update view model with brand-new property
        /* TODO: fix observable view models
        vm({ myProp: function() {return "fourth value"; }});
        expect(lastBoundValueInit).toEqual("fourth value");
        expect(lastBoundValueUpdate).toEqual("fourth value");*/
    });

    // This is a temporary spec that should fail once the independent bindings fix is included
    it('Should update all bindings if a binding unwraps an observable in dependent mode', function() {
        var countUpdates = 0, observable = ko.observable(1);
        ko.bindingHandlers.countingHandler = {
            update: function() { countUpdates++; }
        }
        ko.bindingHandlers.unwrappingHandler = {
            update: function(element, valueAccessor) { valueAccessor(); }
        }
        testNode.innerHTML = "<div data-bind='countingHandler: true, unwrappingHandler: myObservable()'></div>";

        ko.applyBindings({ myObservable: observable }, testNode);
        expect(countUpdates).toEqual(1);
        observable(3);
        expect(countUpdates).toEqual(2);
    });

    it('Should access latest value from extra binding when normal binding is updated', function() {
        delete ko.bindingHandlers.nonexistentHandler;
        var observable = ko.observable(), updateValue;
        var vm = {myObservable: observable, myNonObservable: "first value"};
        ko.bindingHandlers.existentHandler = {
            update: function(element, valueAccessor, allBindingsAccessor) {
                valueAccessor()();  // create dependency
                updateValue = allBindingsAccessor().nonexistentHandler;
            }
        }
        testNode.innerHTML = "<div data-bind='existentHandler: myObservable, nonexistentHandler: myNonObservable'></div>";

        ko.applyBindings(vm, testNode);
        expect(updateValue).toEqual("first value");
        vm.myNonObservable = "second value";
        observable.notifySubscribers();
        expect(updateValue).toEqual("second value");
    });
});
