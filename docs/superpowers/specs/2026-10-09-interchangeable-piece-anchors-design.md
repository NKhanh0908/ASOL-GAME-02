# IPA — Interchangeable Piece Anchors & Equivalence Grouping

Date: 2026-10-09 · Scope: `game-next/src/domain`, `game-next/src/application`, `game-next/src/presentation` · Related: R (Rebuild), CH1 (Chapter 1 levels), D (Free placement).

## 1. Context & Problem

In Mirror, players place geometric pieces on a grid to match a target silhouette under the parity (XOR) rule.

In anchored placement levels (`placement: 'anchors'`, which comprises Chapters 1–3), each piece historically defines its own discrete array of anchors:
```ts
pieces: [
  { id: 'D1', shapeKind: 'diamond', frameSize: 48, anchors: [{ id: 'A', x: 16, y: 56 }, { id: 'B', x: 16, y: 72 }] },
  { id: 'D2', shapeKind: 'diamond', frameSize: 48, anchors: [{ id: 'A', x: 64, y: 56 }, { id: 'B', x: 64, y: 72 }] },
]
```

In Level 1-1 ("Song Tinh"), pieces `D1` and `D2` are completely identical diamonds. The target silhouette is composed of two symmetrical diamonds at `(16, 56)` and `(64, 56)`.
However, because anchors are strictly bound to individual piece IDs:
- `D1` can only snap to `x = 16`.
- `D2` can only snap to `x = 64`.

If a player drags `D2` to the left target silhouette `(16, 56)`, `D2` has no anchor defined at `(16, 56)`. The piece fails to snap and drops into the tray or temporary position. This causes player confusion and frustration: both pieces look and behave identically, and placing `D2` on the left and `D1` on the right yields the exact same visual and mathematical XOR solution, yet the game arbitrarily rejects it based on hidden internal piece IDs.

## 2. Goals & Non-goals

### Goals
- **Equivalence Recognition**: Automatically group pieces that have identical geometry (`shapeKind`, `frameSize`, base `cells` layout) into equivalence groups at runtime.
- **Anchor Pooling**: Allow equivalent pieces within the same level to share each other's anchors, enabling valid symmetric permutations of identical pieces.
- **Anchor Occupancy Enforcement**: Prevent multiple pieces from snapping to the exact same anchor coordinates simultaneously. An anchor is occupied if another piece currently rests at that `(x, y)` location.
- **Target Silhouette Feedback**: In `BoardRenderer.ts`, ensure that hovering any piece from the matching equivalence group over a target position illuminates the target silhouette (`hovered = 1`).
- **Zero Asset Breakage**: Implement this at the engine/runtime level so that no existing authored level source (`src/content/sources/`), compiled level JSON (`src/content/levels/`), or validation schema requires manual edits or bulk re-authoring.

### Non-goals
- **Cross-geometry Sharing**: Pieces with different shapes, different frame sizes, or different cell arrangements do not share anchors.
- **Free Placement Alterations**: Levels with `placement === 'free'` (where pieces snap to any valid grid intersection) already support arbitrary placement and do not use discrete anchor sets.
- **Level Authoring Redesign**: We do not alter the `LevelSource` or `LevelDocument` schemas.

## 3. Architecture & Design

### 3.1 Domain Model: Equivalence & Anchor Expansion (`src/domain/pieceEquivalence.ts`)

A dedicated domain module defines equivalence criteria and anchor expansion:

```ts
/** Two pieces are geometrically equivalent if they share shapeKind, frameSize, and cell configuration */
export function arePiecesEquivalent(p1: Piece, p2: Piece): boolean {
  if (p1.shapeKind !== p2.shapeKind || p1.frameSize !== p2.frameSize) return false;
  if (p1.cells.length !== p2.cells.length) return false;
  // Compare cell coordinates
  const s1 = new Set(p1.cells.map(([x, y]) => `${x},${y}`));
  return p2.cells.every(([x, y]) => s1.has(`${x},${y}`));
}
```

When instantiating a `Level` for gameplay:
```ts
export function expandEquivalentAnchors(level: Level): Level
```
For each equivalence group containing $\ge 2$ pieces:
1. Collect the union of all anchors across the group.
2. Ensure anchor IDs remain distinct when pooled (e.g. prefixing or qualifying with `${piece.id}:${anchor.id}` if duplicate IDs exist across pieces).
3. Assign the pooled anchor list to every piece in that equivalence group.

