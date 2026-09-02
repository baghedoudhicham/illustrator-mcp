# illustrator-mcp

A local-first MCP control layer for Adobe Illustrator, with an accuracy-focused tracing engine.

## Why

The goal is not to make another one-click image trace. The system separates:

1. **Perception** — infer geometry from imperfect raster references.
2. **Reconstruction** — turn that evidence into low-node, editable vector geometry.
3. **Taste/profile** — record how a designer personally resolves ambiguity, simplifies curves, handles symmetry, corners, negative space, and cleanup.
4. **Execution** — apply deterministic edits in Illustrator through an adapter.
5. **QA** — compare the vector result against the reference and report geometric uncertainty.

The first real-world test case is accurate logo / mark reconstruction from low-resolution or blurry references.

## Planned MCP tools

- `trace_analyze_reference`
- `trace_compare_svg`
- `trace_score_geometry`
- `trace_learn_profile`
- `trace_suggest_cleanup`
- `illustrator_inspect_document`
- `illustrator_apply_svg`
- `illustrator_execute_transaction`
- `illustrator_export`

## Design principle

AI should decide **what needs interpretation**. Geometry, measurement, cleanup, scoring, and repetitive production work should be deterministic wherever possible.

## Status

Initial architecture and MVP implementation in progress.
