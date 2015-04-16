/*
    This script starts jasmine tests.
 */
window.DEBUG = true;
window.amdRequire = window.require;

// Use a different variable name (not 'jQuery') to avoid overwriting
// window.jQuery with 'undefined' on IE < 9
window.jQueryInstance = window.jQuery;

jasmine.updateInterval = 500;
