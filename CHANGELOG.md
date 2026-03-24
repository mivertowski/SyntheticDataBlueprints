# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2026-03-24

### Added

**FSM Blueprints**
- Generic Financial Statement Audit (ISA-based) -- 3 phases, 9 procedures, 24 steps
- Generic Internal Audit (IIA-GIAS) -- 9 phases, 34 procedures, 82 steps
- Default external audit overlay with generation parameters (materiality, sampling, timing, anomalies)

**Generation Profiles**
- Fraud Detection Basic -- retail, 5% fraud rate, ML training labels
- Data Quality Testing -- financial services, systematic DQ issues
- ML Training Balanced -- manufacturing, 10% anomaly rate with temporal drift
- Process Mining Full -- OCEL 2.0 event logs, 3 companies, full enterprise sim
- Comprehensive Demo -- all features enabled (fraud, OCEL, SOX, COSO, graph export)
- External Audit Engagement -- ISA-based audit lifecycle with workpaper generation

**Scenarios**
- Audit: scope change, control failure cascade, going concern trigger
- Manufacturing: supplier fraud, inventory manipulation
- Retail: revenue manipulation, shrinkage fraud
- Financial services: trading fraud, regulatory violation

**Regional Templates**
- German manufacturing (authentic Maschinenbau naming)
- Japanese technology (J-SOX context)
- British financial services (City of London terminology)
- Brazilian retail (Portuguese conventions)
- Indian healthcare (NABH terms)

**Causal DAGs**
- Financial process DAG -- 25+ nodes, macro-to-outcome causal chains

**Explorer UI**
- Interactive procedure flow graph visualization (vis-network)
- Per-procedure state diagram rendering
- Expandable YAML config tree browser
- Causal DAG visualization with category coloring
- Export to YAML, JSON, and Mermaid diagram formats
- Node detail inspector (steps, standards, evidence, decisions)
- Dark/light theme with persistence
- Neighbourhood highlighting and filtering

**Documentation**
- Comprehensive README with structure, usage, and contribution guide
- CLAUDE.md developer guidance
