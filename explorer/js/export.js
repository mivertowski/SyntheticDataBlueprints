/**
 * Export functionality for blueprints.
 * Supports YAML, JSON, and Mermaid diagram output formats.
 */

const Exporter = (() => {
  let currentData = null;
  let currentFormat = 'yaml';
  let currentName = 'blueprint';

  /**
   * Generate Mermaid state diagram from an FSM blueprint.
   */
  function toMermaidStateDiagram(blueprint) {
    const lines = ['stateDiagram-v2'];
    const procedures = blueprint.procedures || [];

    procedures.forEach(proc => {
      const agg = proc.aggregate;
      if (!agg) return;

      lines.push('');
      lines.push(`  state "${proc.title}" as ${proc.id} {`);

      if (agg.initial_state) {
        lines.push(`    [*] --> ${agg.initial_state}`);
      }

      (agg.transitions || []).forEach(t => {
        const label = t.command + (t.guards && t.guards.length ? ` [${t.guards.join(', ')}]` : '');
        lines.push(`    ${t.from_state} --> ${t.to_state}: ${label}`);
      });

      lines.push('  }');
    });

    return lines.join('\n');
  }

  /**
   * Generate Mermaid flowchart from procedure dependencies.
   */
  function toMermaidFlowchart(blueprint) {
    const lines = ['flowchart LR'];
    const procedures = blueprint.procedures || [];
    const phases = blueprint.phases || [];

    // Group by phase
    const phaseGroups = {};
    phases.forEach(p => { phaseGroups[p.id] = { name: p.name, procs: [] }; });

    procedures.forEach(proc => {
      if (phaseGroups[proc.phase]) {
        phaseGroups[proc.phase].procs.push(proc);
      }
    });

    // Render subgraphs
    for (const [phaseId, group] of Object.entries(phaseGroups)) {
      lines.push(`  subgraph ${phaseId}["${group.name}"]`);
      group.procs.forEach(proc => {
        lines.push(`    ${proc.id}["${proc.title}"]`);
      });
      lines.push('  end');
    }

    // Render edges
    procedures.forEach(proc => {
      (proc.preconditions || []).forEach(pre => {
        lines.push(`  ${pre} --> ${proc.id}`);
      });
      (proc.knowledge_refs || []).forEach(ref => {
        lines.push(`  ${ref} -.-> ${proc.id}`);
      });
    });

    return lines.join('\n');
  }

  /**
   * Generate Mermaid for a causal DAG.
   */
  function toMermaidCausalDAG(dagData) {
    const lines = ['flowchart LR'];
    const categories = {};

    (dagData.nodes || []).forEach(n => {
      if (!categories[n.category]) categories[n.category] = [];
      categories[n.category].push(n);
    });

    for (const [cat, nodes] of Object.entries(categories)) {
      lines.push(`  subgraph ${cat}["${cat.charAt(0).toUpperCase() + cat.slice(1)}"]`);
      nodes.forEach(n => {
        const shape = n.interventionable ? `["${n.label}"]` : `("${n.label}")`;
        lines.push(`    ${n.id}${shape}`);
      });
      lines.push('  end');
    }

    (dagData.edges || []).forEach(e => {
      const label = e.mechanism ? `|"${e.strength}"|` : '';
      lines.push(`  ${e.from} -->${label} ${e.to}`);
    });

    return lines.join('\n');
  }

  /**
   * Format data for export.
   */
  function formatExport(data, format, type) {
    switch (format) {
      case 'yaml':
        return jsyaml.dump(data, { indent: 2, lineWidth: 120, noRefs: true });
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'mermaid':
        if (type === 'fsm') return toMermaidFlowchart(data);
        if (type === 'causal') return toMermaidCausalDAG(data);
        return '%%  Mermaid export not available for this type';
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Show the export modal.
   */
  function showExportModal(data, name, type) {
    currentData = data;
    currentName = name || 'blueprint';
    currentFormat = 'yaml';

    const modal = document.getElementById('export-modal');
    const preview = document.getElementById('export-preview');

    preview.textContent = formatExport(data, 'yaml', type);
    modal.classList.remove('hidden');

    // Wire up format buttons
    document.querySelectorAll('.export-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.format === 'yaml') btn.classList.add('active');

      // Clone to remove old listeners
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      newBtn.addEventListener('click', () => {
        currentFormat = newBtn.dataset.format;
        document.querySelectorAll('.export-btn').forEach(b => b.classList.remove('active'));
        newBtn.classList.add('active');
        preview.textContent = formatExport(data, currentFormat, type);
      });
    });

    // Copy button
    const copyBtn = document.getElementById('btn-copy-export');
    const newCopy = copyBtn.cloneNode(true);
    copyBtn.parentNode.replaceChild(newCopy, copyBtn);
    newCopy.addEventListener('click', () => {
      navigator.clipboard.writeText(preview.textContent).then(() => {
        newCopy.textContent = 'Copied!';
        setTimeout(() => { newCopy.textContent = 'Copy to Clipboard'; }, 2000);
      });
    });

    // Download button
    const dlBtn = document.getElementById('btn-download-export');
    const newDl = dlBtn.cloneNode(true);
    dlBtn.parentNode.replaceChild(newDl, dlBtn);
    newDl.addEventListener('click', () => {
      const ext = currentFormat === 'mermaid' ? 'mmd' : currentFormat;
      const blob = new Blob([preview.textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentName}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Close button
    const closeBtn = document.getElementById('modal-close');
    const newClose = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newClose, closeBtn);
    newClose.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }

  return { showExportModal, formatExport, toMermaidFlowchart, toMermaidStateDiagram };
})();
