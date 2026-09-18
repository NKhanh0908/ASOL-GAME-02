import { beforeEach, describe, expect, it } from 'vitest';
import { LevelRepository } from './levelRepository';
import { levels } from './levels';
import type { CustomLevelRecord } from './types';
import { square } from './shapes';

const storageKey = 'mirror.custom-levels.v1';

describe('LevelRepository', () => {
  beforeEach(() => LevelRepository.clearForTests());

  function record(overrides: Partial<CustomLevelRecord> = {}): CustomLevelRecord {
    return {
      id: 'custom-1', title: 'My Custom Level', kind: 'new', target: new Uint8Array(128 * 192),
      createdAt: 1000, updatedAt: 1000,
      pieces: [{ id: 'p1', color: 0xffd166, cells: square(4), anchors: [] }],
      solution: [{ pieceId: 'p1', x: 10, y: 10 }],
      ...overrides,
    };
  }

  it('lists built-ins when storage is empty', () => {
    expect(LevelRepository.list().map((level) => level.id)).toEqual(levels.map((level) => level.id));
  });

  it('creates and removes a new level', () => {
    LevelRepository.create(record());
    expect(LevelRepository.get('custom-1')?.title).toBe('My Custom Level');
    LevelRepository.removeNew('custom-1');
    expect(LevelRepository.get('custom-1')).toBeUndefined();
  });

  it('gives an override priority over its built-in and restores it', () => {
    const override = record({ id: '1-1', kind: 'override', sourceLevelId: '1-1', title: 'Edited 1-1' });
    LevelRepository.saveOverride('1-1', override);
    expect(LevelRepository.get('1-1')).toEqual(override);
    expect(LevelRepository.list()[0]).toEqual(override);
    LevelRepository.restoreBuiltIn('1-1');
    expect(LevelRepository.get('1-1')).toEqual(levels[0]);
  });

  it('round trips a versioned target through storage', () => {
    const target = new Uint8Array([0, 1, 255]);
    LevelRepository.create(record({ target }));
    expect(LevelRepository.get('custom-1')?.target).toEqual(target);
    const raw = globalThis.localStorage?.getItem(storageKey);
    if (raw) expect(JSON.parse(raw).version).toBe(1);
  });

  it('ignores malformed or unversioned storage safely', () => {
    globalThis.localStorage?.setItem(storageKey, '{ not valid json');
    expect(LevelRepository.list()).toHaveLength(levels.length);
    globalThis.localStorage?.setItem(storageKey, JSON.stringify({ version: 999, records: [] }));
    expect(LevelRepository.list()).toHaveLength(levels.length);
  });

  it('rejects invalid records and cannot remove built-ins as new levels', () => {
    expect(() => LevelRepository.create(record({ id: '1-1' }))).toThrow();
    expect(() => LevelRepository.create(record({ title: '' }))).toThrow();
    LevelRepository.removeNew('1-1');
    expect(LevelRepository.get('1-1')).toBeDefined();
  });
});
