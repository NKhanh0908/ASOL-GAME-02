import type { LevelSource } from '../authoring.ts';
import { songTinh } from './1-1.ts';
import { baoThap } from './1-2.ts';
import { canhChim } from './1-3.ts';
import { haiDang } from './1-4.ts';
import { thuyenSao } from './1-5.ts';
import { vuongMien } from './1-6.ts';
import { muiTen } from './2-1.ts';
import { canhBuom } from './2-2.ts';
import { traiTim } from './2-3.ts';
import { matTienTri } from './2-4.ts';
import { dongHoCat } from './2-5.ts';
import { daiAn } from './2-6.ts';
import { nhatNguyet } from './3-1.ts';

/** Mọi màn có nguồn mô tả. Thêm màn mới: tạo file nguồn rồi đăng ký ở đây. */
export const LEVEL_SOURCES: Readonly<Record<string, LevelSource>> = {
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
};
