module("Throttled observables");

asyncTest("Should notify subscribers asynchronously after writes stop for the specified timeout duration", function() {
	var observable = ko.observable('A').extend({ throttle: 50 });
	var notifiedValues = []
	observable.subscribe(function(value) {
		notifiedValues.push(value);
	});

	// Mutate a few times
	start();
	observable('B');
	observable('C');
	observable('D');
	equal(notifiedValues.length, 0, "Should not notify synchronously");
	
	// Wait
	stop();
	setTimeout(function() {
		// Mutate more
		start();
		observable('E');
		observable('F');
		equal(notifiedValues.length, 0, "Should not notify until end of throttle timeout");

		// Wait until after timeout
		stop();
		setTimeout(function() {
			start();
			equal(notifiedValues.length, 1);
			equal(notifiedValues[0], "F");
		}, 60);
	}, 20);
});

// ---------

module("Throttled dependent observables");

asyncTest("Should notify subscribers asynchronously after dependencies stop updating for the specified timeout duration", function() {
	var underlying = ko.observable();
	var asyncDepObs = ko.dependentObservable(function() {
		return underlying();
	}).extend({ throttle: 100 });
	var notifiedValues = []
	asyncDepObs.subscribe(function(value) {
		notifiedValues.push(value);
	});

	// Check initial state
	start();
	equal(asyncDepObs(), undefined);

	// Mutate
	underlying('New value');
	equal(asyncDepObs(), undefined, 'Should not update synchronously');
	equal(notifiedValues.length, 0);
	stop();

	// Wait
	setTimeout(function() {
		// After 50ms, still shouldn't have evaluated
		start();
		equal(asyncDepObs(), undefined, 'Should not update until throttle timeout');
		equal(notifiedValues.length, 0);
		stop();

		// Wait again
		setTimeout(function() {
			start();
			equal(asyncDepObs(), 'New value');
			equal(notifiedValues.length, 1);
			equal(notifiedValues[0], 'New value');
		}, 60);
	}, 50);
});

asyncTest("Should run evaluator only once when dependencies stop updating for the specified timeout duration", function() {
	var evaluationCount = 0;
	var someDependency = ko.observable();
	var asyncDepObs = ko.dependentObservable(function() {
		evaluationCount++;
		return someDependency();
	}).extend({ throttle: 100 });

	// Mutate a few times synchronously
	start();
	equal(evaluationCount, 1); // Evaluates synchronously when first created, like all dependent observables
	someDependency("A");
	someDependency("B");
	someDependency("C");
	equal(evaluationCount, 1, "Should not re-evaluate synchronously when dependencies update");

	// Also mutate async
	stop();
	setTimeout(function() {
		start();
		someDependency("D");
		equal(evaluationCount, 1);

		// Now wait for throttle timeout
		stop();
		setTimeout(function() {
			start();
			equal(evaluationCount, 2); // Finally, it's evaluated
			equal(asyncDepObs(), "D");
		}, 110);		
	}, 10);
});