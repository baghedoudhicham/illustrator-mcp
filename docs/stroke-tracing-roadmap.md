# Editable stroke reconstruction: scope and research plan

Research snapshot: 2026-09-12. This document specifies future work; it does not claim a working raster extractor or benchmark victory.

## Product boundary

Build a local, provider-independent engine for reconstructing uniform-width outlined symbols as editable centerline strokes, simple filled regions, and geometric primitives. Start with isolated icons on plain backgrounds. Atlas is an integration example, not a core dependency or a training target. The supplied consulting icon sheet is a private stress-test reference, not a redistributable dataset.

The engine must run through a local library/CLI without Illustrator, MCP, Codex, a paid AI client, or a cloud provider. Illustrator and MCP are adapters. Optional Quiver/Recraft adapters produce candidates through the same interface; explicit user action controls paid or remote runs.

Exclude photographs, typography recovery, handwriting, variable-width brushes, gradients, and general illustration from the first release. Preserve uncertain areas for review. Accuracy has a declared input envelope and error tolerance; perfect recovery from an ambiguous raster is not a defensible promise.

## Verified repository state

`src/index.ts` exposes sampled-geometry scoring, cleanup suggestions, profile updates, and a default profile. The Illustrator adapter is an interface. There is no implemented raster-to-centerline pipeline here. Existing profile updates record preferences; they are not neural fine-tuning. Existing scores are heuristics and do not validate stroke topology or image fidelity. Independent normalization in the current geometry score can hide translation/scale error in shape terms, so retain bounds checks and use a shared coordinate transform in the future benchmark.

## Research landscape

| Method / baseline | Useful evidence | Limits to test |
| --- | --- | --- |
| Illustrator Image Trace | Paths, corners, noise, fills/strokes and related controls provide a tunable baseline | Record settings; test stroke editability and junctions, not only appearance |
| Potrace | Binary boundary tracing, polygon approximation, corner handling and Bezier optimization | Boundary recovery differs from centerline recovery |
| VTracer | Open-source color raster-to-vector conversion | Evaluate color-region paths separately from stroke graphs |
| AutoTrace centerline | Explicit centerline mode provides a practical local baseline | Junctions, branches, width estimates and noisy inputs require measurement |
| Quiver | Official SVG generation/vectorization interface; earlier Atlas sample is a case study | Internal algorithm is not established by public product claims; inspect each exported SVG |
| Recraft | Documented vectorization API and color reduction workflow | Same-source controlled comparison pending |
| Topology-driven line vectorization | Research explicitly models curve networks and junctions | Applicability to colored, shaded icons needs experiments |
| diffvg / LIVE | Differentiable rendering and layer-wise vectorization offer optimization approaches | Raster loss alone does not establish designer-quality topology; diffvg does not solve discrete topology changes |

Primary references, accessed 2026-09-12:

- Adobe options: https://helpx.adobe.com/sa_en/illustrator/desktop/manage-objects/traces-mockups-symbols/image-trace-panel-options.html
- Adobe source-quality guidance: https://helpx.adobe.com/uk/illustrator/using/image-trace-results-optimization.html
- Potrace algorithm: https://potrace.sourceforge.net/potrace.pdf
- VTracer implementation: https://github.com/visioncortex/vtracer
- AutoTrace implementation: https://github.com/autotrace/autotrace
- Quiver documentation: https://docs.quiver.ai/
- Recraft API examples: https://www.recraft.ai/docs/api-reference/examples
- Recraft vectorizing: https://www.recraft.ai/docs/recraft-studio/format-conversions-and-scaling/vectorizing
- Topology-Driven Vectorization of Clean Line Drawings: https://cgl.ethz.ch/Downloads/Publications/Papers/2013/Nor13/Nor13.pdf
- diffvg: https://people.csail.mit.edu/tzumao/diffvg/diffvg.pdf
- LIVE: https://openaccess.thecvf.com/content/CVPR2022/papers/Ma_Towards_Layer-Wise_Image_Vectorization_CVPR_2022_paper.pdf

Check dependency licenses, native packaging and maintenance at the pinned revision before integrating. Citation of a paper is not permission to redistribute its code or dataset. No new dependencies are selected by this document.

## Pipeline and contracts

