import { describe, expect, it } from 'vitest';
import { Session } from './session';
import { levels } from './levels';
import type { Level } from './types';


describe('play session', () => {
  it('snaps near an anchor and rejects distant drops without losing the piece', () => {
    const game = new Session();
    const anchor = game.level.pieces[0].anchors[0];
    expect(game.drop(game.level.pieces[0].id, anchor[0] + 2, anchor[1] + 1)).toBe(true);
    expect(game.placements[0]).toMatchObject({ x: anchor[0], y: anchor[1] });
    expect(game.drop(game.level.pieces[0].id, 127, 190)).toBe(false);
    expect(game.placements[0]).toMatchObject({ x: anchor[0], y: anchor[1] });
  });

  it('locks after victory, allows reset, then advances after another victory', () => {
    const game = new Session();
    const piece = game.level.pieces[0];
    for (const goal of game.level.solution) expect(game.drop(goal.pieceId, goal.x, goal.y)).toBe(true);
    expect(game.won).toBe(true);
    expect(game.drop(piece.id, 0, 0)).toBe(false);
    game.reset();
    expect(game.won).toBe(false);
    expect(game.placements).toHaveLength(0);
    for (const goal of game.level.solution) game.drop(goal.pieceId, goal.x, goal.y);
    expect(game.next()).toBe(true);
    expect(game.level.id).toBe('1-2');
  });

  it('moves an existing piece and brings it to the visible top', () => {
    const game = new Session(3);
    const [first, second] = game.level.pieces;
    const [firstGoal] = game.level.solution;
    game.drop(first.id, firstGoal.x, firstGoal.y);
    game.drop(second.id, second.anchors[1][0], second.anchors[1][1]);
    expect(game.placements.at(-1)?.pieceId).toBe(second.id);
    game.drop(first.id, first.anchors[1][0], first.anchors[1][1]);
    expect(game.placements.at(-1)?.pieceId).toBe(first.id);
  });

  it('removes a snapped piece without changing the level', () => {
    const game = new Session();
    const piece = game.level.pieces[0];
    const solution = game.level.solution[0];
    expect(game.drop(piece.id, solution.x, solution.y)).toBe(true);
    expect(game.remove(piece.id)).toBe(true);
    expect(game.placements).toHaveLength(0);
    expect(game.won).toBe(false);
    expect(game.remove(piece.id)).toBe(false);
  });

  it('does not count a piece removed from its anchor', () => {
    const game = new Session(0);
    const first = game.level.solution[0];
    game.drop(first.pieceId, first.x, first.y);
    expect(game.remove(first.pieceId)).toBe(true);
    expect(game.placements).toHaveLength(0);
    expect(game.result.some(Boolean)).toBe(false);
    expect(game.won).toBe(false);
  });

  it('uses a smaller snap radius', () => {
    const game = new Session();
    const piece = game.level.pieces[0];
    const solution = game.level.solution[0];
    expect(game.drop(piece.id, solution.x + 6, solution.y)).toBe(true);
    game.reset();
    expect(game.drop(piece.id, solution.x + 7, solution.y)).toBe(false);
  });

  it('accepts the authored solution for every level', () => {
    for (let levelIndex = 0; levelIndex < levels.length; levelIndex += 1) {
      const game = new Session(levelIndex);
      for (const placement of game.level.solution) {
        expect(game.drop(placement.pieceId, placement.x, placement.y)).toBe(true);
      }
      expect(game.won).toBe(true);
    }
  });

  it('cannot win any level with an essential piece missing', () => {
    levels.forEach((level, index) => {
      for (const missing of level.pieces) {
        const game = new Session(index);
        for (const goal of level.solution.filter(p => p.pieceId !== missing.id)) game.drop(goal.pieceId, goal.x, goal.y);
        expect(game.won).toBe(false);
      }
    });
  });

  it('supports playing an explicit custom Level instance', () => {
    const customLevel: Level = {
      id: 'custom-test-1',
      title: 'Custom Puzzle',
      pieces: [
        {
          id: 'cp1',
          color: 0xffd166,
          cells: [[0, 0], [1, 0], [0, 1], [1, 1]],
          anchors: [[20, 30]],
        },
      ],
      solution: [{ pieceId: 'cp1', x: 20, y: 30 }],
    };

    const game = new Session(customLevel);
    expect(game.levelId).toBe('custom-test-1');
    expect(game.level.title).toBe('Custom Puzzle');
    expect(game.drop('cp1', 21, 30)).toBe(true);
    expect(game.won).toBe(true);
    expect(game.remove('cp1')).toBe(true);
    expect(game.won).toBe(false);
  });

  it('validates candidate solutions with canSaveSolution', () => {
    const level = levels[0];
    expect(Session.canSaveSolution(level, level.solution)).toBe(true);
    expect(Session.canSaveSolution(level, [])).toBe(false);
    expect(Session.canSaveSolution(level, [{ pieceId: level.pieces[0].id, x: 999, y: 999 }])).toBe(false);
  });
});

