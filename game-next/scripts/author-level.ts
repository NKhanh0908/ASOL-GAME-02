/**
 * Sinh dữ liệu màn từ nguồn mô tả trong src/content/sources/.
 *
 *   npm run content:author -- 1-2
 *   npm run content:author -- --all
 *
 * Mỗi màn: dựng LevelDocument, chạy validator, ghi src/content/levels/<id>.json.
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildLevelDocument, serializeLevelDocument } from '../src/content/authoring.ts';
import type { LevelDocument } from '../src/content/document.ts';
import { LEVEL_SOURCES } from '../src/content/sources/index.ts';
import { validateLevel } from '../src/content/validate.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const LEVELS_DIR = resolve(HERE, '../src/content/levels');

function authorOne(id: string): boolean {
  const source = LEVEL_SOURCES[id];
  if (!source) {
    console.error(`[author-level] Không có nguồn cho màn ${id}`);
    return false;
  }

  let doc: LevelDocument;
  try {
    doc = buildLevelDocument(source);
  } catch (err) {
    console.error(`[author-level] FAIL ${(err as Error).message}`);
    return false;
  }

  const result = validateLevel(doc);
  if (!result.ok) {
    for (const issue of result.issues) {
      console.error(`[author-level] FAIL ${issue.levelId} ${issue.field}: ${issue.code}`);
    }
    return false;
  }

  writeFileSync(resolve(LEVELS_DIR, `${id}.json`), serializeLevelDocument(doc), 'utf8');
  console.log(`[author-level] PASS ${id}: ${doc.targetCells.length} ô mục tiêu`);
  return true;
}

const args = process.argv.slice(2);
const ids = args.includes('--all') ? Object.keys(LEVEL_SOURCES) : args;
if (ids.length === 0) {
  console.error('Dùng: npm run content:author -- <id...> | --all');
  process.exit(1);
}
const results = ids.map((id) => authorOne(id));
process.exit(results.every(Boolean) ? 0 : 1);
