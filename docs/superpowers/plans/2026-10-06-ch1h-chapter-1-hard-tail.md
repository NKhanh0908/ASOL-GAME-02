# CH1H — Chapter 1 hard tail (1-7, 1-8, 1-9) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Append three difficulty-4 levels to chapter 1 that make the player deduce *which* pieces form a silhouette, using neither rotation nor overlap.

**Architecture:** Task 1 widens the campaign from 28 to 31 levels and registers three `planned` rows, so the map and the release gate are correct before any content exists. Tasks 2–4 author one level each through `content:new` → edit source → `content:author` → read the report, iterating until the solver proves a single solution and the scored difficulty is 4 or more. Task 5 closes out the docs.

**Tech Stack:** TypeScript 5.7, Vitest 2, the `content:new` / `content:author` / `content:validate` scripts, the `kit.ts` composition helpers.

**Spec:** `docs/superpowers/specs/2026-10-06-chapter-1-hard-tail-design.md`

## Global Constraints

- Node `>=24.13.1 <25`. All commands run from `game-next/`.
- **Never hand-edit `src/content/levels/<id>.json`.** Change `src/content/sources/<id>.ts` and re-run `npm run content:author -- <id>`.
- Chapter 1 rules: `chapter: 1`, `rotationEnabled: false`, anchored placement (omit the `placement` field), `ftueSteps: []`.
- **No overlapping pieces.** The parity/XOR rule is chapter 2's lesson; a chapter 1 solution must have every cell covered by exactly one piece.
- Frame rules from `isValidFrame`: square `%8`; triangle orientation 0–3 `%8`, orientation 4–7 `%16`; diamond and circle `%16`; parallelogram `%48`. Anchors are multiples of 8.
- Player-facing strings (`title`, `learningObjective`, `victoryVerse`, `distractors[].reason`) are **Vietnamese**. Code comments Vietnamese; commit messages English.
- Acceptance per level, read from `docs/testing/levels/<id>-report.md`: `solutionCount: 1`, `fewerPieceSolutions: 0`, `proven: true`, scored difficulty ≥ 4, and no `difficulty-mismatch` warning.
- Levels enter the manifest as `status: 'planned'` and are promoted to `validated` by `content:author`. **Only the reviewer (NKhanh0908) sets `approved`, after playing.** No task in this plan sets `approved`.
- Per `AGENTS.md`: run `impact` before editing a symbol and `detect_changes()` before each commit.

---

### Task 1: Widen the campaign to 31 levels

Do this first so the map, the gate and the tests are consistent before content lands.

**Files:**
- Modify: `game-next/src/content/chapters.ts:21`, `game-next/src/content/manifest.ts`
- Test: `game-next/tests/content.test.ts`, `game-next/tests/catalog.test.ts`, `game-next/tests/levelSelect.test.ts`

**Interfaces:**
- Produces: manifest ids `1-7`, `1-8`, `1-9` at `order` 7, 8, 9; `RELEASE_LEVEL_COUNT === 31`.

- [ ] **Step 1: Run impact analysis**

Run `impact({target: "RELEASE_LEVEL_COUNT", direction: "upstream"})`. Expected: risk LOW, no callers in the graph; the real references are `releaseGate` in the same file, `tests/content.test.ts`, and a comment in `scripts/validate-content.ts`. Report it; warn the user if HIGH or CRITICAL.

- [ ] **Step 2: Write the failing test**

In `game-next/tests/content.test.ts`, change the three existing assertions:

```ts
    expect(RELEASE_LEVEL_COUNT).toBe(31);
    expect(campaignManifest).toHaveLength(RELEASE_LEVEL_COUNT);
```

and

```ts
    expect(releaseGate(allApproved)).toEqual({ ok: true, approved: 31, required: 31 });
```

Add a new assertion that chapter 1 now holds nine levels in order:

```ts
  it('chương 1 có chín màn, order liền mạch 1..9', () => {
    const ch1 = campaignManifest.filter((e) => e.chapter === 1);
    expect(ch1.map((e) => e.id)).toEqual(['1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '1-8', '1-9']);
    expect(ch1.map((e) => e.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- tests/content.test.ts`
