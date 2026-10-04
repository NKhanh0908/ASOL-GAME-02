/**
 * Chuyển một màn studio vào campaign:
 *
 *   npm run content:promote -- <studio-id> <target-id>
 *
 * Yêu cầu:
 * - <studio-id> có dữ liệu trong src/content/studio/levels/<studio-id>.json
 * - <target-id> có trong manifest.ts và đang ở trạng thái 'planned'
 * - Màn nghiệm thu có đúng 1 nghiệm và 0 nghiệm ít mảnh hơn
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promoteStudioLevel } from '../src/content/promote.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');

function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (args.length < 2) {
    console.error('Cách dùng: npm run content:promote -- <studio-id> <target-id>');
    process.exit(1);
  }

  const [studioId, targetId] = args;
  console.log(`[promote] Bắt đầu chuyển màn studio "${studioId}" vào campaign mã "${targetId}"...`);

  const result = promoteStudioLevel({
    studioId,
    targetId,
    root: ROOT,
  });

  if (!result.ok) {
    console.error(`[promote] THẤT BẠI: ${result.error}`);
    if (result.issues && result.issues.length > 0) {
      for (const issue of result.issues) {
        console.error(`  - ${issue.field}: ${issue.code}`);
      }
    }
    process.exit(1);
  }

  console.log(`[promote] THÀNH CÔNG! Đã chuyển ${studioId} -> ${targetId}`);
  console.log(`  File đã tạo/cập nhật (${result.writtenFiles.length}):`);
  for (const f of result.writtenFiles) {
    console.log(`    + ${f}`);
  }
  if (result.deletedFiles.length > 0) {
    console.log(`  File studio đã xoá (${result.deletedFiles.length}):`);
    for (const f of result.deletedFiles) {
      console.log(`    - ${f}`);
    }
  }
}

main();
