describe("Throttled observables", function() {

  it("Should notify subscribers asynchronously after writes stop for the specified timeout duration", function() {
    var observable = ko.observable('A').extend({ throttle: 50 });
    var notifiedValues = [];
    observable.subscribe(function(value) {
      notifiedValues.push(value);
    });

    runs(function() {

      // Mutate a few times
      observable('B');
      observable('C');
      observable('D');
      expect(notifiedValues.length).toEqual(0); // Should not notify synchronously

      // Wait
      setTimeout(function() {
        // Mutate more
        observable('E');
        observable('F');
        expect(notifiedValues.length).toEqual(0); // Should not notify until end of throttle timeout
      }, 20);
    });

    waitsFor(function() {
      // Wait until after timeout
      return notifiedValues.length > 0;
    }, 80);

    runs(function() {
      expect(notifiedValues.length).toEqual(1);
      expect(notifiedValues[0]).toEqual("F");
    });

  });
});

describe("Throttled dependent observables", function() {

  it("Should notify subscribers asynchronously after dependencies stop updating for the specified timeout duration", function() {
    var underlying = ko.observable();
    var asyncDepObs = ko.dependentObservable(function() {
      return underlying();
    }).extend({ throttle: 100 });
    var notifiedValues = [];
    asyncDepObs.subscribe(function(value) {
      notifiedValues.push(value);
    });


    runs(function() {
      // Check initial state
      expect(asyncDepObs()).toBeUndefined();

      // Mutate
      underlying('New value');
      expect(asyncDepObs()).toBeUndefined(); // Should not update synchronously
      expect(notifiedValues.length).toEqual(0);

      // Wait
      setTimeout(function() {
        // After 50ms, still shouldn't have evaluated
        expect(asyncDepObs()).toBeUndefined(); // Should not update until throttle timeout
        expect(notifiedValues.length).toEqual(0);
      }, 50);
    });

    waitsFor(function() {
      // Now wait for throttle timeout
      return notifiedValues.length > 0;
    }, 110);

    runs(function() {
      expect(asyncDepObs()).toEqual('New value');
      expect(notifiedValues.length).toEqual(1);
      expect(notifiedValues[0]).toEqual('New value');
    });

  });

  it("Should run evaluator only once when dependencies stop updating for the specified timeout duration", function() {
    var evaluationCount = 0;
    var someDependency = ko.observable();
    var asyncDepObs = ko.dependentObservable(function() {
      evaluationCount++;
      return someDependency();
    }).extend({ throttle: 100 });

    runs(function() {
      // Mutate a few times synchronously
      expect(evaluationCount).toEqual(1); // Evaluates synchronously when first created, like all dependent observables
      someDependency("A");
      someDependency("B");
      someDependency("C");
      expect(evaluationCount).toEqual(1); // Should not re-evaluate synchronously when dependencies update

      // Also mutate async
      setTimeout(function() {
        someDependency("D");
        expect(evaluationCount).toEqual(1);
      }, 10);
    });

    waitsFor(function() {
      // Now wait for throttle timeout
      return evaluationCount > 1;
    }, 120);

    runs(function() {
      expect(evaluationCount).toEqual(2); // Finally, it's evaluated
      expect(asyncDepObs()).toEqual("D");
    });
  });
});