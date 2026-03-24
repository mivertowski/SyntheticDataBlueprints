# CLAUDE.md -- Developer Guidance for SyntheticDataBlueprints

## Project Overview

This repository contains curated FSM (Finite State Machine) and YAML blueprint definitions for use with [DataSynth](https://github.com/mivertowski/SyntheticData), a Rust-based synthetic enterprise data generator. It also includes an interactive explorer UI for browsing and visualizing the blueprints.

## Repository Layout

- `blueprints/fsm/` -- Event-sourced FSM definitions for audit methodologies (ISA, IIA-GIAS)
- `blueprints/generation/profiles/` -- Complete DataSynth YAML configs for specific use cases
- `blueprints/generation/scenarios/` -- Overlay configs for industry-specific fraud/audit scenarios
- `blueprints/generation/regional/` -- Country-specific naming and terminology templates
- `blueprints/causal/` -- Causal DAG definitions (macro → operational → financial outcomes)
- `explorer/` -- Single-page HTML/JS visualization app (vis-network, js-yaml)
- `schemas/` -- JSON validation schemas (planned)

## Key Conventions

### FSM Blueprint Schema (v1.0)

```yaml
schema_version: "1.0"
depth: standard | simplified | full
methodology:
  name: "..."
  version: "..."
  framework: "ISA" | "IIA-GIAS"
discriminators: { ... }
actors: [{ id, name, responsibilities }]
standards_catalog: [{ ref, title, binding }]
evidence_catalog: [{ id, name, type, lifecycle }]
phases: [{ id, name, order, description, gate }]
procedures: [{ id, phase, title, discriminators, aggregate, steps, preconditions, knowledge_refs }]
```

Each procedure's `aggregate` defines a state machine:
- `initial_state`, `states[]`, `transitions[{from_state, to_state, command, emits, guards}]`

Each `step` has: `id, order, action, actor, description, binding, command, emits, guards, evidence, standards, decisions`

### Generation Config Schema

Follows the DataSynth YAML schema. Top-level sections: `global`, `companies`, `chart_of_accounts`, `master_data`, `document_flows`, `fraud`, `data_quality`, `anomaly_injection`, `internal_controls`, `audit_standards`, `audit_fsm`, `temporal`, `scenario`, `output`.

See the DataSynth docs at `docs/src/configuration/yaml-schema.md` for the complete reference.

### Important Rules

- **No proprietary content**: All blueprints must be based on publicly available standards only (ISA, IIA-GIAS, COSO, SOX). Never include firm-specific methodology content.
- **Unique IDs**: All procedure IDs must be unique within a blueprint. Step IDs must be unique within a procedure.
- **Valid references**: Preconditions and knowledge_refs must reference existing procedure IDs.
- **Distribution sums**: Fraud type distributions and similar fields must sum to 1.0 (±0.01).
- **Rate bounds**: All rate/percentage fields must be in 0.0-1.0 range.

## Explorer UI

The explorer is a vanilla HTML/JS app (no build step). Dependencies loaded via CDN:
- vis-network 9.1.9 (graph visualization)
- js-yaml 4.1.0 (YAML parsing)

To run locally: `cd explorer && python3 -m http.server 8080`

When adding new blueprints, update the `BLUEPRINT_MANIFEST` in `explorer/js/app.js`.

## Common Tasks

### Adding a new blueprint
1. Create the YAML file in the appropriate `blueprints/` subdirectory
2. Add an entry to `BLUEPRINT_MANIFEST` in `explorer/js/app.js`
3. Update CHANGELOG.md

### Validating blueprints
```bash
# Using DataSynth CLI
datasynth validate --config path/to/blueprint.yaml

# YAML syntax check
python3 -c "import yaml; yaml.safe_load(open('path/to/file.yaml'))"
```

## Related Repositories

- **DataSynth** (`/home/michael/DEV/Repos/RustSyntheticData/SyntheticData`): The Rust generation engine that consumes these blueprints
- **AuditMethodology** (`/home/michael/DEV/Repos/Methodology/AuditMethodology`): Private extraction engine for methodology definitions (source for FSM patterns)