Expected: FAIL — `RELEASE_LEVEL_COUNT` is 28 and chapter 1 has six entries.

- [ ] **Step 4: Make the change**

In `src/content/chapters.ts`:

```ts
/** Bản phát hành cần đủ ngần này màn approved (CH-04). */
export const RELEASE_LEVEL_COUNT = 31;
```

In `src/content/manifest.ts`, add three rows directly after the `1-6` row:

```ts
  { id: '1-7', title: 'Mảnh Khuất', chapter: 1, order: 7, contentRevision: 'manh-khuat-v1', status: 'planned', dataPath: 'src/content/levels/1-7.json' },
  { id: '1-8', title: 'Lối Chia Sai', chapter: 1, order: 8, contentRevision: 'loi-chia-sai-v1', status: 'planned', dataPath: 'src/content/levels/1-8.json' },
  { id: '1-9', title: 'Ngũ Hành Tinh', chapter: 1, order: 9, contentRevision: 'ngu-hanh-tinh-v1', status: 'planned', dataPath: 'src/content/levels/1-9.json' },
```

Then renumber `order` on every row from `2-1` onward: each existing value gains 3, so `2-1` goes 7 → 10 and the last row, `4-6`, goes 28 → 31. Check the final row reads `order: 31`.

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS. If `catalog.test.ts` or `levelSelect.test.ts` assert a campaign size or a chapter-1 node count, update those numbers too — 28 → 31 and 6 → 9. Do not weaken an assertion to make it pass; change the expected number only.

- [ ] **Step 6: Check the map still lays out**

`layoutCampaignMap` uses `TEN_NODE_PATTERN` only for a constellation of exactly ten nodes, so nine nodes fall through to `zigzagX` and no layout change is needed. Confirm `levelSelect.test.ts` still asserts no node overlap and no overflow at 720 × 1280; if it has no such assertion, add one for chapter 1.

- [ ] **Step 7: Run `detect_changes` and commit**

```bash
git add game-next/src/content/chapters.ts game-next/src/content/manifest.ts game-next/tests/ CHANGELOG.md
git commit -m "feat(content): widen the campaign to 31 levels for the chapter 1 hard tail"
```

---

### Task 2: Level 1-7 "Mảnh Khuất"

**Ambiguity mechanism:** containment. One piece lies wholly inside the silhouette, so the outline reveals neither its presence nor its shape.

**Files:**
- Create: `game-next/src/content/sources/1-7.ts` (via `content:new`, which also edits `sources/index.ts`)
- Generated: `src/content/levels/1-7.json`, `docs/testing/levels/1-7.svg`, `docs/testing/levels/1-7-report.md`

- [ ] **Step 1: Scaffold**

```bash
cd game-next && npm run content:new -- 1-7 --from 1-6
```

This writes `src/content/sources/1-7.ts` and registers it in `sources/index.ts`. It does not touch the manifest — Task 1 already added the row.

- [ ] **Step 2: Author the composition**

Target shape: a **square core with a triangular cap on each of its four sides**, so the silhouette reads as one solid pointed form and the core square's four edges are all interior.

Starting geometry — a 48 square centred at (64, 80), capped by four roof triangles of frame 48:

| Piece | Kind | Orientation | Frame | Anchor A | Role |
|---|---|---|---|---|---|
| `S1` | square | 0 | 48 | (40, 56) | the hidden core, x 40–88, y 56–104 |
| `T_up` | triangle | 4 (apex up) | 48 | (40, 8) | drawn half spans y 32–56, base meets the core's top edge |
| `T_down` | triangle | 6 (apex down) | 48 | (40, 104) | drawn half spans y 104–128, base meets the core's bottom edge |
| `T_left` | triangle | 7 (apex left) | 48 | (-8, 56) | drawn half spans x 16–40, base meets the core's left edge |
| `T_right` | triangle | 5 (apex right) | 48 | (88, 56) | drawn half spans x 88–112, base meets the core's right edge |

