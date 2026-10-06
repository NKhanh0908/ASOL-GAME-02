# CH1H — Chapter 1 hard tail (1-7, 1-8, 1-9)

Date: 2026-10-06 · Scope: `game-next/src/content`, `docs/` · Depends on: A (shapes v2), B (level kit, 4 chapters / 28 levels), CH1 (chapter 1 levels), E1 (difficulty scoring).

## 1. Problem

Chapter 1 "Khởi Nguyên" tops out at difficulty 3 of 5. Its six levels teach the basics and nothing beyond them:

| Level | Pieces | Difficulty | Teaches |
|---|---|---|---|
| 1-1 Song Tinh | 2 | 1 | drag and drop, corner contact |
| 1-2 Bảo Tháp Tiên Tri | 2 | 1 | combining two shape kinds |
| 1-3 Cánh Chim Báo Điềm | 2 | 2 | left–right symmetry |
| 1-4 Ngọn Hải Đăng | 3 | 2 | vertical stacking |
| 1-5 Chiếc Thuyền Sao | 3 | 3 | three pieces, edge contact |
| 1-6 Vương Miện Bình Minh | 3 | 3 | a gap that fits exactly one piece |

Two of the game's strongest difficulty levers are deliberately unavailable here: rotation is reserved for chapter 4 (`rotationEnabled: false` for chapters 1–3, enforced by the validator as `chapter-rotation-disabled`), and the parity/XOR overlap rule is reserved for chapter 2 (2-1 teaches "two layers cancel", 2-3 teaches "three layers return").

The chapter therefore ends before the player ever has to reason hard about *which* pieces make a silhouette. That reasoning is available without either reserved lever.

## 2. Goal

Add three levels — 1-7, 1-8, 1-9 — to the end of chapter 1. Each reaches difficulty 4 (1-9 may reach 5) using only geometric deduction: no overlap, no rotation. The six existing approved levels are not modified.

### Non-goals

- Re-tuning 1-1 … 1-6.
- Introducing overlap or rotation into chapter 1.
- A separate optional challenge track outside the main campaign chain.

## 3. Design principle

The difficulty scorer (`src/content/difficulty.ts`) weights six parts:

| Part | Weight | Available without overlap |
|---|---|---|
| `choices` | 0.25 | yes — decoy anchors |
| `pieces` | 0.20 | yes — piece count |
| `hiddenEdges` | 0.20 | yes — this is the main lever |
| `nearMiss` | 0.15 | yes — distractor anchors close to correct |
| `hollow` | 0.10 | no — requires even-layer overlap |
| `revive` | 0.10 | no — requires odd-layer overlap ≥ 3 |

With `hollow` and `revive` fixed at 0, the ceiling is 0.80 raw. Difficulty 4 begins at 0.43 and difficulty 5 at 0.50 (`DIFFICULTY_THRESHOLDS`), so difficulty 4 is reachable, but only by pushing `pieces`, `choices` and `hiddenEdges` together.

`hiddenEdges` is the fraction of a piece's cell-boundary segments whose two sides have the same target status — segments the finished silhouette does not reveal. A piece lying wholly inside the silhouette has nearly all of its boundary hidden. This is the formal expression of the design intent: **the outline must not disclose the decomposition.**

The hard constraint the craft works against: `authorLevel` runs the solver, and a level is only valid when `solutionCount === 1` and `fewerPieceSolutions === 0`. So every level here must be **ambiguous to the eye and unique to the solver** — several decompositions must look plausible while exactly one actually fits.

## 4. The three levels

Each level uses a different ambiguity mechanism; none repeats another's trick.

### 4.1 — 1-7 Mảnh Khuất (ambiguity by containment)

Four pieces form one solid, continuous silhouette. One piece sits wholly inside it and touches no part of the outer edge, so none of its boundary is visible in the target. The player counts three regions by eye but holds four pieces, and must work out where the fourth hides.

- Primary lever: `hiddenEdges` ≈ 1 for the interior piece; high overall.
- Pieces: 4. Decoy anchors: `NUDGE` on the interior piece, at least 2 anchors on each other piece.
- `learningObjective`: "Bóng mục tiêu không cho biết có bao nhiêu mảnh".
- Target difficulty: 4.

### 4.2 — 1-8 Lối Chia Sai (ambiguity by decomposition)

The silhouette has an obvious axis of symmetry, and the eye immediately proposes splitting it along that axis. The tray cannot do that: the only solution is an asymmetric split. Decoy anchors are placed exactly where the symmetric reading would put the pieces, so the first instinct produces a silhouette that is nearly right and definitely wrong.

