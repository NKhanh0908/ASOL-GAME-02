import songTinh from './levels/1-1.json';
import baoThap from './levels/1-2.json';
import canhChim from './levels/1-3.json';
import haiDang from './levels/1-4.json';
import thuyenSao from './levels/1-5.json';
import vuongMien from './levels/1-6.json';
import muiTen from './levels/2-1.json';
import canhBuom from './levels/2-2.json';
import traiTim from './levels/2-3.json';
import matTienTri from './levels/2-4.json';
import dongHoCat from './levels/2-5.json';
import daiAn from './levels/2-6.json';
import nhatNguyet from './levels/3-1.json';
import mandala from './levels/3-10.json';
import denTienTri from './levels/3-2.json';
import caChep from './levels/3-3.json';
import ngonNen from './levels/3-4.json';
import thuyenBuom from './levels/3-5.json';
import meoThan from './levels/3-6.json';
import hoaSen from './levels/3-7.json';
import kimTuThap from './levels/3-8.json';
import saoBatPhuong from './levels/3-9.json';
import { campaignManifest } from './manifest.ts';
import { validateLevel } from './validate.ts';
import { DEV_LEVEL_DOCUMENTS } from './devLevels.ts';
import type { Level } from '../domain/model.ts';

const documents: Record<string, unknown> = {
  '1-1': songTinh,
  '1-2': baoThap,
  '1-3': canhChim,
  '1-4': haiDang,
  '1-5': thuyenSao,
  '1-6': vuongMien,
  '2-1': muiTen,
  '2-2': canhBuom,
  '2-3': traiTim,
  '2-4': matTienTri,
  '2-5': dongHoCat,
  '2-6': daiAn,
  '3-1': nhatNguyet,
  '3-10': mandala,
  '3-2': denTienTri,
  '3-3': caChep,
  '3-4': ngonNen,
  '3-5': thuyenBuom,
  '3-6': meoThan,
  '3-7': hoaSen,
  '3-8': kimTuThap,
  '3-9': saoBatPhuong,
};

const globStudioDocs: Record<string, unknown> = import.meta.env.DEV
  ? (import.meta.glob('./studio/levels/*.json', { eager: true, import: 'default' }) as Record<string, unknown>)
  : {};

function findStudioDoc(id: string, studioLevelsOverride?: Record<string, unknown>): unknown | undefined {
  if (studioLevelsOverride && id in studioLevelsOverride) {
    return studioLevelsOverride[id];
  }
  if (!import.meta.env.DEV) {
    return undefined;
  }
  for (const [path, doc] of Object.entries(globStudioDocs)) {
    if (doc && typeof doc === 'object' && 'id' in doc && (doc as { id: unknown }).id === id) {
      return doc;
    }
    const match = path.match(/([^/\\]+)\.json$/);
    if (match && match[1] === id) {
      return doc;
    }
  }
  return undefined;
}

/**
 * Tải và xác thực dữ liệu màn chơi theo chế độ truy cập (campaign hoặc harness).
 * - campaign: chỉ cho phép màn đã đạt status 'approved'.
 * - harness: cho phép màn có status 'validated' hoặc 'approved', màn dev, và màn studio khi DEV.
 */
export function loadLevel(
  id: string,
  mode: 'campaign' | 'harness',
  studioLevelsOverride?: Record<string, unknown>
): Level {
  // Campaign mode: chỉ nạp màn approved từ campaign manifest
  if (mode === 'campaign') {
    const entry = campaignManifest.find((e) => e.id === id);
    if (!entry || entry.status !== 'approved') {
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

  // Harness mode: tìm theo thứ tự manifest -> devLevels -> studioLevels (ST-07)
  const entry = campaignManifest.find((e) => e.id === id);
  if (entry) {
    if (!['validated', 'approved'].includes(entry.status)) {
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

  if (import.meta.env.DEV && id in DEV_LEVEL_DOCUMENTS) {
    const result = validateLevel(DEV_LEVEL_DOCUMENTS[id]);
    if (!result.ok) {
      throw new Error(`validation-failed:${id} -> ${JSON.stringify(result.issues)}`);
    }
    return result.level;
  }

  if (import.meta.env.DEV || studioLevelsOverride) {
    const studioDoc = findStudioDoc(id, studioLevelsOverride);
    if (studioDoc) {
      const result = validateLevel(studioDoc);
      if (!result.ok) {
        throw new Error(`validation-failed:${id} -> ${JSON.stringify(result.issues)}`);
      }
      return result.level;
    }
  }

  throw new Error(`unavailable:${id}`);
}