**Known risk, resolve it here rather than guessing:** roof triangles draw only half their frame, so `T_left` wants a negative anchor x. The solver and `fitsBoard` test the rasterised *cells*, which land at x 16–40 and are on the board — but the validator may still reject a negative anchor. Run Step 3 and read the error. If negative anchors are rejected, shrink the two side caps to frame 32 (their drawn half is 16 deep, anchors become (24, 64) and (88, 64) with a 32-tall base) and accept that the core's left and right edges are then only partly covered; the top and bottom caps still carry the containment. Record whichever you chose in the file's comment block.

Give every piece 2–3 decoy anchors using `NUDGE`-style offsets, and write a `distractors` entry for each with a Vietnamese reason. Set `difficultyEstimate: 4`.

```ts
  learningObjective: 'Bóng mục tiêu không cho biết có bao nhiêu mảnh',
```

- [ ] **Step 3: Author and read the report**

```bash
npm run content:author -- 1-7
```

Open `docs/testing/levels/1-7-report.md`. Required: `solutionCount: 1`, `fewerPieceSolutions: 0`, `proven: true`, difficulty ≥ 4, no `difficulty-mismatch`.

- [ ] **Step 4: Iterate until the report is green**

- `solutionCount > 1` — two pieces are interchangeable. Make a pair differ in `frameSize`, or remove a decoy anchor that creates the alternative (KIT-03 drops some automatically; the report lists which).
- `fewerPieceSolutions > 0` — the silhouette is reachable without every piece. Change the composition so each piece covers cells no other can.
- Difficulty < 4 — raise `hiddenEdges` by deepening the caps so more of the core is enclosed, and raise `choices` by adding a decoy anchor per piece. `hollow` and `revive` are 0 here by design and cannot be used.

Re-run `content:author` after each change. Do not edit the JSON.

- [ ] **Step 5: Check the picture**

Open `docs/testing/levels/1-7.svg`. The silhouette must read as one solid shape with **no visible seam** where the core meets a cap. If a seam shows, the pieces are not edge-adjacent and the level fails its own premise.

- [ ] **Step 6: Play it**

```bash
npm run dev
```

Open `?scene=play&level=1-7&mode=harness`. Confirm it is solvable, that the correct placement is not obvious from the silhouette, and that the decoy anchors are tempting rather than absurd.

- [ ] **Step 7: Commit**

```bash
git add game-next/src/content/sources/1-7.ts game-next/src/content/sources/index.ts game-next/src/content/levels/1-7.json game-next/src/content/manifest.ts docs/testing/levels/1-7.svg docs/testing/levels/1-7-report.md CHANGELOG.md
git commit -m "feat(content): level 1-7 Manh Khuat"
```

The `CHANGELOG.md` entry records the final difficulty score and the solver result from the report.

---

### Task 3: Level 1-8 "Lối Chia Sai"

**Ambiguity mechanism:** a misleading axis of symmetry. The silhouette looks splittable down the middle; the tray cannot do it.

**Files:**
- Create: `game-next/src/content/sources/1-8.ts`
- Generated: `src/content/levels/1-8.json`, `docs/testing/levels/1-8.svg`, `docs/testing/levels/1-8-report.md`

- [ ] **Step 1: Scaffold**

```bash
cd game-next && npm run content:new -- 1-8 --from 1-7
```

- [ ] **Step 2: Author the composition**

Target shape: a **symmetric outline with an asymmetric interior split**. A worked starting point is a 96 × 48 rectangle — mirror-symmetric about x = 64, so the eye proposes two 48 squares — filled instead by four pieces whose seams ignore that axis:

| Piece | Kind | Orientation | Frame | Anchor A | Covers |
|---|---|---|---|---|---|
| `Q1` | square | 0 | 48 | (16, 56) | the left third, x 16–64, y 56–104 |
| `T1` | triangle | 1 | 48 | (64, 56) | upper-right wedge of the middle |
| `T2` | triangle | 3 | 48 | (64, 56) | lower-left wedge, completing the middle square |
| `Q2` | square | 0 | 24 | (112, 56) | a 24 tail the symmetric reading has no piece for |

