!function(factory) {
    // Support three module loading scenarios
    if (typeof exports !== 'undefined') {
        // [1] CommonJS/Node.js
        if (typeof module !== 'undefined' && module['exports'])
            exports = module['exports']; // For Node.js
        factory(exports);
    } else if (typeof define === 'function' && define['amd'] && define['amd']['ko']) {
        // [2] AMD anonymous module
        define(['exports'], factory);
    } else {
        // [3] No module loader (plain <script> tag) - put directly in global namespace
        factory(window['ko'] = {});
    }
}(function(koExports){