Because `Level.pieces` now contains the expanded anchors:
- `placementsOf()` in `session.ts` resolves any snapped `anchorId` directly on `piece.anchors`.
- `anchorCenter()` in `BoardRenderer.ts` locates the anchor coordinates without needing external lookups.
- Existing data structures and downstream consumers remain intact.

### 3.2 Anchor Occupancy & Snapping (`src/application/drag.ts`, `src/domain/session.ts`)

#### Snapping Candidate Filter
When evaluating potential snap anchors for piece $P$ (in `snapTarget` and `applyCommand`):
1. An anchor `(a.x, a.y)` is **occupied** if there exists another piece $Q \neq P$ currently snapped (`kind === 'snapped'` or `kind === 'placed'`) whose coordinates equal `(a.x, a.y)`.
2. Occupied anchors are strictly excluded from the candidate search.
3. *Self-exemption*: If piece $P$ is currently snapped at `(a.x, a.y)`, that anchor is NOT considered occupied against $P$. This ensures lifting and dropping $P$ back onto its current spot remains responsive.

#### Turn and Rotation Bounds
When checking `fitsBoard(rotatedCells, anchor.x, anchor.y)`, the check executes against the rotated shape and candidate anchor coordinates.

### 3.3 Visual Presentation (`src/presentation/BoardRenderer.ts`)

#### Target Silhouette Hover
In `BoardRenderer.syncTargets()`:
Currently:
```ts
const hovered =
  drag !== null &&
  drag.pieceId === placement.pieceId &&
  candidateId !== undefined &&
  drag.snapCandidateId === candidateId;
```

Update to:
```ts
const targetPiece = this.level.pieces.find((p) => p.id === placement.pieceId);
const dragPiece = drag ? this.level.pieces.find((p) => p.id === drag.pieceId) : null;
const isEquivalent =
  dragPiece !== null &&
  targetPiece !== undefined &&
  (dragPiece.id === targetPiece.id || arePiecesEquivalent(dragPiece, targetPiece));

const hovered =
  drag !== null &&
  isEquivalent &&
  candidateId !== undefined &&
  drag.snapCandidateId === candidateId;
```
This ensures that dragging either `D1` or `D2` over either diamond target silhouette triggers the hover illumination.

## 4. Key Execution Scenarios

1. **Symmetric Permutation (Level 1-1)**:
   - Player drags `D2` to left target `(16, 56)` $\rightarrow$ Snaps successfully.
   - Player drags `D1` to right target `(64, 56)` $\rightarrow$ Snaps successfully.
   - Parity XOR evaluation computes identical result $\rightarrow$ Level completes with Victory ritual.

2. **Occupied Anchor Collision**:
   - `D1` is resting at `(16, 56)`.
   - Player drags `D2` over `(16, 56)` $\rightarrow$ Anchor `(16, 56)` is marked occupied.
   - `D2` ignores anchor `(16, 56)`. If released without reaching another valid anchor, `D2` enters temporary/tray state.

3. **Different Shapes / Frames**:
   - In a level containing a triangle and a square, or diamonds of frameSize 32 and frameSize 48:
   - `arePiecesEquivalent()` returns `false`.
   - Anchors are not pooled; each piece only snaps to its authored anchors.

## 5. Verification Plan

### Automated Tests
- `game-next/tests/domain/pieceEquivalence.test.ts`:
  - Verify equivalence detection across same and different `shapeKind`, `frameSize`, and cell layouts.
  - Verify anchor expansion produces correct pooled anchors and preserves distinct IDs.
- `game-next/tests/domain/sessionEquivalence.test.ts`:
  - Test Level 1-1 with both standard placement and permuted placement (`D2` on left, `D1` on right); verify `matchesTarget` and `isWon`.
  - Test occupancy check: ensure second piece cannot snap to an already occupied anchor.
- `game-next/tests/application/dragEquivalence.test.ts`:
  - Verify `snapTarget` filters out occupied anchors during drag updates.
- Full regression:
  - `npm test` across all existing suites.
  - `npm run typecheck` and `npm run build`.
