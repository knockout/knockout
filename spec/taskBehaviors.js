describe('Tasks', function() {
    beforeEach(function() {
        jasmine.Clock.useMock();
    });

    afterEach(function() {
        // Check that task schedule is clear after each test
        expect(ko.tasks.runTasks()).toEqual(0);
    });

    it('Should run in next execution cycle', function() {
        var runCount = 0;
        ko.tasks.schedule(function() {
            runCount++;
        });
        expect(runCount).toEqual(0);

        jasmine.Clock.tick(1);
        expect(runCount).toEqual(1);
    });

    it('Should run multiple times if added more than once', function() {
        var runCount = 0;
        var func = function() {
            runCount++;
        };
        ko.tasks.schedule(func);
        ko.tasks.schedule(func);
        expect(runCount).toEqual(0);

        jasmine.Clock.tick(1);
        expect(runCount).toEqual(2);
    });

    it('Should run all scheduled tasks if processed early by runTasks', function() {
        var runValues = [];
        var func = function(value) {
            runValues.push(value);
        };

        ko.tasks.schedule(func.bind(null, 1));
        ko.tasks.schedule(func.bind(null, 2));

        ko.tasks.runTasks();
        expect(runValues).toEqual([1,2]);
    });

    it('Should run tasks again if scheduled after runTasks', function() {
        var runValues = [];
        var func = function(value) {
            runValues.push(value);
        };
        ko.tasks.schedule(func.bind(null, 1));
        expect(runValues).toEqual([]);

        ko.tasks.runTasks();
        expect(runValues).toEqual([1]);

        ko.tasks.schedule(func.bind(null, 2));

        jasmine.Clock.tick(1);
        expect(runValues).toEqual([1,2]);
    });

    it('Should not run tasks again if runTasks is called during task processing', function() {
        var runValues = [];
        var func = function(value) {
            runValues.push(value);
            ko.tasks.runTasks();
        };
        ko.tasks.schedule(func.bind(null, 1));
        ko.tasks.schedule(func.bind(null, 2));
        expect(runValues).toEqual([]);

        jasmine.Clock.tick(1);
        expect(runValues).toEqual([1,2]);
    });

    it('Should process newly scheduled tasks during task processing', function() {
        var runValues = [];
        var func = function(value) {
            runValues.push(value);
            ko.tasks.schedule(function() {
                runValues.push('x');
            });
        };

        ko.tasks.schedule(func.bind(null, 'i'));
        expect(runValues).toEqual([]);

        jasmine.Clock.tick(1);
        expect(runValues).toEqual(['i','x']);
    });

    it('Should keep correct state if a task throws an exception', function() {
        var runValues = [];
        var func = function(value) {
            runValues.push(value);
        };
        ko.tasks.schedule(func.bind(null, 1));
        ko.tasks.schedule(function() {
            throw Error("test");
        });
        ko.tasks.schedule(func.bind(null, 2));
        expect(runValues).toEqual([]);

        // When running tasks, it will throw an exception and not complete the tasks
        expect(function() {
            jasmine.Clock.tick(1);
        }).toThrow();
        expect(runValues).toEqual([1]);

        // The remaining tasks will run later
        jasmine.Clock.tick(1);
        expect(runValues).toEqual([1,2]);
    });

    it('Should stop recursive task processing after a fixed number of iterations', function() {
        var runValues = [];
        var func = function() {
            runValues.push('x');
            ko.tasks.schedule(func);
        };

        ko.tasks.schedule(func);
        expect(runValues).toEqual([]);

        expect(function() {
            jasmine.Clock.tick(1);
        }).toThrowContaining('Too much recursion');

        // 5000 is the current limit in the code, but it could change if needed.
        expect(runValues.length).toEqual(5000);
    });

    it('Should not stop non-recursive task processing', function() {
        var runValues = [];
        var func = function() {
            runValues.push('x');
        };

        for (var i = 0; i < 10000; ++i) {
            ko.tasks.schedule(func);
        }
        expect(runValues).toEqual([]);

        jasmine.Clock.tick(1);
        expect(runValues.length).toEqual(10000);
    });

    describe('Cancel', function() {
        it('Should prevent task from running', function() {
            var runCount = 0;
            var handle = ko.tasks.schedule(function() {
                runCount++;
            });
            ko.tasks.cancel(handle);

            jasmine.Clock.tick(1);
            expect(runCount).toEqual(0);
        });

        it('Should prevent only the canceled task', function() {
            var runCount = 0;
            var func = function() {
                runCount++;
            };
            var handle1 = ko.tasks.schedule(func);
            var handle2 = ko.tasks.schedule(func);
            ko.tasks.cancel(handle2);

            jasmine.Clock.tick(1);
            expect(runCount).toEqual(1);
        });

        it('Should do nothing if task has already run', function() {
            var runValues = [];
            var func = function(value) {
                runValues.push(value);
            };
            var handle1 = ko.tasks.schedule(func.bind(null, 1));
            expect(runValues).toEqual([]);

            ko.tasks.runTasks();
            expect(runValues).toEqual([1]);

            var handle2 = ko.tasks.schedule(func.bind(null, 2));

            // Try to cancel the first task
            ko.tasks.cancel(handle1);

            // But nothing should happen; the second task will run in the next iteration
            jasmine.Clock.tick(1);
            expect(runValues).toEqual([1,2]);
        });

        it('Should work correctly after a task throws an exception', function() {
            var runValues = [];
            var func = function(value) {
                runValues.push(value);
            };
            ko.tasks.schedule(func.bind(null, 1));
            ko.tasks.schedule(function() {
                throw Error("test");
            });
            var handle = ko.tasks.schedule(func.bind(null, 2));
            ko.tasks.schedule(func.bind(null, 3));
            expect(runValues).toEqual([]);

            // When running tasks, it will throw an exception and not complete the tasks
            expect(function() {
                jasmine.Clock.tick(1);
            }).toThrow();
            expect(runValues).toEqual([1]);

            // The canceled task will be skipped
            ko.tasks.cancel(handle);
            jasmine.Clock.tick(1);
            expect(runValues).toEqual([1,3]);
        });
    });
});