Adjust until the outline really is mirror-symmetric while the piece seams are not. Then place the decoys **exactly where the symmetric misreading puts each piece** — that is the whole point of the level — and name each in `distractors`:

```ts
  distractors: [
    { pieceId: 'Q1', anchorId: 'B', reason: 'Đặt ô vuông theo nửa trái của trục đối xứng' },
    { pieceId: 'Q2', anchorId: 'B', reason: 'Đặt ô vuông theo nửa phải, bỏ lại khe ở giữa' },
  ],
```

```ts
  learningObjective: 'Đối xứng của bóng không phải đối xứng của mảnh',
  difficultyEstimate: 4,
```

- [ ] **Step 3: Author and read the report**

```bash
npm run content:author -- 1-8
```

Same acceptance as Task 2, with one addition: `nearMiss` is this level's primary lever, so check in the report that the smallest `changedCells` across the distractors is small relative to the target size. If a distractor changes a large fraction of the cells, it is not tempting — move it closer.

- [ ] **Step 4: Iterate until the report is green**

As Task 2 Step 4. The specific failure to watch for here: if `solutionCount > 1`, the symmetric split probably *does* work with the current tray. Change a frame size so it cannot.

- [ ] **Step 5: Check the picture and play it**

Open `docs/testing/levels/1-8.svg` and confirm the outline looks symmetric. Then `?scene=play&level=1-8&mode=harness` and confirm the instinctive first move is the symmetric one and that it fails.

- [ ] **Step 6: Commit**

```bash
git add game-next/src/content/sources/1-8.ts game-next/src/content/sources/index.ts game-next/src/content/levels/1-8.json game-next/src/content/manifest.ts docs/testing/levels/1-8.svg docs/testing/levels/1-8-report.md CHANGELOG.md
git commit -m "feat(content): level 1-8 Loi Chia Sai"
```

---

### Task 4: Level 1-9 "Ngũ Hành Tinh"

**Ambiguity mechanism:** volume of choices. Five pieces, two same-kind pairs at different frame sizes, four anchors each.

**Files:**
- Create: `game-next/src/content/sources/1-9.ts`
- Generated: `src/content/levels/1-9.json`, `docs/testing/levels/1-9.svg`, `docs/testing/levels/1-9-report.md`

- [ ] **Step 1: Scaffold**

```bash
cd game-next && npm run content:new -- 1-9 --from 1-7
```

- [ ] **Step 2: Author the composition**

Five pieces, built so the eye cannot sort them by size:

| Piece | Kind | Orientation | Frame | Role |
|---|---|---|---|---|
| `Q1` | square | 0 | 48 | pair A, larger |
| `Q2` | square | 0 | 32 | pair A, smaller — same kind, different frame |
| `T1` | triangle | 4 | 48 | pair B, larger roof |
| `T2` | triangle | 4 | 32 | pair B, smaller roof — same kind and orientation, different frame |
| `D1` | diamond | 0 | 32 | the piece that fills the remaining gap |

Compose them into one continuous silhouette at the centre of the board — use `kit.ts` (`piece`, `mirrorX`, `concentric`) rather than computing frame origins by hand. Give **every** piece four anchors via `CROSS`.

**KIT-03 applies here:** a decoy duplicating anchor A of a piece with the same kind, orientation *and* frame is dropped automatically. The differing `frameSize` inside each pair is what keeps both pairs' decoys legal. The report lists any anchor that was dropped — read that section.

```ts
  learningObjective: 'Suy ngược từ khay về bóng, không suy xuôi từ bóng',
  difficultyEstimate: 5,
  victoryVerse: 'Năm vì sao về đúng chỗ, Cổ Ngữ khép lại chương đầu.',
```

- [ ] **Step 3: Author and read the report**

```bash
npm run content:author -- 1-9
```

Acceptance as before. Target difficulty 5; if the report scores 4, keep `difficultyEstimate: 4` rather than leaving a `difficulty-mismatch` warning — the score is the authority, not the guess.

- [ ] **Step 4: Iterate until the report is green**

