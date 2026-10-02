import type { LevelSource } from '../authoring.ts';
import { songTinh } from './1-1.ts';
import { baoThap } from './1-2.ts';
import { canhChim } from './1-3.ts';

/** Mọi màn có nguồn mô tả. Thêm màn mới: tạo file nguồn rồi đăng ký ở đây. */
export const LEVEL_SOURCES: Readonly<Record<string, LevelSource>> = {
  '1-1': songTinh,
  '1-2': baoThap,
  '1-3': canhChim,
};
