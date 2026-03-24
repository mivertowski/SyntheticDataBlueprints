/**
 * Main application controller for the Blueprint Explorer.
 * Handles navigation, YAML loading, and panel switching.
 */

(() => {
  'use strict';

  // ── Blueprint registry ────────────────────────────────────────────
  // Since this is a local file-based app, we define the manifest here.
  // In production, this could be auto-generated from the file system.

  const BLUEPRINT_MANIFEST = {
    fsm: [
      {
        id: 'generic-fsa',
        name: 'Financial Statement Audit (ISA)',
        path: '../blueprints/fsm/external-audit/generic_fsa.yaml',
        type: 'fsm',
      },
      {
        id: 'generic-ia',
        name: 'Internal Audit (IIA-GIAS)',
        path: '../blueprints/fsm/internal-audit/generic_ia.yaml',
        type: 'fsm',
      },
    ],
    profiles: [
      { id: 'fraud-detection', name: 'Fraud Detection', path: '../blueprints/generation/profiles/fraud-detection-basic.yaml', type: 'config' },
      { id: 'data-quality', name: 'Data Quality Testing', path: '../blueprints/generation/profiles/data-quality-testing.yaml', type: 'config' },
      { id: 'ml-training', name: 'ML Training Balanced', path: '../blueprints/generation/profiles/ml-training-balanced.yaml', type: 'config' },
      { id: 'process-mining', name: 'Process Mining Full', path: '../blueprints/generation/profiles/process-mining-full.yaml', type: 'config' },
      { id: 'comprehensive-demo', name: 'Comprehensive Demo', path: '../blueprints/generation/profiles/comprehensive-demo.yaml', type: 'config' },
      { id: 'external-audit', name: 'External Audit Engagement', path: '../blueprints/generation/profiles/external-audit-engagement.yaml', type: 'config' },
    ],
    scenarios: [
      { id: 'audit-scope-change', name: 'Audit Scope Change', path: '../blueprints/generation/scenarios/audit/audit_scope_change.yaml', type: 'config' },
      { id: 'control-failure', name: 'Control Failure Cascade', path: '../blueprints/generation/scenarios/audit/control_failure_cascade.yaml', type: 'config' },
      { id: 'going-concern', name: 'Going Concern Trigger', path: '../blueprints/generation/scenarios/audit/going_concern_trigger.yaml', type: 'config' },
      { id: 'supplier-fraud', name: 'Supplier Fraud (Mfg)', path: '../blueprints/generation/scenarios/manufacturing/supplier_fraud.yaml', type: 'config' },
      { id: 'inventory-manip', name: 'Inventory Manipulation (Mfg)', path: '../blueprints/generation/scenarios/manufacturing/inventory_manipulation.yaml', type: 'config' },
      { id: 'revenue-manip', name: 'Revenue Manipulation (Retail)', path: '../blueprints/generation/scenarios/retail/revenue_manipulation.yaml', type: 'config' },
      { id: 'shrinkage-fraud', name: 'Shrinkage Fraud (Retail)', path: '../blueprints/generation/scenarios/retail/shrinkage_fraud.yaml', type: 'config' },
      { id: 'trading-fraud', name: 'Trading Fraud (FinServ)', path: '../blueprints/generation/scenarios/financial-services/trading_fraud.yaml', type: 'config' },
      { id: 'regulatory-violation', name: 'Regulatory Violation (FinServ)', path: '../blueprints/generation/scenarios/financial-services/regulatory_violation.yaml', type: 'config' },
    ],
    regional: [
      { id: 'german-mfg', name: 'German Manufacturing', path: '../blueprints/generation/regional/german_manufacturing.yaml', type: 'config' },
      { id: 'japanese-tech', name: 'Japanese Technology', path: '../blueprints/generation/regional/japanese_technology.yaml', type: 'config' },
      { id: 'british-finserv', name: 'British Financial Services', path: '../blueprints/generation/regional/british_financial_services.yaml', type: 'config' },
      { id: 'brazilian-retail', name: 'Brazilian Retail', path: '../blueprints/generation/regional/brazilian_retail.yaml', type: 'config' },
      { id: 'indian-healthcare', name: 'Indian Healthcare', path: '../blueprints/generation/regional/indian_healthcare.yaml', type: 'config' },
    ],
    causal: [
      { id: 'financial-dag', name: 'Financial Process DAG', path: '../blueprints/causal/financial_process_dag.yaml', type: 'causal' },
    ],
  };

  // ── State ─────────────────────────────────────────────────────────
  let currentView = null;
  let currentData = null;
  let currentType = null;
  let loadedCache = {};

  // ── Initialize ────────────────────────────────────────────────────
  function init() {
    buildNavigation();
    updateStats();
    setupEventListeners();
    applyTheme(localStorage.getItem('theme') || 'light');
  }

  function buildNavigation() {
    buildNavList('nav-fsm', BLUEPRINT_MANIFEST.fsm, 'fsm');
    buildNavList('nav-profiles', BLUEPRINT_MANIFEST.profiles, 'profile');
    buildNavList('nav-scenarios', BLUEPRINT_MANIFEST.scenarios, 'scenario');
    buildNavList('nav-regional', BLUEPRINT_MANIFEST.regional, 'config');
    buildNavList('nav-causal', BLUEPRINT_MANIFEST.causal, 'causal');
  }

  function buildNavList(containerId, items, badgeClass) {
    const ul = document.getElementById(containerId);
    items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item.name;
      li.dataset.id = item.id;
      li.dataset.path = item.path;
      li.dataset.type = item.type;

      const badge = document.createElement('span');
      badge.className = 'badge ' + badgeClass;
      badge.textContent = item.type.toUpperCase();
      li.appendChild(badge);

      li.addEventListener('click', () => loadBlueprint(item));
      ul.appendChild(li);
    });
  }

  function updateStats() {
    document.getElementById('stat-fsm').textContent = BLUEPRINT_MANIFEST.fsm.length;
    document.getElementById('stat-profiles').textContent = BLUEPRINT_MANIFEST.profiles.length;
    document.getElementById('stat-scenarios').textContent = BLUEPRINT_MANIFEST.scenarios.length;
    document.getElementById('stat-regional').textContent = BLUEPRINT_MANIFEST.regional.length;
  }

  function setupEventListeners() {
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('change', (e) => {
      applyTheme(e.target.value);
    });

    // Global export button
    document.getElementById('btn-export-all').addEventListener('click', () => {
      if (currentData) {
        Exporter.showExportModal(currentData, currentView, currentType);
      }
    });

    // FSM export
    document.getElementById('btn-fsm-export').addEventListener('click', () => {
      if (currentData) Exporter.showExportModal(currentData, currentView, 'fsm');
    });

    // Config export
    document.getElementById('btn-config-export').addEventListener('click', () => {
      if (currentData) Exporter.showExportModal(currentData, currentView, 'config');
    });

    // DAG export
    document.getElementById('btn-dag-export').addEventListener('click', () => {
      if (currentData) Exporter.showExportModal(currentData, currentView, 'causal');
    });

    // FSM view mode toggle
    document.getElementById('fsm-view-mode').addEventListener('change', (e) => {
      if (currentData && currentType === 'fsm') {
        renderFSM(currentData, e.target.value);
      }
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('theme-toggle').value = theme;
    localStorage.setItem('theme', theme);
  }

  // ── Loading ───────────────────────────────────────────────────────
  async function loadBlueprint(item) {
    // Update nav active state
    document.querySelectorAll('.nav-section li').forEach(li => li.classList.remove('active'));
    const activeLi = document.querySelector(`li[data-id="${item.id}"]`);
    if (activeLi) activeLi.classList.add('active');

    currentView = item.id;
    currentType = item.type;

    try {
      let data;
      if (loadedCache[item.path]) {
        data = loadedCache[item.path];
      } else {
        const resp = await fetch(item.path);
        if (!resp.ok) throw new Error('Failed to load: ' + resp.statusText);
        const text = await resp.text();
        data = jsyaml.load(text);
        loadedCache[item.path] = data;
      }

      currentData = data;

      switch (item.type) {
        case 'fsm':
          showPanel('fsm-panel');
          document.getElementById('fsm-title').textContent = item.name;
          renderFSMMeta(data);
          renderFSM(data, document.getElementById('fsm-view-mode').value);
          break;
        case 'causal':
          showPanel('dag-panel');
          document.getElementById('dag-title').textContent = item.name;
          document.getElementById('dag-detail').textContent = '';
          FSMVisualizer.renderCausalDAG(data, document.getElementById('dag-graph'));
          break;
        default:
          showPanel('config-panel');
          document.getElementById('config-title').textContent = item.name;
          renderConfigView(data);
          break;
      }
    } catch (err) {
      console.error('Failed to load blueprint:', err);
      showPanel('config-panel');
      document.getElementById('config-title').textContent = 'Error Loading';
      const tree = document.getElementById('config-tree');
      tree.textContent = 'Failed to load: ' + err.message +
        '\n\nNote: The explorer must be served via HTTP (not file://).' +
        '\nRun: python3 -m http.server 8080 --directory explorer/';
      document.getElementById('config-summary').textContent = '';
    }
  }

  function showPanel(panelId) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById(panelId).classList.add('active');
  }

  // ── FSM Rendering ─────────────────────────────────────────────────
  function renderFSMMeta(data) {
    const meta = document.getElementById('fsm-meta');
    meta.textContent = '';

    const methodology = data.methodology || {};
    const items = [
      ['Framework', methodology.framework || 'N/A'],
      ['Version', methodology.version || 'N/A'],
      ['Depth', data.depth || 'N/A'],
      ['Phases', (data.phases || []).length],
      ['Procedures', (data.procedures || []).length],
      ['Total Steps', (data.procedures || []).reduce((sum, p) => sum + (p.steps || []).length, 0)],
    ];

    items.forEach(([label, value]) => {
      const div = document.createElement('div');
      div.className = 'meta-item';
      const strong = document.createElement('strong');
      strong.textContent = label + ':';
      div.appendChild(strong);
      div.appendChild(document.createTextNode(' ' + value));
      meta.appendChild(div);
    });
  }

  function renderFSM(data, viewMode) {
    const container = document.getElementById('fsm-graph');
    const detailPanel = document.getElementById('fsm-detail');
    detailPanel.textContent = '';

    if (viewMode === 'state-diagram') {
      // Show first procedure's state diagram (user can click to switch)
      const firstProc = (data.procedures || [])[0];
      if (firstProc) {
        FSMVisualizer.renderStateDiagram(firstProc, container);
        // Show procedure selector
        detailPanel.textContent = '';
        const h4 = document.createElement('h4');
        h4.textContent = 'Select Procedure for State Diagram';
        detailPanel.appendChild(h4);
        (data.procedures || []).forEach(proc => {
          const btn = document.createElement('button');
          btn.textContent = proc.title;
          btn.style.cssText = 'margin:4px;padding:6px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-secondary);cursor:pointer;font-size:12px;color:var(--text-primary)';
          btn.addEventListener('click', () => {
            FSMVisualizer.renderStateDiagram(proc, container);
          });
          detailPanel.appendChild(btn);
        });
      }
    } else {
      FSMVisualizer.renderProcedureFlow(data, container);
    }
  }

  // ── Config Rendering ──────────────────────────────────────────────
  function renderConfigView(data) {
    const summary = document.getElementById('config-summary');
    const tree = document.getElementById('config-tree');
    summary.textContent = '';
    tree.textContent = '';

    // Summary tags
    if (data.scenario && data.scenario.tags) {
      data.scenario.tags.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'summary-tag';
        span.textContent = tag;
        summary.appendChild(span);
      });
    }

    if (data.global) {
      ['industry', 'period_months', 'group_currency'].forEach(key => {
        if (data.global[key]) {
          const span = document.createElement('span');
          span.className = 'summary-tag';
          span.textContent = key + ': ' + data.global[key];
          summary.appendChild(span);
        }
      });
    }

    // Render YAML tree
    renderYAMLTree(data, tree, 0);
  }

  function renderYAMLTree(obj, parent, depth) {
    if (obj === null || obj === undefined) return;

    if (typeof obj !== 'object') {
      const span = document.createElement('span');
      if (typeof obj === 'string') {
        span.className = 'tree-string';
        span.textContent = '"' + obj + '"';
      } else if (typeof obj === 'number') {
        span.className = 'tree-number';
        span.textContent = String(obj);
      } else if (typeof obj === 'boolean') {
        span.className = 'tree-boolean';
        span.textContent = String(obj);
      } else {
        span.className = 'tree-null';
        span.textContent = 'null';
      }
      parent.appendChild(span);
      return;
    }

    const entries = Array.isArray(obj) ?
      obj.map((v, i) => [i, v]) :
      Object.entries(obj);

    entries.forEach(([key, value]) => {
      const isComplex = value !== null && typeof value === 'object';
      const section = document.createElement('div');
      if (depth === 0) section.className = 'tree-section';

      const keySpan = document.createElement('span');
      keySpan.className = 'tree-key' + (isComplex && depth < 2 ? ' expanded' : '');
      keySpan.textContent = Array.isArray(obj) ? '[' + key + ']' : key + ':';

      if (isComplex) {
        const childDiv = document.createElement('div');
        childDiv.className = 'tree-children' + (depth >= 2 ? ' collapsed' : '');

        keySpan.addEventListener('click', () => {
          keySpan.classList.toggle('expanded');
          childDiv.classList.toggle('collapsed');
        });

        section.appendChild(keySpan);
        renderYAMLTree(value, childDiv, depth + 1);
        section.appendChild(childDiv);
      } else {
        section.appendChild(keySpan);
        const space = document.createTextNode(' ');
        section.appendChild(space);
        renderYAMLTree(value, section, depth + 1);
      }

      parent.appendChild(section);
    });
  }

  // ── Boot ──────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);
})();
