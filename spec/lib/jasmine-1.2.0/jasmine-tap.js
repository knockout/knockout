// This code from https://github.com/larrymyers/jasmine-reporters
// License: MIT (https://github.com/larrymyers/jasmine-reporters/blob/master/LICENSE)

(function() {
    if (! jasmine) {
        throw new Exception("jasmine library does not exist in global namespace!");
    }

    /**
     * TAP (http://en.wikipedia.org/wiki/Test_Anything_Protocol) reporter.
     * outputs spec results to the console.
     *
     * Heavily inspired by ConsoleReporter found at:
     * https://github.com/larrymyers/jasmine-reporters/
     *
     * Usage:
     *
     * jasmine.getEnv().addReporter(new jasmine.TapReporter());
     * jasmine.getEnv().execute();
     */
    var TapReporter = function() {
        this.started = false;
        this.finished = false;
    };

    TapReporter.prototype = {

        reportRunnerStarting: function(runner) {
            this.started = true;
            this.start_time = (new Date()).getTime();
            this.executed_specs = 0;
            this.passed_specs = 0;
            this.executed_asserts = 0;
            this.passed_asserts = 0;
            // should have at least 1 spec, otherwise it's considered a failure
            this.log('1..'+ Math.max(runner.specs().length, 1));
        },

        reportSpecStarting: function(spec) {
            this.executed_specs++;
        },

        reportSpecResults: function(spec) {
            var resultText = "not ok";
            var errorMessage = '';

            var results = spec.results();
            if (!results.skipped) {
                var passed = results.passed();

                this.passed_asserts += results.passedCount;
                this.executed_asserts += results.totalCount;

                if (passed) {
                    this.passed_specs++;
                    resultText = "ok";
                } else {
                    var items = results.getItems();
                    var i = 0;
                    var expectationResult, stackMessage;
                    while (expectationResult = items[i++]) {
                        if (expectationResult.trace) {
                            stackMessage = expectationResult.trace.stack? expectationResult.trace.stack : expectationResult.message;
                            errorMessage += '\n  '+ stackMessage;
                        }
                    }
                }

                this.log(resultText +" "+ (spec.id + 1) +" - "+ spec.suite.description +" : "+ spec.description + errorMessage);
            }
        },

        reportRunnerResults: function(runner) {
            var dur = (new Date()).getTime() - this.start_time;
            var failed = this.executed_specs - this.passed_specs;
            var spec_str = this.executed_specs + (this.executed_specs === 1 ? " spec, " : " specs, ");
            var fail_str = failed + (failed === 1 ? " failure in " : " failures in ");
            var assert_str = this.executed_asserts + (this.executed_asserts === 1 ? " assertion, " : " assertions, ");

            if (this.executed_asserts) {
                this.log("# "+ spec_str + assert_str + fail_str + (dur/1000) + "s.");
            } else {
                this.log('not ok 1 - no asserts run.');
            }
            this.finished = true;
        },

        log: function(str) {
            var console = jasmine.getGlobal().console;
            if (console && console.log) {
                console.log(str);
            }
        }
    };

    // export public
    jasmine.TapReporter = TapReporter;
})();
