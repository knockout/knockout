
// Setup
require('./helpers/beforeEach');
global.ko = require("../" + buildDir + "knockout.min.js")


// Tests run by Node. These are also in specs.json i.e. tests run in
// the browser.
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

