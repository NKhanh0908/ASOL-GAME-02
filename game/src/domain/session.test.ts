import { describe, expect, it } from 'vitest';
import { Session } from './session';

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
    const solution = game.level.solution[0];
    expect(game.drop(piece.id, solution.x, solution.y)).toBe(true);
    expect(game.won).toBe(true);
    expect(game.drop(piece.id, 0, 0)).toBe(false);
    game.reset();
    expect(game.won).toBe(false);
    expect(game.placements).toHaveLength(0);
    game.drop(piece.id, solution.x, solution.y);
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
});
