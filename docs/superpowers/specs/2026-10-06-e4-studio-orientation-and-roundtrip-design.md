# E4 — Studio: triangle orientation picker and campaign round-trip

Date: 2026-10-06 · Scope: `game-next/src/studio`, `game-next/src/content`, `game-next/scripts/studio` · Depends on: A (shapes v2), B (level kit, `content:new`), E1–E3 (level studio).

## 1. Two problems

### 1.1 The roof triangles are unreachable from the studio

`domain/shapes.ts` already gives `triangle` eight orientations in two families:

| Orientation | Shape | Polygon |
|---|---|---|
| 0–3 | right triangle, right angle at TL / TR / BR / BL | the "corner" family |
| 4 | apex up ▲ | `(0,s) (s,s) (h,h)` |
| 5 | apex right ▶ | `(0,0) (0,s) (h,h)` |
| 6 | apex down ▼ | `(0,0) (s,0) (h,h)` |
| 7 | apex left ◀ | `(s,0) (s,s) (h,h)` |

`isValidOrientation` accepts 0–7, `isValidFrame` requires `frameSize % 16 === 0` for the roof family against `% 8` for the corner family, `effectiveOrientation` cycles each family independently, and `mirrorOrientation` maps all eight. The geometry, the solver, the renderer and the raster are all complete.

The studio cannot produce them. `studio/palette.ts` holds `selectedOrientation` at `0`, resets it to `0` on every shape-button click, and exposes no orientation control at all. The only orientation input anywhere is the `R` key (`studio/keys.ts` → `rotate-piece`), and `effectiveOrientation` deliberately keeps rotation inside one family, as it should: rotating a right triangle by 90° cannot turn it into an isoceles triangle. `studio/inspector.ts` has no `orientation` field either, so a placed piece cannot be corrected.

The result is that four of the engine's twelve triangle/parallelogram configurations exist but no authoring path reaches them. This is a missing control, not a missing shape.

### 1.2 A campaign level can be opened for editing but not written back

`studio/library.ts` lists every `campaignManifest` entry and loads any non-`planned` one into the editor by fetching `/src/content/levels/<id>.json` and running `sourceFromDocument`. Editing works. Saving does not: `saveStudioLevel` writes to the studio store under `src/content/studio/levels/`, and the only route back into the campaign is `promoteStudioLevel`, which is built for *adding* a level — it calls `registerInSourceIndex` and `registerInCatalog`, both of which throw when the id is already registered.

So the reviewer can open 1-4, change it, and have nowhere to put the result.

## 2. Goals

- A — Make all eight triangle orientations (and all four parallelogram orientations) selectable in the studio, both when creating a piece and when editing a placed one.
- B — Let a campaign level be edited in the studio and written back over its own source, under a gate that forces re-approval.

### Non-goals

- Changing `effectiveOrientation` so `R` crosses orientation families. The current behaviour is geometrically correct and stays.
- Adding new shape kinds or new orientations to the engine.
- Editing a `planned` level (it has no JSON to load).

## 3. Feature A — orientation picker

### A1. Palette orientation row (`studio/palette.ts`)

A row appears below the shape buttons whenever the selected kind has more than one orientation — `triangle` (8) and `parallelogram` (4). It is hidden for `square`, `diamond` and `circle`, whose only valid orientation is 0.

Each button renders a **miniature of the actual polygon** from `shapePolygon(kind, orientation, previewSize)` rather than a text label, so the author picks by sight. Triangle buttons are split into two labelled groups, **Góc** (0–3) and **Mái** (4–7), matching the families in `effectiveOrientation`.

### A2. Orientation change refreshes the valid frame sizes

`updateValidSizes()` already filters `CANDIDATE_SIZES` through `isValidFrame(kind, orientation, size)`, but today it is only called when the kind changes. It must also run when the orientation changes: moving from the corner family to the roof family drops 24, 40, 56, 72 and 88 from the list (112 is a multiple of 16 and survives), and the current `selectedSize` must snap to a valid one as the existing fallback already does.

### A3. Inspector orientation control (`studio/inspector.ts`)

The inspector gains an orientation control for the selected piece, using the same miniature buttons. Changing it dispatches a new `set-orientation` action handled in `studio/state.ts`, which also re-validates `frameSize` against the new orientation and reports a clear Vietnamese error if the current frame is invalid for it, rather than silently producing an invalid piece.

### A4. Unchanged

`effectiveOrientation`, `mirrorOrientation`, `keys.ts` and the `R` / `Shift+R` bindings are not touched.

### A5. Tests

- `palette.test.ts`: the orientation row lists 8 entries for triangle, 4 for parallelogram, and is absent for square, diamond and circle.
- `palette.test.ts`: selecting a roof orientation while `selectedSize` is 40 refreshes the size list to multiples of 16 and snaps the selection.
- `studioState.test.ts`: `set-orientation` updates the piece, recomputes its cells from `shapePolygon`, and rejects an orientation whose family invalidates the current `frameSize`.

