import songTinh from './levels/1-1.json';
import baoThap from './levels/1-2.json';
import canhChim from './levels/1-3.json';
import haiDang from './levels/1-4.json';
import thuyenSao from './levels/1-5.json';
import { campaignManifest } from './manifest.ts';
import { validateLevel } from './validate.ts';
import type { Level } from '../domain/model.ts';

const documents: Record<string, unknown> = {
  '1-1': songTinh,
  '1-2': baoThap,
  '1-3': canhChim,
  '1-4': haiDang,
  '1-5': thuyenSao,
};

/**
 * Tải và xác thực dữ liệu màn chơi theo chế độ truy cập (campaign hoặc harness).
 * - campaign: chỉ cho phép màn đã đạt status 'approved'.
 * - harness: cho phép màn có status 'validated' hoặc 'approved'.
 */
export function loadLevel(id: string, mode: 'campaign' | 'harness'): Level {
  const entry = campaignManifest.find((e) => e.id === id);
  if (
    !entry ||
    (mode === 'campaign'
      ? entry.status !== 'approved'
      : !['validated', 'approved'].includes(entry.status))
  ) {
    throw new Error(`unavailable:${id}`);
  }

  const doc = documents[id];
  if (!doc) {
    throw new Error(`missing-document:${id}`);
  }

  const result = validateLevel(doc);
  if (!result.ok) {
    throw new Error(`validation-failed:${id} -> ${JSON.stringify(result.issues)}`);
  }

  return result.level;
}
