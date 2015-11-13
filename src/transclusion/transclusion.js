(function(undefined) {
  ko.transclusion = {};
  /**
   * Given an array-like structure of DOM nodes, returns an array of
   * every <content> node in the list, or any element of the list's subtree.
   * @param nodeList {Array<HTMLElement>}
   * @returns {Array}
   */
  function getContentNodes(nodeList){
    var res = [],
      idx = nodeList.length,
      found;
    while(--idx>=0){
      found = ko.transclusion.getElementsByTagName('content', nodeList[idx]);
      if(found.length){
        if (found.item) {
          // convert NodeList to an Array to make PhantomJS 1.x happy
          found = Array.prototype.slice.call(found);
        }
        res.push.apply(res, found);
      }
    }
    return res;
  }

  /**
   * This is where the actual transclusion takes place. Given a contentNode
   * @method replaceContentNodeWithTranscludedNodes
   * @for ko.transclusion
   * @param select - CSS selector string that selects the node to be replaced/removed
   * @param contentNode {HTMLElement} - The content node which will be replaced/removed
   * @param componentNode {HTMLElement} - The component node from which the content will be removed
   * @param componentDefinition - The component definition object containing 'findContent' function optionally
   */
  ko.transclusion.replaceContentNodeWithTranscludedNodes = function(select, contentNode, componentNode, componentDefinition){
    var contentFromDefinition = componentDefinition['findContent'] && componentDefinition['findContent'](select, componentNode);
    if(typeof contentFromDefinition == 'string') contentFromDefinition = ko.utils.parseHtmlFragment(contentFromDefinition);

    var toMove = contentFromDefinition || ko.transclusion.findBySelect(select, componentNode),
      parent = contentNode.parentNode;

    var idx = toMove.length;
    var beforeThisNode = contentNode;
    while(--idx>=0){
      var move = toMove[idx];
      parent.insertBefore(move, beforeThisNode);
      beforeThisNode = move;
    }
    if(contentFromDefinition) {
      var toRemove = ko.transclusion.findBySelect(select, componentNode);
      var ridx = toRemove.length;
      while(--ridx>=0){
        componentNode.removeChild(toRemove[ridx]);
      }
    }

    // remove the content node from the DOM entirely
    parent.removeChild(contentNode);
  };


  /**
   *
   * @param component {Component}
   * @param componentNode {HTMLElement}
   * @param templateNodes {Array<HTMLElement>}
   */
  ko.transclusion.performTransclusion = function(component, componentNode, templateNodes){

    var contentNodes = getContentNodes(templateNodes);

    var length = contentNodes.length, i;

    var transcludeAll;
    for (i = 0; i < length; i++) {
      var contentNode = contentNodes[i],
        select = contentNode.getAttribute("select");

      if (select === null || select === "*"){
        // this can only happen once, and we need to do it last... so we cache until after loop
        transcludeAll = contentNode;
      } else {
        ko.transclusion.replaceContentNodeWithTranscludedNodes(select, contentNode, componentNode, component);
      }
    }
    if (transcludeAll){
      ko.transclusion.replaceContentNodeWithTranscludedNodes("*", transcludeAll, componentNode, component);
    }
  };

  ko.transclusion.cloneTemplateIntoElement = function(componentName, componentDefinition, element) {
    var template = componentDefinition['template'];
    if (!template) {
      throw new Error('Component \'' + componentName + '\' has no template');
    }

    var clonedNodesArray = ko.utils.cloneNodes(template);
    ko.transclusion.performTransclusion(componentDefinition, element, clonedNodesArray);
    ko.virtualElements.setDomNodeChildren(element, clonedNodesArray);
  }
})();
