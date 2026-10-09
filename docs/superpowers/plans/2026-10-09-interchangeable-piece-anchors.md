# Interchangeable Piece Anchors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable geometrically identical pieces in anchored levels (e.g. Level 1-1 diamonds) to interchange positions and share anchors, with strict single-occupancy enforcement and reactive target silhouette illumination.

**Architecture:** A domain module (`pieceEquivalence.ts`) detects identical pieces and expands their anchor sets at level load. `drag.ts` and `session.ts` filter out anchors occupied by other pieces. `BoardRenderer.ts` allows any piece in an equivalence group to illuminate corresponding target silhouettes.

**Tech Stack:** TypeScript 5.7, Vitest 2, Phaser 3.90, Vite 6.

**Spec:** [`docs/superpowers/specs/2026-10-09-interchangeable-piece-anchors-design.md`](file:///D:/Working/ASOL/ASOL-GAME-02/docs/superpowers/specs/2026-10-09-interchangeable-piece-anchors-design.md)

## Global Constraints

- Never hand-edit compiled level files in `src/content/levels/<id>.json`.
- Keep existing data models backward-compatible: `Level.pieces` preserves the `Piece` interface with `anchors: readonly Anchor[]`.
- Occupied anchor check must not block a piece from being dropped back onto its own existing anchor.
- Language: English for code, comments, specs, plans, and commit messages.

---

### Task 1: Piece Equivalence & Anchor Pooling Domain Module

**Files:**
- Create: `game-next/src/domain/pieceEquivalence.ts`
- Test: `game-next/tests/domain/pieceEquivalence.test.ts`

**Interfaces:**
- Produces:
  - `arePiecesEquivalent(p1: Piece, p2: Piece): boolean`
  - `expandEquivalentAnchors(level: Level): Level`

- [ ] **Step 1: Write the failing test**

Create `game-next/tests/domain/pieceEquivalence.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { Level, Piece } from '../../src/domain/model.ts';
import { arePiecesEquivalent, expandEquivalentAnchors } from '../../src/domain/pieceEquivalence.ts';

describe('pieceEquivalence', () => {
  const pieceD1: Piece = {
    id: 'D1',
    shapeKind: 'diamond',
    frameSize: 48,
    cells: [[24, 0], [0, 24], [24, 48], [48, 24]],
    anchors: [
      { id: 'A', x: 16, y: 56 },
      { id: 'B', x: 16, y: 72 },
    ],
  };

  const pieceD2: Piece = {
    id: 'D2',
    shapeKind: 'diamond',
    frameSize: 48,
    cells: [[24, 0], [0, 24], [24, 48], [48, 24]],
    anchors: [
      { id: 'A', x: 64, y: 56 },
      { id: 'B', x: 64, y: 72 },
    ],
  };

  const pieceTriangle: Piece = {
    id: 'T1',
    shapeKind: 'triangle',
    frameSize: 48,
    cells: [[0, 0], [48, 0], [0, 48]],
    anchors: [{ id: 'A', x: 16, y: 16 }],
  };

  it('identifies identical pieces as equivalent', () => {
    expect(arePiecesEquivalent(pieceD1, pieceD2)).toBe(true);
    expect(arePiecesEquivalent(pieceD1, pieceTriangle)).toBe(false);
  });

  it('pools anchors across equivalent pieces with unique IDs', () => {
    const dummyLevel: Level = {
      id: '1-1',
      title: 'Song Tinh',
      chapter: 1,
      contentRevision: 'v1',
      rotationEnabled: false,
      placement: 'anchors',
      pieces: [pieceD1, pieceD2, pieceTriangle],
      targetMask: new Uint8Array(128 * 160),
      targetPlacements: [],
    };

    const expanded = expandEquivalentAnchors(dummyLevel);
    const expD1 = expanded.pieces.find((p) => p.id === 'D1')!;
    const expD2 = expanded.pieces.find((p) => p.id === 'D2')!;
    const expT1 = expanded.pieces.find((p) => p.id === 'T1')!;

    // Both D1 and D2 have 4 pooled anchors
    expect(expD1.anchors.length).toBe(4);
    expect(expD2.anchors.length).toBe(4);
    expect(expT1.anchors.length).toBe(1);

    // Anchor coordinates from both D1 and D2 are available in D1
    const d1Coords = expD1.anchors.map((a) => `${a.x},${a.y}`);
    expect(d1Coords).toContain('16,56');
    expect(d1Coords).toContain('64,56');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --maxWorkers=2 --minWorkers=1 --pool=forks tests/domain/pieceEquivalence.test.ts`
Expected: FAIL with "Cannot find module" or "arePiecesEquivalent is not defined".

- [ ] **Step 3: Write minimal implementation**

Create `game-next/src/domain/pieceEquivalence.ts`:
```ts
import type { Anchor, Level, Piece } from './model.ts';

export function arePiecesEquivalent(p1: Piece, p2: Piece): boolean {
  if (p1.id === p2.id) return true;
  if (p1.shapeKind !== p2.shapeKind || p1.frameSize !== p2.frameSize) return false;
  if (p1.cells.length !== p2.cells.length) return false;

  const cellSet = new Set(p1.cells.map(([x, y]) => `${x},${y}`));
  for (const [x, y] of p2.cells) {
    if (!cellSet.has(`${x},${y}`)) return false;
  }
  return true;
}

export function expandEquivalentAnchors(level: Level): Level {
  if (level.placement === 'free' || level.pieces.length <= 1) {
    return level;
  }

  // Find equivalence groups
  const groups: Piece[][] = [];
  for (const piece of level.pieces) {
    let matchedGroup = groups.find((g) => arePiecesEquivalent(g[0], piece));
    if (!matchedGroup) {
      matchedGroup = [];
      groups.push(matchedGroup);
    }
    matchedGroup.push(piece);
  }

  const nextPieces = level.pieces.map((piece) => {
    const group = groups.find((g) => arePiecesEquivalent(g[0], piece));
    if (!group || group.length <= 1) {
      return piece;
    }

    // Pool all anchors across the group
    const pooledAnchors: Anchor[] = [];
    const seenCoord = new Set<string>();

    for (const groupPiece of group) {
      for (const a of groupPiece.anchors) {
        const coordKey = `${a.x},${a.y}`;
        if (!seenCoord.has(coordKey)) {
          seenCoord.add(coordKey);
          // Keep unique anchor id qualified by piece owner if collision occurs
          const id = groupPiece.id === piece.id ? a.id : `${groupPiece.id}:${a.id}`;
          pooledAnchors.push({ id, x: a.x, y: a.y });
        }
      }
    }

    return {
      ...piece,
      anchors: pooledAnchors,
    };
  });

  return {
    ...level,
    pieces: nextPieces,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --maxWorkers=2 --minWorkers=1 --pool=forks tests/domain/pieceEquivalence.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add game-next/src/domain/pieceEquivalence.ts game-next/tests/domain/pieceEquivalence.test.ts
git commit -m "feat(domain): add piece equivalence and anchor expansion module"
```

---

### Task 2: Anchor Occupancy in Snapping & Session

**Files:**
- Modify: `game-next/src/application/drag.ts:59-90` (`snapTarget`)
- Modify: `game-next/src/domain/session.ts:300-322` (`applyCommand` drop logic)
- Test: `game-next/tests/domain/sessionEquivalence.test.ts`

**Interfaces:**
- Consumes:
  - `expandEquivalentAnchors` from `game-next/src/domain/pieceEquivalence.ts`
- Produces:
  - Anchor occupancy checking in `snapTarget` and `applyCommand`

- [ ] **Step 1: Write the failing test**

Create `game-next/tests/domain/sessionEquivalence.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { Level, Piece, PuzzleState } from '../../src/domain/model.ts';
import { expandEquivalentAnchors } from '../../src/domain/pieceEquivalence.ts';
import { applyCommand } from '../../src/domain/session.ts';

describe('sessionEquivalence', () => {
  const pieceD1: Piece = {
    id: 'D1',
    shapeKind: 'diamond',
    frameSize: 48,
    cells: [[24, 0], [0, 24], [24, 48], [48, 24]],
    anchors: [{ id: 'A', x: 16, y: 56 }],
  };

  const pieceD2: Piece = {
    id: 'D2',
    shapeKind: 'diamond',
    frameSize: 48,
    cells: [[24, 0], [0, 24], [24, 48], [48, 24]],
    anchors: [{ id: 'A', x: 64, y: 56 }],
  };

  const level = expandEquivalentAnchors({
    id: '1-1',
    title: 'Song Tinh',
    chapter: 1,
    contentRevision: 'v1',
    rotationEnabled: false,
    placement: 'anchors',
    pieces: [pieceD1, pieceD2],
    targetMask: new Uint8Array(128 * 160),
    targetPlacements: [],
  });

  it('rejects snapping onto an anchor already occupied by another piece', () => {
    // Initial state: D1 is already snapped at (16, 56)
    const state: PuzzleState = {
      phase: 'playing',
      pieces: {
        D1: { kind: 'snapped', anchorId: 'A', turns: 0 },
        D2: { kind: 'tray', turns: 0 },
      },
    };

    // Attempt to drop D2 onto (16, 56)
    const transition = applyCommand(level, state, {
      type: 'drop',
      pieceId: 'D2',
      x: 16,
      y: 56,
    });

    expect(transition.accepted).toBe(true);
    // Should NOT snap to (16, 56) because D1 is already there; outcome should be temporary
    expect(transition.outcome).toBe('temporary');
    expect(transition.state.pieces.D2.kind).toBe('temporary');
  });

  it('allows piece to be dropped back onto its own occupied anchor', () => {
    const state: PuzzleState = {
      phase: 'playing',
      pieces: {
        D1: { kind: 'snapped', anchorId: 'A', turns: 0 },
        D2: { kind: 'tray', turns: 0 },
      },
    };

    const transition = applyCommand(level, state, {
      type: 'drop',
      pieceId: 'D1',
      x: 16,
      y: 56,
    });

    expect(transition.outcome).toBe('snapped');
    expect(transition.state.pieces.D1.kind).toBe('snapped');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --maxWorkers=2 --minWorkers=1 --pool=forks tests/domain/sessionEquivalence.test.ts`
Expected: FAIL because D2 currently snaps to (16, 56).

- [ ] **Step 3: Write minimal implementation**

1. In `game-next/src/domain/session.ts` (around line 304 in `applyCommand` drop handling):
Collect coordinates occupied by other pieces:
```ts
      // Collect anchor positions occupied by OTHER pieces
      const occupiedCoords = new Set<string>();
      for (const [pId, pState] of Object.entries(state.pieces)) {
        if (pId === command.pieceId) continue;
        if (pState.kind === 'snapped') {
          const otherPiece = level.pieces.find((p) => p.id === pId);
          const otherAnchor = otherPiece?.anchors.find((a) => a.id === pState.anchorId);
          if (otherAnchor) {
            occupiedCoords.add(`${otherAnchor.x},${otherAnchor.y}`);
          }
        } else if (pState.kind === 'placed') {
          occupiedCoords.add(`${pState.x},${pState.y}`);
        }
      }
```
In the anchor loop:
```ts
      for (const anchor of piece.anchors) {
        if (occupiedCoords.has(`${anchor.x},${anchor.y}`)) continue;
        const d = (anchor.x - command.x) ** 2 + (anchor.y - command.y) ** 2;
        if (d <= 36 && d < bestDistance && fitsBoard(rotatedCells, anchor.x, anchor.y)) {
          best = anchor;
          bestDistance = d;
        }
      }
```

2. In `game-next/src/application/drag.ts`:
Update `snapTarget` to receive `occupiedCoords: ReadonlySet<string>`:
```ts
function snapTarget(
  level: Level,
  piece: Piece,
  turns: Turns,
  grid: { x: number; y: number },
  occupiedCoords: ReadonlySet<string> = new Set()
): SnapTarget | null {
  ...
  for (const anchor of piece.anchors) {
    if (occupiedCoords.has(`${anchor.x},${anchor.y}`)) continue;
    const d = (anchor.x + halfFrame - grid.x) ** 2 + (anchor.y + halfFrame - grid.y) ** 2;
    if (d <= 36 && d < bestDistance && fitsBoard(rotatedCells, anchor.x, anchor.y)) {
      best = anchor;
      bestDistance = d;
    }
  }
  return best ? { x: best.x, y: best.y, candidateId: best.id } : null;
}
```
And compute `occupiedCoords` in `updateDrag`:
```ts
  const occupiedCoords = new Set<string>();
  for (const [pId, pState] of Object.entries(drag.committedState.pieces)) {
    if (pId === drag.pieceId) continue;
    if (pState.kind === 'snapped') {
      const otherPiece = level.pieces.find((p) => p.id === pId);
      const otherAnchor = otherPiece?.anchors.find((a) => a.id === pState.anchorId);
      if (otherAnchor) occupiedCoords.add(`${otherAnchor.x},${otherAnchor.y}`);
    } else if (pState.kind === 'placed') {
      occupiedCoords.add(`${pState.x},${pState.y}`);
    }
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --maxWorkers=2 --minWorkers=1 --pool=forks tests/domain/sessionEquivalence.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add game-next/src/domain/session.ts game-next/src/application/drag.ts game-next/tests/domain/sessionEquivalence.test.ts
git commit -m "feat(session): filter occupied anchors during drag and drop"
```

---

### Task 3: Integration with PlayScene Level Loading & BoardRenderer Hover

**Files:**
- Modify: `game-next/src/presentation/PlayScene.ts:210-230`
- Modify: `game-next/src/presentation/BoardRenderer.ts:535-555`
- Test: `game-next/tests/presentation/boardRendererEquivalence.test.ts`

**Interfaces:**
- Consumes:
  - `arePiecesEquivalent`, `expandEquivalentAnchors` from `game-next/src/domain/pieceEquivalence.ts`
- Produces:
  - Fully expanded level in `PlayScene`
  - Target silhouette hover reactivity for equivalent pieces

- [ ] **Step 1: Write the failing test**

Create `game-next/tests/presentation/boardRendererEquivalence.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { Piece } from '../../src/domain/model.ts';
import { arePiecesEquivalent } from '../../src/domain/pieceEquivalence.ts';

describe('boardRendererEquivalence', () => {
  const d1: Piece = {
    id: 'D1',
    shapeKind: 'diamond',
    frameSize: 48,
    cells: [[24, 0], [0, 24], [24, 48], [48, 24]],
    anchors: [{ id: 'A', x: 16, y: 56 }],
  };
  const d2: Piece = {
    id: 'D2',
    shapeKind: 'diamond',
    frameSize: 48,
    cells: [[24, 0], [0, 24], [24, 48], [48, 24]],
    anchors: [{ id: 'A', x: 64, y: 56 }],
  };

  it('matches equivalent pieces for target silhouette hover check', () => {
    const isHoverCandidate = (dragId: string, targetPieceId: string) => {
      const dragPiece = [d1, d2].find((p) => p.id === dragId);
      const targetPiece = [d1, d2].find((p) => p.id === targetPieceId);
      if (!dragPiece || !targetPiece) return false;
      return dragPiece.id === targetPiece.id || arePiecesEquivalent(dragPiece, targetPiece);
    };

    expect(isHoverCandidate('D2', 'D1')).toBe(true);
    expect(isHoverCandidate('D1', 'D2')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npm test -- --maxWorkers=2 --minWorkers=1 --pool=forks tests/presentation/boardRendererEquivalence.test.ts`
Expected: PASS.

- [ ] **Step 3: Wire into PlayScene and BoardRenderer**

1. In `game-next/src/presentation/PlayScene.ts`:
Import `expandEquivalentAnchors` from `../domain/pieceEquivalence.ts`.
In `create()` or where `level` is set:
```ts
this.level = expandEquivalentAnchors(rawLevel);
```

2. In `game-next/src/presentation/BoardRenderer.ts`:
Import `arePiecesEquivalent` from `../domain/pieceEquivalence.ts`.
In `syncTargets()`:
```ts
      const targetPiece = this.level.pieces.find((p) => p.id === placement.pieceId);
      const dragPiece = drag ? this.level.pieces.find((p) => p.id === drag.pieceId) : null;
      const isEquivalent =
        dragPiece !== null &&
        targetPiece !== undefined &&
        (dragPiece.id === targetPiece.id || arePiecesEquivalent(dragPiece, targetPiece));

      const candidateId =
        this.level.placement === 'free'
          ? `grid:${placement.x},${placement.y}`
          : targetPiece?.anchors.find((a) => a.x === placement.x && a.y === placement.y)?.id;

      const hovered =
        drag !== null &&
        isEquivalent &&
        candidateId !== undefined &&
        drag.snapCandidateId === candidateId;
```

- [ ] **Step 4: Verify typecheck and build**

Run: `npm run typecheck`
Expected: Clean with no errors.

- [ ] **Step 5: Commit**

```bash
git add game-next/src/presentation/PlayScene.ts game-next/src/presentation/BoardRenderer.ts game-next/tests/presentation/boardRendererEquivalence.test.ts
git commit -m "feat(renderer): expand anchors in PlayScene and support equivalent target hover"
```

---

### Task 4: End-to-End Verification of Level 1-1 Permutation & Full Regression

**Files:**
- Create: `game-next/tests/integration/level11Permutation.test.ts`

**Interfaces:**
- Consumes:
  - Compiled Level 1-1 from `src/content/levels/1-1.json` or authoring source `src/content/sources/1-1.ts`
  - `applyCommand`, `matchesTarget`, `evaluate` from `domain`
- Produces:
  - Verification evidence that Level 1-1 can be solved in both canonical and permuted piece arrangements

- [ ] **Step 1: Write integration test**

Create `game-next/tests/integration/level11Permutation.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { songTinh } from '../../src/content/sources/1-1.ts';
import { validateLevelSource } from '../../src/content/authoring.ts';
import { expandEquivalentAnchors } from '../../src/domain/pieceEquivalence.ts';
import { applyCommand, createInitialPuzzleState } from '../../src/domain/session.ts';

describe('Level 1-1 permutation e2e', () => {
  const result = validateLevelSource(songTinh);
  if (!result.ok) throw new Error('Level 1-1 failed authoring validation');
  const level = expandEquivalentAnchors(result.level);

  it('solves 1-1 via canonical placement (D1 at 16,56; D2 at 64,56)', () => {
    let state = createInitialPuzzleState(level);
    const t1 = applyCommand(level, state, { type: 'drop', pieceId: 'D1', x: 16, y: 56 });
    expect(t1.outcome).toBe('snapped');
    state = t1.state;

    const t2 = applyCommand(level, state, { type: 'drop', pieceId: 'D2', x: 64, y: 56 });
    expect(t2.outcome).toBe('won');
    expect(t2.becameWon).toBe(true);
  });

  it('solves 1-1 via permuted placement (D2 at 16,56; D1 at 64,56)', () => {
    let state = createInitialPuzzleState(level);
    // Drag D2 to left anchor
    const t1 = applyCommand(level, state, { type: 'drop', pieceId: 'D2', x: 16, y: 56 });
    expect(t1.outcome).toBe('snapped');
    state = t1.state;

    // Drag D1 to right anchor
    const t2 = applyCommand(level, state, { type: 'drop', pieceId: 'D1', x: 64, y: 56 });
    expect(t2.outcome).toBe('won');
    expect(t2.becameWon).toBe(true);
  });
});
```

- [ ] **Step 2: Run integration test**

Run: `npm test -- --maxWorkers=2 --minWorkers=1 --pool=forks tests/integration/level11Permutation.test.ts`
Expected: PASS.

- [ ] **Step 3: Run full regression suite**

Run: `npm test`
Run: `npm run typecheck`
Run: `npm run build`
Expected: All suites PASS.

- [ ] **Step 4: Commit**

```bash
git add game-next/tests/integration/level11Permutation.test.ts
git commit -m "test(integration): verify Level 1-1 interchangeable piece permutation"
```
