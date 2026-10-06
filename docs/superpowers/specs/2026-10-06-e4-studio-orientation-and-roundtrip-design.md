# E4 — Studio: triangle orientation picker and campaign round-trip

Date: 2026-10-06 · Scope: `game-next/src/studio`, `game-next/src/content`, `game-next/scripts/studio` · Depends on: A (shapes v2), B (level kit, `content:new`), E1–E3 (level studio).

## 1. Two problems

### 1.1 The roof triangles are reachable but undiscoverable

`domain/shapes.ts` already gives `triangle` eight orientations in two families:

| Orientation | Shape | Polygon |
|---|---|---|
| 0–3 | right triangle, right angle at TL / TR / BR / BL | the "corner" family |
| 4 | apex up ▲ | `(0,s) (s,s) (h,h)` |
| 5 | apex right ▶ | `(0,0) (0,s) (h,h)` |
| 6 | apex down ▼ | `(0,0) (s,0) (h,h)` |
| 7 | apex left ◀ | `(s,0) (s,s) (h,h)` |

`isValidOrientation` accepts 0–7, `isValidFrame` requires `frameSize % 16 === 0` for the roof family against `% 8` for the corner family, `effectiveOrientation` cycles each family independently, and `mirrorOrientation` maps all eight. The geometry, the solver, the renderer and the raster are all complete.

`studio/palette.ts` does expose an orientation control (lines 107-130): a `<select>` listing every valid orientation for the selected kind, 0-7 for `triangle` and 0-3 for `parallelogram`, whose `onchange` correctly re-runs `updateValidSizes()` and re-renders. The roof triangles can therefore be created today. The problem is that the options are labelled `Hướng 0` … `Hướng 7` and nothing else: bare numbers, no preview of the resulting shape, and no sign that 4-7 are a different family from 0-3. An author scanning the list sees eight numbers and has no way to learn that half of them are the apex triangles. Reported from use as "there are only the four right-angle corners".

Two gaps follow:

- **The palette control is illegible.** It needs the shape itself on each option and the two families named, so the choice can be made by sight.
- **The inspector has no orientation control at all.** `studio/inspector.ts` is 569 lines and contains no `orientation` field, so once a piece is placed its orientation is fixed except through `R` (`studio/keys.ts` → `rotate-piece`), and `effectiveOrientation` deliberately keeps rotation inside one family, as it should: rotating a right triangle by 90° cannot turn it into an isoceles one. Picking the wrong family means deleting the piece and starting over.

### 1.2 A campaign level can be opened for editing but not written back

`studio/library.ts` lists every `campaignManifest` entry and loads any non-`planned` one into the editor by fetching `/src/content/levels/<id>.json` and running `sourceFromDocument`. Editing works. Saving does not: `saveStudioLevel` writes to the studio store under `src/content/studio/levels/`, and the only route back into the campaign is `promoteStudioLevel`, which is built for *adding* a level — it calls `registerInSourceIndex` and `registerInCatalog`, both of which throw when the id is already registered.

So the reviewer can open 1-4, change it, and have nowhere to put the result.

## 2. Goals

- A — Make the eight triangle orientations (and the four parallelogram ones) legible where they are already selectable, and selectable where they are not: the palette list gains shape previews and family labels, and the inspector gains an orientation control for a placed piece.
- B — Let a campaign level be edited in the studio and written back over its own source, under a gate that forces re-approval.

### Non-goals

- Changing `effectiveOrientation` so `R` crosses orientation families. The current behaviour is geometrically correct and stays.
- Adding new shape kinds or new orientations to the engine.
- Editing a `planned` level (it has no JSON to load).

## 3. Feature A — orientation picker

### A1. Palette orientation row (`studio/palette.ts`)

The existing `<select>` of bare numbers is replaced by a row of buttons, under the same visibility rule it already uses: shown when the selected kind has more than one orientation — `triangle` (8) and `parallelogram` (4) — and absent for `square`, `diamond` and `circle`, whose only valid orientation is 0.

Each button renders a **miniature of the actual polygon** from `shapePolygon(kind, orientation, previewSize)` instead of the text `Hướng <n>`, so the author picks by sight. Triangle buttons are split into two groups labelled **Góc** (0–3) and **Mái** (4–7), matching the families in `effectiveOrientation`. The existing behaviour on change — `updateValidSizes()` then `render()` — is kept as is.

### A2. Orientation change refreshes the valid frame sizes

Already correct and kept: `updateValidSizes()` filters `CANDIDATE_SIZES` through `isValidFrame(kind, orientation, size)` and the orientation control already calls it, so moving from the corner family to the roof family drops 24, 40, 56, 72 and 88 from the list (112 is a multiple of 16 and survives) and `selectedSize` snaps to a valid value. The replacement buttons must preserve this call; a regression test pins it.

### A3. Inspector orientation control (`studio/inspector.ts`)

The inspector gains an orientation control for the selected piece, using the same miniature buttons. Changing it dispatches a new `set-orientation` action handled in `studio/state.ts`. `PieceSource` stores `orientation` and `frameSize` only - cells are derived later by the authoring step - so the reducer sets `orientation` and re-validates `frameSize` against it through `isValidFrame`, refusing the change rather than silently producing a piece whose frame is invalid for its new family.

### A4. Unchanged

`effectiveOrientation`, `mirrorOrientation`, `keys.ts` and the `R` / `Shift+R` bindings are not touched.

### A5. Tests

- `palette.test.ts`: the orientation row lists 8 buttons for triangle, 4 for parallelogram, and is absent for square, diamond and circle; the triangle row carries the two family labels.
- `palette.test.ts` (regression): selecting a roof orientation while `selectedSize` is 40 refreshes the size list to multiples of 16 and snaps the selection. This holds today and must keep holding after the `<select>` becomes buttons.
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

`promoteStudioLevel` already runs these checks before its first write: it refuses when `authorLevel` reports validation issues, when `solutionCount !== 1`, and when `fewerPieceSolutions > 0`, and every `writeFileSync` happens after them. Overwrite mode reuses that gate unchanged and adds nothing to it - no `allowUnproven` exemption, which promote does not honour today and this spec does not introduce. The requirement here is that overwrite must not be allowed to weaken the gate: an edit made in the studio must not be able to break an approved level, so a refusal leaves every file byte-identical.

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
