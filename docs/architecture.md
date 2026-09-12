# Architecture

## Objective

Build a tracing assistant that behaves less like one-click Image Trace and more like a careful vector designer:

- infer intended geometry rather than literal blur,
- preserve negative space and optical relationships,
- use as few anchors as practical,
- recover primitives and symmetry where justified,
- surface uncertainty instead of inventing detail,
- learn a designer's accepted cleanup preferences transparently.

## Pipeline

```
reference raster / scan
        |
        v
[1] evidence extraction
    multi-threshold edges
    silhouette candidates
    negative spaces
    possible symmetry axes
        |
        v
[2] geometric inference
    lines / circles / ellipses
    corners / tangencies
    ratios / alignments
    repeated modules
        |
        v
[3] candidate reconstruction
    constrained paths
    cubic Bezier fitting
    compound shapes
        |
        v
[4] cleanup
    anchor reduction
    micro-segment removal
    tangent correction
    primitive recovery
        |
        v
[5] QA
    raster/vector overlay
    normalized Hausdorff
    Chamfer distance
    bounds / ratio error
    symmetry error
    anchor economy
        |
        v
[6] designer profile
    accepted corrections
    preferred anchor density
    corner thresholds
    simplification tolerance
    explicit notes/rules
        |
        v
Illustrator adapter
```

## Why not rely on upscaling?

Upscaling can make a reference easier to inspect, but it cannot recover evidence that was never captured. The system should keep the original image as the source of truth and treat enhanced versions as hypotheses.

For unclear inputs, the correct output is often a confidence interval or several geometric candidates, not fake precision.

## Personal tracing profile

The first version should not train a neural model.

Store a transparent profile derived from accepted before/after tracing examples:

- anchors per normalized perimeter,
- ratio of corner vs smooth anchors,
- simplification tolerance,
- tangent continuity preference,
- symmetry correction strength,
- primitive recovery preference,
- compound path vs overlap preference,
- manual notes.

Later, if enough paired examples exist, a ranking model can choose among deterministic candidates using these features.

## Illustrator bridge

The tracing engine is intentionally separate from Illustrator transport.

```
MCP tools
  |
  +-- trace engine (pure geometry)
  |
  +-- IllustratorAdapter
       +-- Adobe MCP adapter
       +-- ExtendScript adapter
       +-- UXP/local adapter
```

This keeps the core testable and lets deeper Illustrator automation replace Adobe's exposed MCP actions without redesigning the tracing logic.
