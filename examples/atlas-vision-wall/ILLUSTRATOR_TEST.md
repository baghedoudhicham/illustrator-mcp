# Atlas Vision Wall — Illustrator MCP acceptance test

Use the active Adobe Illustrator (Beta) document.

Read `examples/atlas-vision-wall/spec.json` before making any changes.

## Goal

Build a first Illustrator-native production interpretation of the Atlas Construction vision wall, based on the selected merged direction:

**Built by Many / The Atlas We Build**

This is an environmental graphic, not a conventional word cloud.

## Safety / execution constraints

- Do not overwrite an existing document.
- If no blank test document is active, create a new document.
- Keep text live/editable.
- Do not outline fonts in this pass.
- Do not delete pre-existing user artwork.
- Create everything inside the named Atlas layers.
- Make changes in a sequence that can be undone cleanly.
- After each major stage, inspect the result before continuing.

## Stage 1 — document

Create or use a test artboard at **44 × 18.25 inches**, representing the final 176 × 73 inch wall at 1:4 scale.

Name the artboard:

`Atlas Vision Wall — Test 01`

Create these layers in this order:

1. 00_GUIDES
2. 01_ATLAS_MARK
3. 02_STRUCTURAL_GEOMETRY
4. 03_PRIMARY_VALUES
5. 04_SECONDARY_VALUES
6. 05_CATEGORY_LANGUAGE
7. 06_HAWAIIAN_LANGUAGE
8. 07_PRODUCTION_NOTES

## Stage 2 — structural system

Create a restrained architectural construction system inspired by a roof / truss / framing logic.

Requirements:

- warm-white artboard background
- charcoal primary typography
- Atlas lime used only for key structural lines and selective emphasis
- one dominant horizontal datum
- one central or slightly offset structural apex
- diagonals must align intentionally to the typography
- do not let green lines randomly cut through letterforms
- preserve substantial negative space

## Stage 3 — typographic hierarchy

Create the primary values as editable text:

QUALITY
FAMILY
INTEGRITY
TRUST
OHANA

Then introduce secondary values:

RESPONSIVE
CRAFTSMANSHIP
RELIABLE
EXCELLENCE
PROFESSIONAL
CARING
TEAMWORK
PRECISION

Use clear scale tiers rather than arbitrary font sizes.

Primary values must read from across a meeting room.
Secondary values should reward closer inspection.

## Stage 4 — cultural layer

Add:

OHANA
LAULIMA
NO'EAU
ONIPA'A
ALOHA
IMUA
IKAIKA
HO'OIKAIKA

Keep this layer quieter than the main value hierarchy. Do not turn it into ornamental pseudo-Hawaiian decoration.

## Stage 5 — category language

Using the category arrays in the JSON spec, place the remaining vocabulary as a tertiary typographic system.

The four groups must remain discoverable:

- Office / Admin
- Field Staff
- Subcontractors
- Homeowners / Clients

Do not use four large colored quadrants. Use small category labels, alignment, grouping, or subtle spatial territories.

## Stage 6 — QA

Inspect the artboard and report:

- artboard dimensions
- layer names
- number of text objects
- number of vector/path objects
- any text collisions
- any objects outside artboard bounds
- largest five text objects
- primary colors used

Then create a preview image.

Do not export final production files yet. This is an MCP acceptance test and composition test.
