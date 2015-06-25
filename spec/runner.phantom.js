// ---------------------------------------------------------------------------------------
// Note: The following BSD-New license relates only to this particular file, which is
// not part of the runtime package for KnockoutJS - it is only used as part of a mechanism
// for testing KnockoutJS.
// The following license is *not* the license for KnockoutJS.
// ---------------------------------------------------------------------------------------

// Based on https://raw.github.com/ariya/phantomjs/1.7.0/examples/run-jasmine.js

//Redistribution and use in source and binary forms, with or without
//modification, are permitted provided that the following conditions are met:
//
//  * Redistributions of source code must retain the above copyright
//    notice, this list of conditions and the following disclaimer.
//  * Redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.
//  * Neither the name of the <organization> nor the
//    names of its contributors may be used to endorse or promote products
//    derived from this software without specific prior written permission.
//
//THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
//AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
//IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
//ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
//DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
//(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
//LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
//ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
//(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
//THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

var system = require('system');

/**
 * Wait until the test condition is true or a timeout occurs. Useful for waiting
 * on a server response or for a ui change (fadeIn, etc.) to occur.
 *
 * @param testFx javascript condition that evaluates to a boolean,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param onReady what to do when testFx condition is fulfilled,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param timeOutMillis the max amount of time to wait. If not specified, 3 sec is used.
 */
function waitFor(testFx, onReady, onTimeout, timeOutMillis) {
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3001, //< Default Max Timeout is 3s
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                // If not time-out yet and condition not yet fulfilled
                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
            } else {
                if(!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
                    console.log("'waitFor()' timeout");
                    onTimeout ? onTimeout() : phantom.exit(1);
                } else {
                    clearInterval(interval); //< Stop this interval
                    // Condition fulfilled (timeout and/or condition is 'true')
                    typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                }
            }
        }, 100); //< repeat check every 100ms
};


var page = require('webpage').create();

console.log("Running Knockout tests in Phantom.js");


// Route "console.log()" calls from within the Page context to the main Phantom context (i.e. current "this")
page.onConsoleMessage = function(msg) {
    console.log(msg);
};

// Run the specs against the latest minified build
page.open(system.args[1] || 'spec/runner.html?src=build/output/knockout-latest.js', function(status){
    if (status !== "success") {
        console.log("Unable to access network");
        phantom.exit();
    } else {
        waitFor(function(){
            return page.evaluate(function(){
                return document.body.querySelector('.symbolSummary .pending') === null
            });
        }, function(){
            var exitCode = page.evaluate(function(){
                var list = document.body.querySelectorAll('.results > #details > .specDetail.failed');
                if (list && list.length > 0) {
                  console.log('');
                  console.log(list.length + ' test(s) FAILED:');
                  for (i = 0; i < list.length; ++i) {
                      var el = list[i],
                          desc = el.querySelector('.description'),
                          msg = el.querySelector('.resultMessage.fail');
                      console.log('');
                      console.log(desc.innerText);
                      console.log(msg.innerText);
                      console.log('');
                  }
                  return 1;
                } else {
                  console.log(document.body.querySelector('.alert > .passingAlert.bar').innerText);
                  return 0;
                }
            });
            phantom.exit(exitCode);
        }, function() {
            var exitCode = page.evaluate(function(){
                var specs = document.body.querySelectorAll('.results .specSummary');
                console.log('Last test completed:');
                console.log(specs[specs.length-1].innerText);
            });
            phantom.exit(exitCode || 1);
        });
    }
});
