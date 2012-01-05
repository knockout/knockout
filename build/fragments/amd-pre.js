!function(factory){
  // Export the ko object for NodeJs and CommonJs with 
  // backwards compatability for the old `require()` API.
  // If we're not in CommonJs, add `ko` to the global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports){
      exports = module.exports;
    }
    factory(exports);
  } else if (typeof define === 'function' && define.amd) {
    // Register as a named module with AMD
    define(['exports'], factory);
  } else {
    factory(window['ko'] = {});
  }
}(function(koExports){
