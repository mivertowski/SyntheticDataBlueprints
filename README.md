# SyntheticDataBlueprints

Curated FSM and YAML blueprint definitions for [DataSynth](https://github.com/mivertowski/SyntheticData) — the high-performance Rust synthetic enterprise data generator.

This repository provides ready-to-use audit methodology blueprints, generation profiles, fraud scenarios, and causal DAGs for generating statistically realistic, fully interconnected financial data at scale.

## Repository Structure

```
SyntheticDataBlueprints/
├── blueprints/
│   ├── fsm/                              # Finite State Machine definitions
│   │   ├── big4/                         # Big 4 ISA-complete firm-style blueprints
│   │   │   ├── kpmg_clara.yaml           # KPMG Clara (44 procs, 728 steps)
│   │   │   ├── pwc_aura.yaml            # PwC Aura/Halo (44 procs, 729 steps)
│   │   │   ├── deloitte_omnia.yaml      # Deloitte Omnia (46 procs, 733 steps)
│   │   │   └── ey_gam_lite.yaml         # EY GAM Lite (52 procs, 757 steps)
│   │   ├── external-audit/
│   │   │   ├── generic_fsa.yaml          # Generic ISA Financial Statement Audit
│   │   │   ├── overlay_default.yaml      # Default generation overlay
│   │   │   ├── overlay_thorough.yaml     # Thorough engagement overlay
│   │   │   └── overlay_rushed.yaml       # Rushed engagement overlay
│   │   └── internal-audit/
│   │       └── generic_ia.yaml           # IIA-GIAS Internal Audit (34 procs, 82 steps)
│   ├── generation/                       # DataSynth generation configs
│   │   ├── profiles/                     # Complete use-case profiles
│   │   ├── scenarios/                    # Industry & fraud scenario overlays
│   │   └── regional/                     # Country-specific naming data
│   └── causal/                           # Causal DAG definitions
├── explorer/                             # Interactive visualization UI
├── schemas/                              # Validation schemas (planned)
├── CHANGELOG.md
└── LICENSE                               # Apache 2.0
```

## Big 4 Methodology Blueprints

ISA-complete audit methodology blueprints styled after each Big 4 firm's publicly documented platform and approach. Each blueprint contains 37 ISA procedures (one per standard, 702 requirement-level steps) plus firm-specific extra procedures reflecting documented platform capabilities.

| Blueprint | Firm | Procedures | Steps | Events | Artifacts | Firm-Specific Extras |
|-----------|------|-----------|-------|--------|-----------|---------------------|
| `kpmg_clara.yaml` | KPMG | 44 | 728 | 891 | 30,371 | Sentinel independence, MindBridge AI scoring, SoD analysis, forensic analytics, EQCR multi-point review, FRA disclosure |
| `pwc_aura.yaml` | PwC | 44 | 729 | 976 | 37,055 | FRISK 13-factor assessment, Halo journal/population/3-way/outlier analytics, QRP hot review, ECR |
| `deloitte_omnia.yaml` | Deloitte | 46 | 733 | 958 | 34,236 | Cortex data ingestion, Argus ML extraction, DARTbot research, Spotlight analytics/benchmarking, iConfirm, Trustworthy AI gate |
| `ey_gam_lite.yaml` | EY | 52 | 757 | 955 | 44,641 | Canvas risk/materiality, Helix analytics, Atlas methodology, specialist coordination, EQR, digital audit, GAM compliance |

**Every step** is annotated with:
- **`judgment_level`**: `data_only` (fully automatable), `ai_assistable` (AI drafts, human reviews), or `human_required` (professional skepticism needed)
- **`ai_capabilities`**: what AI tools/techniques apply to this step
- **`human_responsibilities`**: what the auditor must personally decide or approve

### Judgment Level Distribution

| Firm | Data-Only | AI-Assistable | Human-Required |
|------|-----------|--------------|----------------|
| KPMG Clara | 11% | 13% | 75% |
| PwC Aura | 11% | 13% | 76% |
| Deloitte Omnia | 12% | 14% | 74% |
| EY GAM Lite | 11% | 14% | 74% |

> **Note**: These blueprints are derived from public ISA standards with firm-specific flavours based on publicly available documentation. They are not scraped from proprietary firm methodologies and should be understood as ISA-based approximations.

## Generic Audit Blueprints

| Blueprint | Framework | Phases | Procedures | Steps | Description |
|-----------|-----------|--------|------------|-------|-------------|
| `generic_fsa.yaml` | ISA | 3 | 9 | 24 | Compact Financial Statement Audit |
| `generic_ia.yaml` | IIA-GIAS | 9 | 34 | 82 | Internal Audit (96.2% GIAS coverage) |

## Generation Overlays

Overlays control simulation parameters without changing the methodology blueprint:

| Overlay | Revision Probability | Timing (mu hours) | Anomaly Rate | Cost Multiplier |
|---------|---------------------|-------------------|-------------|-----------------|
| `overlay_default.yaml` | 15% | 24h | ~5% | 1.0x |
| `overlay_thorough.yaml` | 30% | 40h | ~2% | 1.5x |
| `overlay_rushed.yaml` | 5% | 8h | ~15% | 0.6x |

## Key Features

All FSM blueprints include:

- **Phase gates** with procedure completion requirements
- **Precondition DAGs** for execution ordering (no cycles)
- **4-state FSM aggregates** per procedure: not_started → in_progress → under_review → completed
- **Actor roles** with firm-specific naming (partner, manager, senior, staff + EQR/QRP/specialists)
- **Standards catalog** with ISA paragraph-level traceability
- **Evidence catalog** with document lifecycle tracking (draft → under_review → finalized)
- **Decision branching** within procedure steps
- **Discriminator filtering** for scope control (tiers, categories)
- **Cost model** with base_hours and required_roles per procedure
- **Iteration limits** configurable per procedure for revision loop control

## Usage with DataSynth

### CLI Quick Start

```bash
# Run a KPMG-style audit engagement
datasynth-data audit run --blueprint builtin:kpmg --overlay builtin:default --output ./kpmg_output

# Validate a custom blueprint
datasynth-data audit validate --blueprint path/to/custom_blueprint.yaml

# Inspect blueprint structure
datasynth-data audit info --blueprint builtin:pwc

# Generate benchmark dataset
datasynth-data audit benchmark --complexity medium --output ./benchmark/
```

### Configuration Reference

```yaml
audit:
  enabled: true
  fsm:
    enabled: true
    blueprint: builtin:kpmg    # builtin:fsa, builtin:ia, builtin:kpmg, builtin:pwc,
                                # builtin:deloitte, builtin:ey_gam_lite, or file path
    overlay: builtin:default   # builtin:default, builtin:thorough, builtin:rushed, or file path
```

### Programmatic Usage (Rust)

```rust
use datasynth_audit_fsm::loader::{BlueprintWithPreconditions, load_overlay, OverlaySource, BuiltinOverlay};
use datasynth_audit_fsm::engine::AuditFsmEngine;
use datasynth_audit_fsm::context::EngagementContext;

let bwp = BlueprintWithPreconditions::load_builtin_kpmg().unwrap();
let overlay = load_overlay(&OverlaySource::Builtin(BuiltinOverlay::Default)).unwrap();
let mut engine = AuditFsmEngine::new(bwp, overlay, ChaCha8Rng::seed_from_u64(42));
let result = engine.run_engagement(&EngagementContext::test_default()).unwrap();

println!("Events: {}, Artifacts: {}", result.event_log.len(), result.artifacts.total_artifacts());
```

## Generation Profiles

Complete DataSynth YAML configurations targeting specific use cases:

| Profile | Industry | Purpose |
|---------|----------|---------|
| `fraud-detection-basic.yaml` | Retail | ML fraud model training (5% fraud rate) |
| `data-quality-testing.yaml` | Financial Services | DQ tool validation with systematic issues |
| `ml-training-balanced.yaml` | Manufacturing | Balanced anomaly detection with drift |
| `process-mining-full.yaml` | Manufacturing | OCEL 2.0 event logs for process mining |
| `comprehensive-demo.yaml` | Manufacturing | Full-featured demo (3 companies, all features) |
| `external-audit-engagement.yaml` | Manufacturing | ISA-based audit lifecycle with workpapers |

## Explorer UI

An interactive single-page application for browsing and visualizing blueprints.

```bash
cd explorer && python3 -m http.server 8080
# Open http://localhost:8080
```

Features: procedure flow graphs, state diagrams, config tree browser, causal DAG visualization, export (YAML/JSON/Mermaid), dark/light theme.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add your blueprint(s) to the appropriate directory
4. Ensure YAML validates with `datasynth-data audit validate --blueprint your_file.yaml`
5. Submit a pull request

### Blueprint Authoring Guidelines

- All FSM blueprints must follow `schema_version: "1.0"` format
- Procedures must have unique IDs within a blueprint
- Precondition references must point to valid procedure IDs (no cycles)
- Standards references should cite public standards only (no proprietary content)
- Every step should have `judgment_level` set for LLM interaction classification
- Include `base_hours` and `required_roles` on procedures for cost model support

## License

Apache License 2.0 — see [LICENSE](LICENSE) for details.

All blueprints in this repository are based on publicly available standards (ISA, IIA-GIAS, COSO, SOX) and publicly documented firm platform capabilities. They contain no proprietary methodology content.
