
// Setup
require('./lib/jasmine.extensions');
global.ko = require("../" + buildDir + "knockout.min.js")


// Tests
require('./arrayEditDetectionBehaviors');
require('./asyncBehaviors');
require('./dependentObservableBehaviors');
require('./expressionRewritingBehaviors');
require('./extenderBehaviors');
require('./mappingHelperBehaviors');
require('./observableArrayBehaviors');
require('./observableArrayChangeTrackingBehaviors');
require('./observableBehaviors');
require('./subscribableBehaviors');
require('./utilsBehaviors');

