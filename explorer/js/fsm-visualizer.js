/**
 * FSM Blueprint Visualizer
 * Renders procedure flow graphs and state diagrams from FSM YAML blueprints.
 */

const FSMVisualizer = (() => {
  let currentNetwork = null;
  let currentNodes = null;
  let currentEdges = null;
  let currentBlueprint = null;

  const PHASE_COLORS = {
    planning:   { background: '#dbeafe', border: '#3b82f6', font: '#1e40af' },
    execution:  { background: '#d1fae5', border: '#10b981', font: '#065f46' },
    completion: { background: '#fef3c7', border: '#f59e0b', font: '#92400e' },
    default:    { background: '#f1f5f9', border: '#94a3b8', font: '#475569' },
  };

  const STATE_COLORS = {
    not_started:  { background: '#f1f5f9', border: '#94a3b8' },
    in_progress:  { background: '#dbeafe', border: '#3b82f6' },
    under_review: { background: '#fef3c7', border: '#f59e0b' },
    completed:    { background: '#d1fae5', border: '#10b981' },
    blocked:      { background: '#fee2e2', border: '#ef4444' },
  };

  /**
   * Escape HTML special characters to prevent XSS.
   */
  function esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Render procedure flow graph (DAG of procedures with phase grouping).
   */
  function renderProcedureFlow(blueprint, container) {
    currentBlueprint = blueprint;
    const procedures = blueprint.procedures || [];
    const phases = blueprint.phases || [];

    const nodesArray = [];
    const edgesArray = [];
    const phaseMap = {};

    phases.forEach(p => { phaseMap[p.id] = p; });

    procedures.forEach((proc) => {
      const colors = PHASE_COLORS[proc.phase] || PHASE_COLORS.default;
      const stepCount = (proc.steps || []).length;

      nodesArray.push({
        id: proc.id,
        label: `${proc.title}\n(${stepCount} steps)`,
        shape: 'box',
        color: { background: colors.background, border: colors.border },
        font: { color: colors.font, size: 13, face: '-apple-system, sans-serif' },
        borderWidth: 2,
        margin: 10,
        shadow: true,
        procedureData: proc,
        group: proc.phase,
      });

      (proc.preconditions || []).forEach(pre => {
        edgesArray.push({
          from: pre,
          to: proc.id,
          arrows: 'to',
          color: { color: '#94a3b8', highlight: '#3b82f6' },
          smooth: { type: 'cubicBezier' },
          width: 2,
        });
      });

      (proc.knowledge_refs || []).forEach(ref => {
        edgesArray.push({
          from: ref,
          to: proc.id,
          arrows: 'to',
          dashes: true,
          color: { color: '#cbd5e1' },
          smooth: { type: 'cubicBezier' },
          width: 1,
          title: 'knowledge reference',
        });
      });
    });

    currentNodes = new vis.DataSet(nodesArray);
    currentEdges = new vis.DataSet(edgesArray);

    const options = {
      layout: {
        hierarchical: {
          direction: 'LR',
          sortMethod: 'directed',
          levelSeparation: 200,
          nodeSpacing: 100,
          treeSpacing: 120,
        },
      },
      physics: false,
      interaction: { hover: true, tooltipDelay: 200 },
      nodes: { borderWidthSelected: 3 },
      edges: { smooth: { type: 'cubicBezier', forceDirection: 'horizontal' } },
    };

    currentNetwork = new vis.Network(container, { nodes: currentNodes, edges: currentEdges }, options);
    GraphUtils.cacheColors(currentNodes);

    currentNetwork.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = currentNodes.get(nodeId);
        if (node && node.procedureData) {
          showProcedureDetail(node.procedureData, blueprint);
        }
      }
      GraphUtils.neighbourhoodHighlight(currentNetwork, currentNodes, params);
    });

    return currentNetwork;
  }

  /**
   * Render state diagram for a single procedure.
   */
  function renderStateDiagram(procedure, container) {
    const agg = procedure.aggregate;
    if (!agg) return;

    const nodesArray = [];
    const edgesArray = [];

    (agg.states || []).forEach(state => {
      const colors = STATE_COLORS[state] || STATE_COLORS.not_started;
      const isInitial = state === agg.initial_state;

      nodesArray.push({
        id: state,
        label: state.replace(/_/g, ' '),
        shape: isInitial ? 'diamond' : 'box',
        color: { background: colors.background, border: colors.border },
        font: { size: 13 },
        borderWidth: isInitial ? 3 : 2,
        shadow: true,
        margin: 8,
      });
    });

    (agg.transitions || []).forEach(t => {
      edgesArray.push({
        from: t.from_state,
        to: t.to_state,
        arrows: 'to',
        label: t.command,
        font: { size: 10, align: 'top', color: '#64748b' },
        color: { color: '#3b82f6' },
        smooth: { type: 'curvedCW', roundness: 0.2 },
        width: 2,
        title: `Emits: ${t.emits}\nGuards: ${(t.guards || []).join(', ') || 'none'}`,
      });
    });

    const nodes = new vis.DataSet(nodesArray);
    const edges = new vis.DataSet(edgesArray);

    return new vis.Network(container, { nodes, edges }, {
      layout: {
        hierarchical: {
          direction: 'LR',
          sortMethod: 'directed',
          levelSeparation: 180,
          nodeSpacing: 80,
        },
      },
      physics: false,
      interaction: { hover: true },
    });
  }

  /**
   * Show procedure detail in the detail panel using safe DOM construction.
   */
  function showProcedureDetail(proc, blueprint) {
    const panel = document.getElementById('fsm-detail');
    // Clear previous content
    panel.textContent = '';

    const h3 = document.createElement('h3');
    h3.textContent = proc.title;
    panel.appendChild(h3);

    // Phase + discriminator tags
    const tagRow = document.createElement('p');
    const phaseTag = document.createElement('span');
    phaseTag.className = 'tag actor';
    phaseTag.textContent = 'Phase: ' + proc.phase;
    tagRow.appendChild(phaseTag);
    if (proc.discriminators) {
      (proc.discriminators.tiers || []).forEach(t => {
        const tag = document.createElement('span');
        tag.className = 'tag guidance';
        tag.textContent = t;
        tagRow.appendChild(tag);
      });
    }
    panel.appendChild(tagRow);

    // State machine summary
    const agg = proc.aggregate || {};
    const smHeader = document.createElement('h4');
    smHeader.textContent = 'State Machine';
    panel.appendChild(smHeader);

    const smCard = document.createElement('div');
    smCard.className = 'step-card';
    const smInitial = document.createElement('div');
    smInitial.textContent = 'Initial: ' + (agg.initial_state || 'N/A');
    smCard.appendChild(smInitial);
    const smStates = document.createElement('div');
    smStates.textContent = 'States: ' + (agg.states || []).join(' \u2192 ');
    smCard.appendChild(smStates);
    const smTrans = document.createElement('div');
    smTrans.textContent = 'Transitions: ' + (agg.transitions || []).length;
    smCard.appendChild(smTrans);
    panel.appendChild(smCard);

    // Steps
    const stepsHeader = document.createElement('h4');
    stepsHeader.textContent = 'Steps';
    panel.appendChild(stepsHeader);

    (proc.steps || []).forEach(step => {
      const card = document.createElement('div');
      card.className = 'step-card';

      const header = document.createElement('div');
      header.className = 'step-header';
      const title = document.createElement('strong');
      title.textContent = step.order + '. ' + step.action;
      header.appendChild(title);
      const actorTag = document.createElement('span');
      actorTag.className = 'tag actor';
      actorTag.textContent = step.actor;
      header.appendChild(actorTag);
      card.appendChild(header);

      if (step.description) {
        const desc = document.createElement('p');
        desc.textContent = step.description.trim();
        card.appendChild(desc);
      }

      const bindingTag = document.createElement('span');
      bindingTag.className = 'tag ' + (step.binding || 'guidance');
      bindingTag.textContent = step.binding || 'guidance';
      card.appendChild(bindingTag);

      (step.standards || []).forEach(s => {
        const sTag = document.createElement('span');
        sTag.className = 'tag requirement';
        sTag.textContent = s.ref + ' \u00A7' + (s.paragraphs || []).join(',');
        card.appendChild(sTag);
      });

      if (step.evidence) {
        (step.evidence.outputs || []).forEach(e => {
          const eTag = document.createElement('span');
          eTag.className = 'tag evidence';
          eTag.textContent = e.ref + ' (' + e.type + ')';
          card.appendChild(eTag);
        });
      }

      if (step.decisions && step.decisions.length > 0) {
        const dDiv = document.createElement('div');
        dDiv.style.cssText = 'margin-top:8px;font-size:12px;color:var(--text-secondary)';
        step.decisions.forEach(d => {
          const em = document.createElement('em');
          em.textContent = 'Decision: ' + d.condition;
          dDiv.appendChild(em);
          dDiv.appendChild(document.createElement('br'));
          (d.branches || []).forEach(b => {
            const span = document.createElement('span');
            span.textContent = '  ' + b.label + ': ' + b.description;
            dDiv.appendChild(span);
            dDiv.appendChild(document.createElement('br'));
          });
        });
        card.appendChild(dDiv);
      }

      panel.appendChild(card);
    });

    // Preconditions
    if (proc.preconditions && proc.preconditions.length > 0) {
      const preHeader = document.createElement('h4');
      preHeader.textContent = 'Preconditions';
      panel.appendChild(preHeader);
      const preP = document.createElement('p');
      preP.textContent = proc.preconditions.join(', ');
      panel.appendChild(preP);
    }
  }

  /**
   * Render a causal DAG.
   */
  function renderCausalDAG(dagData, container) {
    const CATEGORY_COLORS = {
      macro:       { background: '#fef3c7', border: '#f59e0b' },
      operational: { background: '#dbeafe', border: '#3b82f6' },
      control:     { background: '#fce7f3', border: '#ec4899' },
      financial:   { background: '#d1fae5', border: '#10b981' },
      outcome:     { background: '#fee2e2', border: '#ef4444' },
      audit:       { background: '#e0e7ff', border: '#6366f1' },
    };

    const nodesArray = (dagData.nodes || []).map(n => ({
      id: n.id,
      label: n.label,
      shape: n.interventionable ? 'box' : 'ellipse',
      color: CATEGORY_COLORS[n.category] || CATEGORY_COLORS.operational,
      font: { size: 12 },
      borderWidth: n.interventionable ? 3 : 1,
      shadow: true,
      title: `Category: ${n.category}\nBaseline: ${n.baseline_value}\nBounds: [${n.bounds.join(', ')}]\nInterventionable: ${n.interventionable}`,
      nodeData: n,
    }));

    const edgesArray = (dagData.edges || []).map(e => ({
      from: e.from,
      to: e.to,
      arrows: 'to',
      label: e.strength ? `${e.strength}` : '',
      font: { size: 9, color: '#94a3b8' },
      color: { color: '#94a3b8', highlight: '#3b82f6' },
      width: Math.max(1, (e.strength || 0.5) * 3),
      smooth: { type: 'cubicBezier' },
      title: `${e.mechanism || ''}\nTransfer: ${e.transfer?.type || 'linear'}\nLag: ${e.lag_months || 0} months`,
    }));

    const nodes = new vis.DataSet(nodesArray);
    const edges = new vis.DataSet(edgesArray);

    const network = new vis.Network(container, { nodes, edges }, {
      layout: {
        hierarchical: {
          direction: 'LR',
          sortMethod: 'directed',
          levelSeparation: 200,
          nodeSpacing: 80,
        },
      },
      physics: false,
      interaction: { hover: true, tooltipDelay: 200 },
    });

    GraphUtils.cacheColors(nodes);

    network.on('click', (params) => {
      GraphUtils.neighbourhoodHighlight(network, nodes, params);
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = nodes.get(nodeId);
        if (node && node.nodeData) {
          showDAGNodeDetail(node.nodeData, dagData);
        }
      }
    });

    return network;
  }

  function showDAGNodeDetail(nodeData, dagData) {
    const panel = document.getElementById('dag-detail');
    panel.textContent = '';

    const h3 = document.createElement('h3');
    h3.textContent = nodeData.label;
    panel.appendChild(h3);

    const card = document.createElement('div');
    card.className = 'step-card';
    const fields = [
      ['ID', nodeData.id],
      ['Category', nodeData.category],
      ['Baseline', nodeData.baseline_value],
      ['Bounds', '[' + nodeData.bounds.join(', ') + ']'],
      ['Interventionable', nodeData.interventionable],
    ];
    fields.forEach(([k, v]) => {
      const div = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = k + ': ';
      div.appendChild(strong);
      div.appendChild(document.createTextNode(String(v)));
      card.appendChild(div);
    });
    if (nodeData.config_bindings && nodeData.config_bindings.length) {
      const div = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = 'Config Bindings: ';
      div.appendChild(strong);
      div.appendChild(document.createTextNode(nodeData.config_bindings.join(', ')));
      card.appendChild(div);
    }
    panel.appendChild(card);

    // Incoming edges
    const incoming = (dagData.edges || []).filter(e => e.to === nodeData.id);
    if (incoming.length) {
      const h4 = document.createElement('h4');
      h4.textContent = 'Incoming Edges';
      panel.appendChild(h4);
      incoming.forEach(e => {
        const eCard = document.createElement('div');
        eCard.className = 'step-card';
        const lines = [
          e.from + ' \u2192 ' + e.to,
          'Transfer: ' + (e.transfer?.type || 'linear') + ', Strength: ' + e.strength,
          'Lag: ' + (e.lag_months || 0) + ' months',
          e.mechanism || '',
        ];
        lines.forEach(line => {
          const div = document.createElement('div');
          div.textContent = line;
          eCard.appendChild(div);
        });
        panel.appendChild(eCard);
      });
    }

    // Outgoing edges
    const outgoing = (dagData.edges || []).filter(e => e.from === nodeData.id);
    if (outgoing.length) {
      const h4 = document.createElement('h4');
      h4.textContent = 'Outgoing Edges';
      panel.appendChild(h4);
      outgoing.forEach(e => {
        const eCard = document.createElement('div');
        eCard.className = 'step-card';
        const lines = [
          e.from + ' \u2192 ' + e.to,
          'Transfer: ' + (e.transfer?.type || 'linear') + ', Strength: ' + e.strength,
          'Lag: ' + (e.lag_months || 0) + ' months',
          e.mechanism || '',
        ];
        lines.forEach(line => {
          const div = document.createElement('div');
          div.textContent = line;
          eCard.appendChild(div);
        });
        panel.appendChild(eCard);
      });
    }
  }

  return {
    renderProcedureFlow,
    renderStateDiagram,
    renderCausalDAG,
    getCurrentBlueprint: () => currentBlueprint,
  };
})();
