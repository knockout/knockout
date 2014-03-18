(function(factory) {
    // Support three module loading scenarios
    if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
        // [1] CommonJS/Node.js
        var target = module['exports'] || exports; // module.exports is for Node.js
        factory(target);
    } else if (typeof define === 'function' && define['amd']) {
        // [2] AMD anonymous module
        define('ko', ['exports'], factory);//define own name 'ko' so other ko modules that are aware of amd can define their own shims config and not interact with them
    } 
        //always put it in the global namespace because it would cause issues to 3rd party plugins which are not supporting amd
        // [3] No module loader (plain <script> tag) - put directly in global namespace
        factory(window['ko'] = {});
    
}(function(koExports){
