(function(factory) {
    // Support three module loading scenarios
    if (typeof define === 'function' && define['amd']) {
        // [1] AMD anonymous module
        define(['exports', 'require', 'jquery'], factory);
    } else if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
        // [2] CommonJS/Node.js
        factory(module['exports'] || exports, undefined, require('jquery'));  // module.exports is for Node.js
    } else {
        // [3] No module loader (plain <script> tag) - put directly in global namespace
        factory(window['ko'] = {}, undefined, window['jQuery']);
    }
}(function(koExports, amdRequire, jQuery){
    var jQueryInstance = jQuery;
