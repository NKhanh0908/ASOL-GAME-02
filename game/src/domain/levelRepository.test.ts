import { describe, it, expect, beforeEach } from 'vitest';
import { LevelRepository } from './levelRepository';
import { levels } from './levels';
import type { CustomLevelRecord } from './types';
import { square } from './shapes';

describe('LevelRepository', () => {
  beforeEach(() => {
    LevelRepository.clearForTests();
  });

  const validRecord: CustomLevelRecord = {
    id: 'custom-1',
    title: 'My Custom Level',
    sourceLevelId: '1-1',
    custom: true,
    createdAt: 1000,
    updatedAt: 1000,
    pieces: [
      {
        id: 'p1',
        color: 0xffd166,
        cells: square(48),
        anchors: [],
      },
    ],
    solution: [
      {
        pieceId: 'p1',
        x: 10,
        y: 10,
      },
    ],
  };

  it('lists built-in levels when storage is empty', () => {
    const list = LevelRepository.list();
    expect(list.length).toBe(levels.length);
    expect(list.map((l) => l.id)).toEqual(levels.map((l) => l.id));
  });

  it('saves and reads custom levels after built-in levels', () => {
    LevelRepository.save(validRecord);
    const list = LevelRepository.list();
    expect(list.length).toBe(levels.length + 1);
    expect(list[list.length - 1]).toEqual(validRecord);
    expect(LevelRepository.get('custom-1')).toEqual(validRecord);
    expect(LevelRepository.get('1-1')).toEqual(levels[0]);
  });

  it('updates an existing custom level by id', () => {
    LevelRepository.save(validRecord);
    const updated: CustomLevelRecord = {
      ...validRecord,
      title: 'Updated Title',
      updatedAt: 2000,
    };
    LevelRepository.save(updated);
    const list = LevelRepository.list();
    expect(list.length).toBe(levels.length + 1);
    expect(LevelRepository.get('custom-1')?.title).toBe('Updated Title');
  });

  it('removes only custom levels and ignores built-in removal', () => {
    LevelRepository.save(validRecord);
    LevelRepository.remove('custom-1');
    expect(LevelRepository.get('custom-1')).toBeUndefined();
    expect(LevelRepository.list().length).toBe(levels.length);

    // Attempting to remove built-in level should not remove it
    LevelRepository.remove('1-1');
    expect(LevelRepository.get('1-1')).toBeDefined();
  });

  it('safely ignores corrupted or malformed localStorage content', () => {
    if (typeof globalThis.localStorage !== 'undefined') {
      globalThis.localStorage.setItem('mirror.custom-levels.v1', '{ not valid json');
    }
    const list = LevelRepository.list();
    expect(list.length).toBe(levels.length);
  });

  it('rejects saving invalid records with empty title or invalid structure', () => {
    const invalidRecord = {
      ...validRecord,
      id: '',
    };
    expect(() => LevelRepository.save(invalidRecord as any)).toThrow();

    const emptyPiecesRecord = {
      ...validRecord,
      pieces: [],
    };
    expect(() => LevelRepository.save(emptyPiecesRecord)).toThrow();
  });
});
