!function(factory) {
    // Support AMD where available and opted in via define.amd.ko
    if (typeof define === 'function' && define['amd'] && define['amd']['ko']) {
        // Register as an AMD anonymous module
        define(['exports'], factory);
    } else {
        // AMD not in use (e.g., when referenced via aplain <script> tag) - put ko directly in global namespace
        factory(window['ko'] = {});
    }
}(function(koExports){