1. Ingest source and preserve its hash, dimensions, crop transform and provenance. Enhancement is a separate branch; generated detail is never ground truth.
2. Separate dark stroke evidence from fills and shading. Estimate stroke-width range and mark uncertain pixels.
3. Extract a centerline graph with explicit endpoints, junctions, loops and unresolved crossings. Skeletonization alone is a candidate generator: it can introduce spurs and misconnect intersections.
4. Fit lines, arcs and cubic Beziers with a bounded residual. Apply symmetry, parallelism and shared-width constraints only when evidence or a designer supports them.
5. Resolve overlap/occlusion separately from connectivity. Store alternative interpretations where the raster is insufficient.
6. Emit a neutral scene containing stable IDs, paths/primitives, stroke width/cap/join, fills, groups, z-order, source-region references and uncertainty. Export SVG and an inspection report.
7. Render with one pinned renderer, compare to reference, and collect targeted designer corrections. Apply approved scenes through an Illustrator adapter in an isolated document/layer, then read back geometry and inspect a rendered result.

Keep extraction, fitting, evaluation and export outside transport code. Use versioned request/result schemas, explicit units and transforms, timeouts/cancellation, and deterministic seeds where supported. Validate imported SVG and reject active content or unexpected external resources before rendering/import. Preserve per-provider settings and raw outputs for reproducibility.

## Milestones and sample progression

1. **Benchmark first:** author original vector fixtures for lines, arcs, rounded corners, loops, parallel strokes, and T/X junctions. Rasterize at declared resolutions and degradation levels. Keep all variants of one source in the same dataset split.
2. **Single outlined symbol:** use an original shield/power fixture; inspect the supplied Total Control Shield as a private real-world case. Evaluate symmetry, smooth curves, open endpoints and nested boundaries. Omit label and shading initially and report that scope.
3. **Stroke graph:** use original chip/flow fixtures, then inspect the supplied Embedded Chip and Process Flow. Evaluate repeated spacing, junctions and accidental bridges.
4. **Limited color/overlap:** test blueprint and robot-like fixtures after the preceding cases meet calibrated gates. Human figures and the complete sheet remain stress tests.
5. **Application round trip:** inspect active Illustrator state and validate the isolated MCP TEST / editable QUALITY acceptance before importing candidate scenes. Atlas demonstrates layout composition after the core passes independent fixtures.

Each milestone requires a frozen evaluation set, documented failure cases and an improvement in measured correction effort without unacceptable fidelity/topology regressions. Expand supported inputs only after these gates pass. Do not tune against held-out cases.

## Evaluation protocol

Run Illustrator, AutoTrace, VTracer, Quiver, Recraft and our candidate on identical eligible source bytes/crops. Record tool/model/build, settings, timestamp, source hash, output hash, runtime and cost. Separate default-setting and equal-budget tuned comparisons. Retain failed runs and repeated stochastic runs; do not cherry-pick. No new provider tests are claimed by this plan.

Report separate metrics rather than one opaque score:

- Geometry: shared-frame boundary and centerline distance, percentile and maximum error, normalized by source stroke width; sample curves by arc length.
- Topology: missing/extra endpoints, junction degree, connected components, loops, accidental crossings and occlusion order against labeled fixtures.
- Stroke quality: width deviation, cap/join correctness, tangent continuity, duplicate segments and unintended self-intersections.
- Appearance: multiscale rendered comparison and silhouette overlap; these complement structural metrics.
- Editability: useful anchors, semantic groups, live strokes versus expanded fills, plus timed changes such as adjusting a stroke width or moving one node.
- Designer effort: blinded acceptance and correction time with a written rubric; record reviewer disagreements and allow multiple valid reconstructions.

Calibrate thresholds in a pilot and freeze them before evaluating the held-out set. Report distributions and uncertainty with sample counts. Tiny real-world rasters without vector originals support an expert-reference comparison, not a claim of recovering the original paths.

## Learning and release discipline

Start with deterministic fitting and explicit configuration. Save accepted corrections as structured deltas with reasons (geometry error versus aesthetic preference). Version profiles and evaluate every change on fixed holdouts before release. Consider learned junction classifiers or other model training only after the correction dataset shows a repeated, measurable failure pattern.

For GitHub: small reviewable commits; separate source, fixtures and generated outputs; run typecheck/tests/build; preserve unrelated artwork; retain reproducible manifests and changelog evidence. Before open-source release, choose a project license and audit dependency/fixture redistribution rights. Use original or suitably licensed public benchmark assets. Do not publish client images or private local paths as fixtures by default.

Potential article question: **Can explicit stroke topology and geometric constraints reduce designer correction time for small outlined icons?** Publish protocol and baselines first, then results, ablations, failure gallery and reproducibility package. Claims of outperforming commercial tools require a measured, dated comparison within the declared niche.
