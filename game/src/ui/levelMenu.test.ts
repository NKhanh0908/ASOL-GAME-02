import { describe, it, expect, beforeEach } from 'vitest';
import { LevelRepository } from '../domain/levelRepository';
import { levels } from '../domain/levels';
import { square } from '../domain/shapes';
import type { CustomLevelRecord } from '../domain/types';
import { campaignChapters, formatLevelLabel, groupLevels, resolveLevel } from './levelMenu';

describe('levelMenu helpers', () => {
  beforeEach(() => {
    LevelRepository.clearForTests();
  });

  const customSample: CustomLevelRecord = {
    id: 'custom-sample-1',
    title: 'Star Pattern',
    kind: 'new',
    target: new Uint8Array(128 * 192),
    createdAt: 1000,
    updatedAt: 1000,
    pieces: [{ id: 'p1', color: 0xffd166, cells: square(48), anchors: [] }],
    solution: [{ pieceId: 'p1', x: 0, y: 0 }],
  };

  it('formats built-in and custom level labels clearly', () => {
    expect(formatLevelLabel(levels[0])).toBe(`${levels[0].id} · ${levels[0].title}`);
    expect(formatLevelLabel(customSample)).toBe('Star Pattern · level mới');
  });


  it('groups levels into built-in and custom collections', () => {
    LevelRepository.save(customSample);
    const all = LevelRepository.list();
    const { builtIn, custom } = groupLevels(all);

    expect(builtIn).toHaveLength(levels.length);
    expect(custom).toHaveLength(1);
    expect(custom[0].id).toBe('custom-sample-1');
  });

  it('resolves explicit level by id or falls back to first built-in level', () => {
    LevelRepository.save(customSample);
    expect(resolveLevel('custom-sample-1').id).toBe('custom-sample-1');
    expect(resolveLevel('1-2').id).toBe('1-2');
    expect(resolveLevel('non-existent-id').id).toBe('1-1');
    expect(resolveLevel(undefined).id).toBe('1-1');
  });

  it('groups the campaign into three six-level chapters', () => {
    expect(campaignChapters().map(chapter => chapter.levels.map(level => level.id))).toEqual([
      ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6'],
      ['2-1', '2-2', '2-3', '2-4', '2-5', '2-6'],
      ['3-1', '3-2', '3-3', '3-4', '3-5', '3-6'],
    ]);
  });
});
