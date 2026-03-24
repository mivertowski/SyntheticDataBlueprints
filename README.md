# SyntheticDataBlueprints

Curated FSM and YAML blueprint definitions for [DataSynth](https://github.com/mivertowski/SyntheticData) -- the high-performance Rust synthetic enterprise data generator.

This repository provides ready-to-use configurations for generating statistically realistic, fully interconnected financial data at scale, covering audit methodologies, fraud scenarios, process mining, ML training, and more.

## Repository Structure

```
SyntheticDataBlueprints/
├── blueprints/
│   ├── fsm/                              # Finite State Machine definitions
│   │   ├── external-audit/
│   │   │   ├── generic_fsa.yaml          # ISA-based Financial Statement Audit
│   │   │   └── overlay_default.yaml      # Generation overlay parameters
│   │   └── internal-audit/
│   │       └── generic_ia.yaml           # IIA-GIAS Internal Audit
│   ├── generation/                       # DataSynth generation configs
│   │   ├── profiles/                     # Complete use-case profiles
│   │   │   ├── fraud-detection-basic.yaml
│   │   │   ├── data-quality-testing.yaml
│   │   │   ├── ml-training-balanced.yaml
│   │   │   ├── process-mining-full.yaml
│   │   │   ├── comprehensive-demo.yaml
│   │   │   └── external-audit-engagement.yaml
│   │   ├── scenarios/                    # Industry & fraud scenario overlays
│   │   │   ├── audit/                    # Audit-specific scenarios
│   │   │   ├── manufacturing/            # Manufacturing fraud schemes
│   │   │   ├── retail/                   # Retail fraud & shrinkage
│   │   │   └── financial-services/       # Trading fraud & regulatory
│   │   └── regional/                     # Country-specific naming data
│   │       ├── german_manufacturing.yaml
│   │       ├── japanese_technology.yaml
│   │       ├── british_financial_services.yaml
│   │       ├── brazilian_retail.yaml
│   │       └── indian_healthcare.yaml
│   └── causal/                           # Causal DAG definitions
│       └── financial_process_dag.yaml
├── explorer/                             # Interactive visualization UI
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── app.js                        # Main application
│       ├── fsm-visualizer.js             # FSM graph renderer
│       ├── graph-utils.js                # Network interaction utils
│       └── export.js                     # YAML/JSON/Mermaid export
├── schemas/                              # Validation schemas (planned)
├── CHANGELOG.md
└── LICENSE                               # Apache 2.0
```

## Blueprint Types

### FSM Blueprints

Event-sourced Finite State Machine definitions for audit methodology lifecycle simulation. Each procedure is modeled as an aggregate with states, transitions, commands, guards, and emitted events.

| Blueprint | Framework | Phases | Procedures | Steps |
|-----------|-----------|--------|------------|-------|
| `generic_fsa.yaml` | ISA (International Standards on Auditing) | 3 | 9 | 24 |
| `generic_ia.yaml` | IIA-GIAS (Global Internal Audit Standards) | 9 | 34 | 82 |

**Key features:**
- Phase gates with procedure completion requirements
- Actor-based responsibility assignment (partner, manager, senior, staff)
- Standards catalog with ISA/GIAS paragraph-level traceability
- Evidence catalog with document lifecycle tracking
- Decision branching within procedure steps
- Precondition DAG for execution ordering

> **Note:** The blueprints included here are simplified reference versions. Full-depth IA (IIA-GIAS) and ISA blueprints with complete procedure coverage, enriched standard paragraphs, and extended overlays are available upon request from the author.

### Generation Profiles

Complete DataSynth YAML configurations targeting specific use cases:

| Profile | Industry | Purpose |
|---------|----------|---------|
| `fraud-detection-basic.yaml` | Retail | ML fraud model training (5% fraud rate) |
| `data-quality-testing.yaml` | Financial Services | DQ tool validation with systematic issues |
| `ml-training-balanced.yaml` | Manufacturing | Balanced anomaly detection with drift |
| `process-mining-full.yaml` | Manufacturing | OCEL 2.0 event logs for process mining |
| `comprehensive-demo.yaml` | Manufacturing | Full-featured demo (3 companies, all features) |
| `external-audit-engagement.yaml` | Manufacturing | ISA-based audit lifecycle with workpapers |

### Scenarios

Overlay configurations that inject specific conditions on top of a base profile:

**Audit scenarios:** scope change, control failure cascade, going concern trigger

**Industry scenarios:**
- Manufacturing: supplier fraud, inventory manipulation
- Retail: revenue manipulation, shrinkage fraud
- Financial services: trading fraud, regulatory violation

### Regional Templates

Country-specific naming and terminology data for generating culturally authentic synthetic data:
- German manufacturing (Maschinenbau, CNC, GmbH naming)
- Japanese technology (J-SOX aligned)
- British financial services (City of London terminology)
- Brazilian retail (Portuguese naming conventions)
- Indian healthcare (NABH compliance terms)

### Causal DAGs

Directed acyclic graphs modeling causal chains from macro conditions through operational and control parameters to financial outcomes. 25+ nodes covering GDP, inflation, staffing, controls, fraud, and audit methodology chains.

## Explorer UI

An interactive single-page application for browsing and visualizing blueprints.

### Running the Explorer

```bash
# Serve locally (required for YAML loading)
cd explorer
python3 -m http.server 8080

# Open in browser
open http://localhost:8080
```

### Features

- **Procedure Flow Graphs** -- Interactive DAG of audit procedures with phase coloring and dependency edges
- **State Diagrams** -- Per-procedure state machine visualization with transitions, commands, and guards
- **Config Tree Browser** -- Expandable/collapsible YAML tree with syntax highlighting
- **Causal DAG Visualization** -- Category-colored node graph with strength-weighted edges
- **Export** -- Download as YAML, JSON, or Mermaid diagram
- **Node Detail Inspector** -- Click any node to see steps, standards, evidence, and decisions
- **Dark/Light Theme** -- Persisted via localStorage

## Usage with DataSynth

### Quick Start

```bash
# Generate fraud detection data
datasynth generate --config blueprints/generation/profiles/fraud-detection-basic.yaml

# Generate with audit FSM
datasynth generate --config blueprints/generation/profiles/external-audit-engagement.yaml

# Validate a configuration
datasynth validate --config blueprints/generation/profiles/comprehensive-demo.yaml
```

### Using FSM Blueprints

FSM blueprints are referenced in DataSynth configurations via the `audit_fsm` section:

```yaml
audit_fsm:
  blueprint: path/to/blueprints/fsm/external-audit/generic_fsa.yaml
  overlay: path/to/blueprints/fsm/external-audit/overlay_default.yaml
  depth: standard
  discriminators:
    tiers: [core]
```

### Composing Scenarios

Scenarios are applied as overlays on top of a base profile:

```bash
datasynth generate \
  --config blueprints/generation/profiles/comprehensive-demo.yaml \
  --scenario blueprints/generation/scenarios/audit/control_failure_cascade.yaml
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-blueprint`)
3. Add your blueprint(s) to the appropriate directory
4. Ensure YAML validates against the DataSynth schema
5. Update the explorer manifest in `explorer/js/app.js` if adding new files
6. Submit a pull request

### Blueprint Authoring Guidelines

- All FSM blueprints must follow the `schema_version: "1.0"` format
- Procedures must have unique IDs within a blueprint
- Precondition references must point to valid procedure IDs
- Standards references should cite public standards only (no proprietary content)
- Generation profiles should include a `scenario` section with tags for discoverability

## License

Apache License 2.0 -- see [LICENSE](LICENSE) for details.

All blueprints in this repository are based on publicly available standards (ISA, IIA-GIAS, COSO, SOX) and contain no proprietary methodology content.
