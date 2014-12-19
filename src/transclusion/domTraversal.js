
ko.transclusion.getElementsByClassName = (function(document){
  if(document.getElementsByClassName){
    return function(className, context){
      return context.getElementsByClassName(className);
    }
  }
  return function(className, context){
    var nodes = context.getElementsByTagName('*'),
      idx = nodes.length,
      hasClass = new RegExp('\\b' + className + '\\b'),
      res = [];
    while(--idx) {
      if (!!nodes[idx].className && hasClass.test(nodes[idx].className)) {
        res.push(nodes[idx]);
      }
    }
  };
}(document));

/**
 *
 * @param tagName
 * @param context {HTMLElement}
 * @returns {Array<HTMLElement>}
 */
ko.transclusion.getElementsByTagName = function(tagName, context){
  return context.getElementsByTagName && context.getElementsByTagName(tagName) || [];
};

ko.transclusion.findBySelect = function(select, componentNode) {
  if(select === "*"){
    // transclude everything
    return componentNode.childNodes;
  } else if (select[0] == '.') {
    // get by class
    return ko.transclusion.getElementsByClassName(select.substring(1), componentNode);
  } else {
    // get by tag name
    return ko.transclusion.getElementsByTagName(select, componentNode);
  }
};