## 4. Feature B — campaign round-trip

### B1. Overwrite mode in `promoteStudioLevel` (`content/promote.ts`)

`PromoteOptions` gains `overwrite?: boolean`. When `targetId` is already registered:

- `registerInSourceIndex` and `registerInCatalog` are skipped rather than called — the entry already exists. Without `overwrite`, an existing id stays an error, so the current behaviour is unchanged for callers that do not ask for it.
- `src/content/sources/<targetId>.ts` is overwritten through `serializeLevelSource`.
- `contentRevision` is bumped: a trailing `-v<N>` becomes `-v<N+1>`; a revision without that suffix gains `-v2`.
- The manifest row for `targetId` is rewritten with the new `contentRevision` and, if its status was `approved`, downgraded to `validated`.
- `authorLevel` regenerates the level JSON, the SVG preview and the report.

### B2. The comment block is preserved

`serializeLevelSource` emits an import line followed by `export const <name>: LevelSource = {`. Existing sources carry a hand-written Vietnamese block comment between those two — `1-6.ts` explains the shared-boundary-cell rule from spec D7/D8, and that knowledge must not be lost to a regeneration.

Before overwriting, the old source file is read and the text between the end of the import line and the start of `export const` is captured. If it is non-empty, it is re-inserted at the same position in the generated file. The capture is purely textual and makes no attempt to update the comment's contents, so a comment can go stale; the promote report names the file and says the preserved block should be re-read.

What is still lost, and is accepted: calls to the `kit.ts` helpers (`piece()`, `mirrorX()`, `concentric()`, `row()`) become flat object literals, because the document carries the resulting geometry and not the expression that produced it.

### B3. Safety gate

The overwrite is refused, leaving every file untouched, when the regenerated document fails validation, or when the solver no longer proves a unique solution (`solutionCount !== 1`, `fewerPieceSolutions !== 0`, or `proven === false`) and the source carries no `allowUnproven`. An edit made in the studio must not be able to break an approved level. All writes happen only after both checks pass.

### B4. `/__studio/promote` endpoint (`scripts/studio/studioPlugin.ts`)

A `POST /__studio/promote` endpoint taking `{ studioId, targetId, overwrite }` and returning `PromoteResult`, alongside the existing `/__studio/list`, `/__studio/save` and `/__studio/delete`. Dev-server only, like the rest of the plugin.

### B5. Studio UI (`studio/library.ts`, `studio/api.ts`)

`api.ts` gains `promoteStudioLevelApi`. When the loaded source's id matches a campaign entry, the library shows a **"Ghi về campaign"** button. Pressing it opens a confirmation naming the four consequences in Vietnamese: the source file is overwritten, the revision rises to `<new>`, the status drops from `approved` to `validated`, and the level must be played and approved again. On success the library refreshes and reports the new revision; on refusal it shows the validator issues or the solver reason unchanged.

### B6. CLI

`scripts/promote-level.ts` accepts `--overwrite`. Used without it against an existing id, the error message names the flag. On success it prints the revision bump, the status downgrade and whether a comment block was preserved.

### B7. Tests

- `promote.test.ts`: overwriting an existing id rewrites the source, bumps `v1` → `v2`, downgrades `approved` → `validated`, and leaves `sources/index.ts` and `catalog.ts` untouched (no duplicate registration).
- `promote.test.ts`: without `overwrite`, an existing id still fails as before.
- `promote.test.ts`: the block comment between the import and `export const` survives the round trip; a source without one is handled.
- `promote.test.ts`: a document that fails validation, and one whose solver result is not a proven single solution, both leave every file byte-identical.
- `studioPlugin.test.ts`: the endpoint rejects a malformed body and forwards a refusal unchanged.

## 5. Impact

Both features are additive. `effectiveOrientation`, `mirrorOrientation`, `shapePolygon` and the existing promote path for new levels are unchanged, so nothing in the campaign or the runtime moves. The risk concentrates in B1 and B3, where a bug writes to `src/content/sources/`; the safety gate and the all-or-nothing write ordering are the mitigation, and `promote.test.ts` asserts the untouched-files case directly.

Impact analysis must be run per symbol before editing, per `AGENTS.md`; `promoteStudioLevel` is the one with real upstream reach (`scripts/promote-level.ts`, `tests/promote.test.ts`).

## 6. Done when

- A triangle in any of the eight orientations can be created from the palette and switched between families on a placed piece from the inspector, with the frame-size list following the orientation.
- A campaign level opened in the studio, edited, and sent back through "Ghi về campaign" lands in `src/content/sources/<id>.ts` with its block comment intact, its revision bumped, its manifest status at `validated`, and its JSON, SVG and report regenerated.
- An edit that breaks validation or uniqueness is refused with every file unchanged.
- `npm test`, `npm run typecheck` and `npm run build` pass, and `npm run content:validate` reports no new issues.
