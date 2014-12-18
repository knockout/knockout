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
        res.push.apply(res, found);
      }
    }
    return res;
  }

  /**
   * This is where the actual transclusino takes place. Given a contentNode
   * @method replaceContentNodeWithTranscludedNodes
   * @for ko.transclusion
   * @param contentNode {HTMLElement} - The content node which will be replaced/removed
   * @param componentNode {HTMLElement} - The
   */
  ko.transclusion.replaceContentNodeWithTranscludedNodes = function(select, contentNode, componentNode){
    var toMove,
      parent = contentNode.parentNode;

    if(select === "*"){
      // transclude everything
      toMove = componentNode.childNodes;
    } else if (select[0] == '.') {
      // get by class
      toMove = ko.transclusion.getElementsByClassName(select.substring(1), componentNode);
    } else {
      // get by tag name
      toMove = ko.transclusion.getElementsByTagName(select, componentNode);
    }

    var idx = toMove.length;
    var beforeThisNode = contentNode;
    while(--idx>=0){
      var move = toMove[idx];
      parent.insertBefore(move, beforeThisNode);
      beforeThisNode = move;
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
        ko.transclusion.replaceContentNodeWithTranscludedNodes(select, contentNode, componentNode);
      }
    }
    if (transcludeAll){
      ko.transclusion.replaceContentNodeWithTranscludedNodes("*", transcludeAll, componentNode);
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
