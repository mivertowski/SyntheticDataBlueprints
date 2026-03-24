/**
 * Graph utility functions for vis-network interaction.
 * Adapted from AuditMethodology visualization bindings.
 */

const GraphUtils = (() => {
  let highlightActive = false;
  let filterActive = false;
  let nodeColors = {};

  /**
   * Store original node colors for reset.
   */
  function cacheColors(nodes) {
    const allNodes = nodes.get({ returnType: 'Object' });
    for (const nodeId in allNodes) {
      if (allNodes[nodeId].color) {
        nodeColors[nodeId] = allNodes[nodeId].color;
      }
    }
  }

  /**
   * Highlight a node and its neighbourhood (2 degrees).
   */
  function neighbourhoodHighlight(network, nodes, params) {
    const allNodes = nodes.get({ returnType: 'Object' });

    if (params.nodes.length > 0) {
      highlightActive = true;
      const selectedNode = params.nodes[0];
      const degrees = 2;

      // Dim all nodes
      for (const nodeId in allNodes) {
        allNodes[nodeId].color = 'rgba(200,200,200,0.5)';
        if (allNodes[nodeId].hiddenLabel === undefined) {
          allNodes[nodeId].hiddenLabel = allNodes[nodeId].label;
          allNodes[nodeId].label = undefined;
        }
      }

      let connectedNodes = network.getConnectedNodes(selectedNode);
      let allConnected = [];

      // Second degree
      for (let i = 1; i < degrees; i++) {
        for (const cn of connectedNodes) {
          allConnected = allConnected.concat(network.getConnectedNodes(cn));
        }
      }

      // Second degree nodes: muted
      for (const id of allConnected) {
        allNodes[id].color = 'rgba(150,150,150,0.75)';
        if (allNodes[id].hiddenLabel !== undefined) {
          allNodes[id].label = allNodes[id].hiddenLabel;
          allNodes[id].hiddenLabel = undefined;
        }
      }

      // First degree nodes: original color
      for (const id of connectedNodes) {
        allNodes[id].color = nodeColors[id] || allNodes[id].color;
        if (allNodes[id].hiddenLabel !== undefined) {
          allNodes[id].label = allNodes[id].hiddenLabel;
          allNodes[id].hiddenLabel = undefined;
        }
      }

      // Selected node: full color
      allNodes[selectedNode].color = nodeColors[selectedNode] || allNodes[selectedNode].color;
      if (allNodes[selectedNode].hiddenLabel !== undefined) {
        allNodes[selectedNode].label = allNodes[selectedNode].hiddenLabel;
        allNodes[selectedNode].hiddenLabel = undefined;
      }
    } else if (highlightActive) {
      // Reset
      for (const nodeId in allNodes) {
        allNodes[nodeId].color = nodeColors[nodeId] || allNodes[nodeId].color;
        if (allNodes[nodeId].hiddenLabel !== undefined) {
          allNodes[nodeId].label = allNodes[nodeId].hiddenLabel;
          allNodes[nodeId].hiddenLabel = undefined;
        }
      }
      highlightActive = false;
    }

    const updateArray = Object.values(allNodes);
    nodes.update(updateArray);
  }

  /**
   * Filter to show only selected nodes.
   */
  function filterHighlight(network, nodes, selectedNodeIds) {
    const allNodes = nodes.get({ returnType: 'Object' });

    if (selectedNodeIds.length > 0) {
      filterActive = true;
      for (const nodeId in allNodes) {
        allNodes[nodeId].hidden = true;
        if (allNodes[nodeId].savedLabel === undefined) {
          allNodes[nodeId].savedLabel = allNodes[nodeId].label;
          allNodes[nodeId].label = undefined;
        }
      }

      for (const id of selectedNodeIds) {
        if (allNodes[id]) {
          allNodes[id].hidden = false;
          if (allNodes[id].savedLabel !== undefined) {
            allNodes[id].label = allNodes[id].savedLabel;
            allNodes[id].savedLabel = undefined;
          }
        }
      }
    } else if (filterActive) {
      for (const nodeId in allNodes) {
        allNodes[nodeId].hidden = false;
        if (allNodes[nodeId].savedLabel !== undefined) {
          allNodes[nodeId].label = allNodes[nodeId].savedLabel;
          allNodes[nodeId].savedLabel = undefined;
        }
      }
      filterActive = false;
    }

    nodes.update(Object.values(allNodes));
  }

  return { cacheColors, neighbourhoodHighlight, filterHighlight, nodeColors };
})();