Five pieces with four anchors each is the largest search in chapter 1; if the solver reports `proven: false` it hit `SOLVER_LIMIT`. Reduce the anchor count on one piece and re-run. A level that cannot be proven unique must not ship.

- [ ] **Step 5: Check the picture and play it**

Open the SVG, then `?scene=play&level=1-9&mode=harness`. This is the chapter finale — it should take noticeably longer than 1-8 without feeling arbitrary.

- [ ] **Step 6: Commit**

```bash
git add game-next/src/content/sources/1-9.ts game-next/src/content/sources/index.ts game-next/src/content/levels/1-9.json game-next/src/content/manifest.ts docs/testing/levels/1-9.svg docs/testing/levels/1-9-report.md CHANGELOG.md
git commit -m "feat(content): level 1-9 Ngu Hanh Tinh"
```

---

### Task 5: Documentation and close-out

**Files:**
- Modify: `docs/gdd/master-gdd.md`, `docs/ai/DOCS-INDEX.md`, `docs/ai/STATUS.md`, `docs/ai/ARCHITECTURE.md`

- [ ] **Step 1: Update the GDD**

Section 4 (campaign) and appendix B: chapter 1 now holds nine levels and the campaign holds 31.

- [ ] **Step 2: Update `docs/ai/ARCHITECTURE.md`**

Add the invariant that chapter 1 is the no-overlap, no-rotation chapter, so its only difficulty levers are piece count, decoy anchors, near-miss distance and hidden edges — ceiling 0.80 raw against the 0.43 threshold for difficulty 4.

- [ ] **Step 3: Update `docs/ai/DOCS-INDEX.md`**

Set the CH1H row's plan column to this file and its state to `done`.

- [ ] **Step 4: Overwrite `docs/ai/STATUS.md`**

Update "Now", the streams table and the open decisions; note that the three levels are `validated` and waiting for the reviewer to play them; keep it ≤ 60 lines; bump the date line.

- [ ] **Step 5: Final verification**

```bash
npm test
npm run build
npm run content:validate
```

Then `git diff --check` and `git status` from the repo root. `content:validate -- --release` will still fail, correctly: it needs 31 approved and the new levels are `validated`. Report the real output.

- [ ] **Step 6: Commit**

```bash
git add docs/ CHANGELOG.md
git commit -m "docs(ch1h): record the chapter 1 hard tail"
```

- [ ] **Step 7: Reviewer stop point**

**Stop here.** The three levels are `validated`, not `approved`. Only NKhanh0908 promotes them, after playing each one and confirming that the correct decomposition is not readable from the silhouette alone. Do not set `approved` and do not continue past this point.

---

## Self-Review

**Spec coverage.** §4.1 → Task 2. §4.2 → Task 3. §4.3 → Task 4. §4.4 (shared authoring requirements and the author loop) → Global Constraints plus Step 2–4 of each level task. §5.1 → Tasks 2–4. §5.2 and §5.3 → Task 1 Step 4. §5.4 (no layout change) → Task 1 Step 6. §5.5 → Task 1 Steps 2 and 5. §5.6 → Task 5. §6 (release consequence) → Task 5 Step 5. §7 "Done when" → the per-level acceptance in Global Constraints plus Task 5 Step 5 and the stop point at Step 7.

**Where this plan deliberately does not specify.** The exact cell geometry of each level is given as a starting composition, not as a final answer, because uniqueness is a property only the solver can establish — a plan that asserted final coordinates would be guessing. The stopping condition is precise instead: the four report fields in Global Constraints. Task 2 Step 2 names the one geometric unknown found while planning (whether the validator accepts a negative anchor for a roof triangle) and gives the fallback rather than hiding it.

**Type consistency.** Level ids, titles and `contentRevision` slugs match between Task 1's manifest rows and Tasks 2–4: `1-7` / Mảnh Khuất / `manh-khuat-v1`, `1-8` / Lối Chia Sai / `loi-chia-sai-v1`, `1-9` / Ngũ Hành Tinh / `ngu-hanh-tinh-v1`. If a title changes during authoring, the manifest row must change with it.
