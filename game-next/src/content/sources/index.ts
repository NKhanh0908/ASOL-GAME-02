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
import { denTienTri } from './3-2.ts';
import { caChep } from './3-3.ts';
import { ngonNen } from './3-4.ts';
import { thuyenBuom } from './3-5.ts';
import { meoThan } from './3-6.ts';
import { hoaSen } from './3-7.ts';
import { kimTuThap } from './3-8.ts';
import { saoBatPhuong } from './3-9.ts';

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
  '3-2': denTienTri,
  '3-3': caChep,
  '3-4': ngonNen,
  '3-5': thuyenBuom,
  '3-6': meoThan,
  '3-7': hoaSen,
  '3-8': kimTuThap,
  '3-9': saoBatPhuong,
};