- Primary lever: `nearMiss` — distractor placements differ from the target by only a few cells.
- Pieces: 4. Every piece carries a decoy anchor corresponding to the symmetric misreading, recorded in `distractors` with its reason.
- `learningObjective`: "Đối xứng của bóng không phải đối xứng của mảnh".
- Target difficulty: 4.

### 4.3 — 1-9 Ngũ Hành Tinh (ambiguity by volume)

Five pieces, including two pairs of the same `shapeKind` at different `frameSize`. At a glance the player cannot tell which size belongs where; the sizes only separate once a placement is tried. Every piece carries four anchors (`CROSS`).

- Levers combined: `pieces` = 4/6, `choices` ≈ 5 × log₂4 / 20 = 0.5, `hiddenEdges` high.
- Pieces: 5. Decoy anchors: `CROSS` on every piece, subject to KIT-03 (decoys duplicating anchor A of an identical shape/orientation/frame piece are dropped — the differing `frameSize` within each pair is what keeps them legal).
- `learningObjective`: "Suy ngược từ khay về bóng, không suy xuôi từ bóng".
- Target difficulty: 4–5. Chapter finale.

### 4.4 — Shared authoring requirements

For all three: `chapter: 1`, `rotationEnabled: false`, anchored placement (the `placement` field is omitted, exactly as in 1-1 … 1-6 — free placement is not used in chapter 1), Vietnamese `title` / `learningObjective` / `victoryVerse` / `distractors[].reason`, `ftueSteps: []`, `contentRevision: '<slug>-v1'`.

Authoring loop per level: `npm run content:new -- <id> --from 1-6`, edit the source, `npm run content:author -- <id>`, then read `<id>-report.md` and confirm `solutionCount === 1`, `fewerPieceSolutions === 0`, and the scored difficulty matches `difficultyEstimate` (a mismatch raises the `difficulty-mismatch` warning). Inspect the generated SVG to confirm the outline genuinely hides the seams.

## 5. Code changes

### 5.1 Content

- New: `src/content/sources/1-7.ts`, `1-8.ts`, `1-9.ts`; `sources/index.ts` registration is written by `content:new`.
- Generated: `src/content/levels/1-7.json`, `1-8.json`, `1-9.json` plus SVG previews and reports. Never hand-edited.

### 5.2 `src/content/manifest.ts`

Three new rows at the end of the chapter 1 block with `status: 'planned'`, and `order` renumbered across the campaign: chapters 2–4 shift by +3, so the campaign runs `order` 1 … 31 (2-1 becomes 10, 4-6 becomes 31).

### 5.3 `src/content/chapters.ts`

`RELEASE_LEVEL_COUNT`: 28 → 31.

Impact analysis (GitNexus, upstream): risk **LOW**, 0 callers in the graph. The three real references are `releaseGate` in the same file, three assertions in `tests/content.test.ts`, and one comment line in `scripts/validate-content.ts`. `CHAPTERS` itself is unchanged — the chapter count stays 4.

### 5.4 `src/presentation/constellationLayout.ts`

No change. `layoutCampaignMap` applies `TEN_NODE_PATTERN` only to a constellation of exactly ten nodes and falls through to `zigzagX` otherwise, so a nine-node chapter 1 lays out automatically; `totalHeight` grows and `LevelSelectScene` already derives its scroll bound (`minY`) from it.

### 5.5 Tests

- `tests/content.test.ts`: 28 → 31 in the `RELEASE_LEVEL_COUNT`, manifest length and `releaseGate` assertions.
- `tests/catalog.test.ts`: campaign size and `order` continuity.
- `tests/levelSelect.test.ts`: chapter 1 node count 6 → 9, no node overlap or overflow in a 720 × 1280 frame.

### 5.6 Docs

`docs/gdd/master-gdd.md` section 4 and appendix B; `docs/ai/DOCS-INDEX.md` (new row CH1H); `docs/ai/STATUS.md`; `CHANGELOG.md`.

## 6. Release consequence

The three levels enter as `planned` and only become `approved` after the reviewer plays them (the gate described in `docs/ai/ARCHITECTURE.md` → Level content pipeline). The release gate therefore moves from 22/28 to 22/31, and the outstanding content work grows from six levels (chapter 4) to nine. This was accepted by the reviewer on 2026-10-06 in favour of improving the campaign level by level.

## 7. Done when

- `npm run content:validate` passes with 31 manifest entries and no validation errors.
- Each of `1-7`, `1-8`, `1-9` reports `solutionCount: 1`, `fewerPieceSolutions: 0`, `proven: true`, and a scored difficulty of 4 or more with no `difficulty-mismatch` warning.
- `npm test` and `npm run build` pass.
- The level select map renders nine nodes in chapter 1 with no overlap or overflow at 720 × 1280.
- The reviewer has played all three levels in the harness and confirmed that in each one the correct decomposition is not readable from the silhouette alone.
