# Illustrator MCP live acceptance — 2026-09-12

## Status

The local Illustrator bridge passed the isolated live-text round trip and the first Atlas composition pass on branch `feat/trace-intelligence-mvp`. The existing `workflow 20.aic` artwork was inspected only; it was not mutated.

## Isolated live-text proof

The disposable `mcp-acceptance-text.svg` fixture was opened as its own Illustrator document. The authenticated bridge completed:

1. `CreateLayer` → `MCP TEST`
2. `DuplicateObjects` on a live `PLACEHOLDER` text frame
3. `ReplaceText` → `QUALITY`
4. `MoveObjectsToContainer` → the new test layer
5. `GetObjectStructure` and `GetTypographyMetrics` verification
6. `CapturePreview` rendering

The final inspection reported exactly two layers, with one text child in `MCP TEST`. The text remained live and reported Arial Bold, 72 pt, seven characters, no overflow, and no missing font. The rendered proof shows `QUALITY` clearly. The bridge currently advertises 47 tools but no direct `CreateText` capability; this fixture keeps that adapter gap explicit instead of inventing a tool name.

## Atlas composition proof

`examples/atlas-vision-wall/atlas-modular-v2.svg` was opened as a separate, unsaved Illustrator document. Its eight named SVG groups were promoted into the eight production layers from `spec.json`:

`00_GUIDES`, `01_ATLAS_MARK`, `02_STRUCTURAL_GEOMETRY`, `03_PRIMARY_VALUES`, `04_SECONDARY_VALUES`, `05_CATEGORY_LANGUAGE`, `06_HAWAIIAN_LANGUAGE`, `07_PRODUCTION_NOTES`.

The empty imported `Layer 1` was removed from this disposable document only. The artboard was renamed `Atlas Vision Wall — Test 01`. The post-layerization structure contains 45 live text objects, 59 paths, 5 compound paths, and 35 groups. The five primary values (`QUALITY`, `FAMILY`, `INTEGRITY`, `TRUST`, `OHANA`) were found as live text objects. A full-artboard preview was captured after cleanup.

The opacity-0 `PRODUCTION NOTES` group was identified by preflight and removed from the disposable Atlas document. This aligns the result with the spec's prohibition on hidden low-opacity production artwork.

## Preflight findings

The bridge reports nine distinct findings for the current imported proof. None are silently treated as resolved:

- document settings: raster-effects anti-aliasing disabled, no assigned color profile, missing document title/language, custom large-format artboard dimensions, 72 ppi raster-effects resolution, and no bleed;
- objects: three objects at the trim edge (expected to include full-bleed/background geometry and therefore needing production-context review);
- text: 45 frames using auto leading.

There are no image, link, or color findings in this run. Before a print export, set the fabricator's color profile and raster-effects resolution, confirm bleed and trim intent, decide whether auto-leading is acceptable for each text tier, and re-run preflight in the production copy. The current MCP surface does not expose all of those document-level setters.

## Reproducible commands

From the repository root, with a freshly regenerated local token supplied only through the process environment or ignored `.env.local`:

```text
npm run mcp:smoke
npm run mcp:inspect
npm run mcp:acceptance
```

`mcp:acceptance` refuses to mutate a document unless the disposable `mcp-acceptance-text` fixture is active and refuses to create a duplicate `MCP TEST` layer. The Atlas layer-promotion run was intentionally kept as a sample operation; the core tracing roadmap and geometry engine remain provider-independent.

## Scope boundary

This is a bridge and composition acceptance record, not a claim that the raster-to-centerline engine is complete, that the Atlas artwork is production-ready, or that any commercial vectorization provider has been benchmarked. No source SVG, AI, PDF, or final production export was overwritten or saved by the MCP run.
