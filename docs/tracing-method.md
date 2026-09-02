# Tracing method: reconstruct intent, not pixels

This document is the initial skill spec. It should evolve from real accepted traces.

## 1. Preserve evidence

- Keep the original raster untouched.
- Enhancement, sharpening, thresholding, denoising, and upscaling are inspection branches only.
- Never treat interpolation artifacts as source geometry.
- Mark uncertain regions explicitly.

## 2. Solve proportions before paths

Before placing anchors, measure:

- global width/height ratio,
- major horizontal and vertical alignments,
- center axes,
- negative-space ratios,
- repeated widths/gaps,
- likely circles/ellipses,
- tangent relationships.

Normalize dimensions so the reconstruction can be compared independent of source resolution.

## 3. Recover primitives first

Prefer a mathematically clean line, circle, ellipse, rectangle, or symmetric construction when the evidence supports one. Do not approximate a likely primitive with dozens of raster-following nodes.

## 4. Trace silhouette and counters together

A logo is defined by positive shape and negative space. Score both. A path that matches the outside but distorts a counter is not accurate.

## 5. Minimum anchors, bounded error

Reduce anchors until the next removal would exceed the accepted silhouette error. Node count is not a goal by itself; it is a complexity penalty.

## 6. Curves

- Put anchors at meaningful extrema, corners, inflections, and structural joins.
- Prefer smooth handles across continuous curvature.
- Avoid tiny corrective Béziers caused by blur.
- Compare at several zoom levels.

## 7. Ambiguity

When the image is unclear:
- infer from symmetry, repetition and proportions,
- compare multiple candidates,
- show confidence,
- let the designer choose.

Do not invent microscopic detail.

## 8. Learn from accepted corrections

For each training example, retain:
- source reference,
- automatic candidate,
- accepted final SVG,
- extracted geometric deltas,
- a short reason when the designer made a deliberate exception.

The profile should learn preferences, not memorize artwork.
