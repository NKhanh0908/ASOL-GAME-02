import type { ManifestEntry } from './document.ts';

export const campaignManifest: readonly ManifestEntry[] = [
  { id: '1-1', title: 'Song Tinh', chapter: 1, order: 1, contentRevision: 'song-tinh-v2', status: 'approved', dataPath: 'src/content/levels/1-1.json' },
  { id: '1-2', title: 'Bảo Tháp Tiên Tri', chapter: 1, order: 2, contentRevision: 'bao-thap-v1', status: 'approved', dataPath: 'src/content/levels/1-2.json' },
  { id: '1-3', title: 'Cánh Chim Báo Điềm', chapter: 1, order: 3, contentRevision: 'canh-chim-v1', status: 'approved', dataPath: 'src/content/levels/1-3.json' },
  { id: '1-4', title: 'Ngọn Hải Đăng', chapter: 1, order: 4, contentRevision: 'hai-dang-v1', status: 'approved', dataPath: 'src/content/levels/1-4.json' },
  { id: '1-5', title: 'Chiếc Thuyền Sao', chapter: 1, order: 5, contentRevision: 'thuyen-sao-v1', status: 'approved', dataPath: 'src/content/levels/1-5.json' },
  { id: '1-6', title: 'Vương Miện Bình Minh', chapter: 1, order: 6, contentRevision: 'vuong-mien-v1', status: 'approved', dataPath: 'src/content/levels/1-6.json' },

  // Chương 2 — Giao Thoa (vùng giao triệt tiêu và hạt nhân hiện lại)
  { id: '2-1', title: 'Mũi Tên Chỉ Thiên', chapter: 2, order: 7, contentRevision: 'mui-ten-v1', status: 'validated', dataPath: 'src/content/levels/2-1.json' },
  { id: '2-2', title: 'Cánh Bướm Điệp Ảnh', chapter: 2, order: 8, contentRevision: 'canh-buom-v1', status: 'validated', dataPath: 'src/content/levels/2-2.json' },
  { id: '2-3', title: 'Trái Tim Tinh Thể', chapter: 2, order: 9, contentRevision: 'trai-tim-v1', status: 'validated', dataPath: 'src/content/levels/2-3.json' },
  { id: '2-4', title: 'Mắt Tiên Tri', chapter: 2, order: 10, contentRevision: 'mat-tien-tri-v1', status: 'validated', dataPath: 'src/content/levels/2-4.json' },
  { id: '2-5', title: 'Đồng Hồ Cát', chapter: 2, order: 11, contentRevision: 'dong-ho-cat-v1', status: 'validated', dataPath: 'src/content/levels/2-5.json' },
  { id: '2-6', title: 'Đại Ấn Hộ Mệnh', chapter: 2, order: 12, contentRevision: 'dai-an-v1', status: 'validated', dataPath: 'src/content/levels/2-6.json' },

  // Chương 3 — Họa Phẩm (tranh ghép nghệ thuật, không xoay)
  { id: '3-1', title: 'Nhật Nguyệt Song Huyền', chapter: 3, order: 13, contentRevision: 'nhat-nguyet-v1', status: 'validated', dataPath: 'src/content/levels/3-1.json' },
  { id: '3-2', title: 'Đền Tiên Tri', chapter: 3, order: 14, contentRevision: 'den-tien-tri-v1', status: 'validated', dataPath: 'src/content/levels/3-2.json' },
  { id: '3-3', title: 'Cá Chép Sao', chapter: 3, order: 15, contentRevision: 'ca-chep-v1', status: 'validated', dataPath: 'src/content/levels/3-3.json' },
  { id: '3-4', title: 'Ngọn Nến', chapter: 3, order: 16, contentRevision: 'v0.1', status: 'planned' },
  { id: '3-5', title: 'Thuyền Buồm Hoàng Hôn', chapter: 3, order: 17, contentRevision: 'v0.1', status: 'planned' },
  { id: '3-6', title: 'Mèo Thần', chapter: 3, order: 18, contentRevision: 'v0.1', status: 'planned' },
  { id: '3-7', title: 'Hoa Sen', chapter: 3, order: 19, contentRevision: 'v0.1', status: 'planned' },
  { id: '3-8', title: 'Kim Tự Tháp Nhật Thực', chapter: 3, order: 20, contentRevision: 'v0.1', status: 'planned' },
  { id: '3-9', title: 'Sao Bát Phương', chapter: 3, order: 21, contentRevision: 'v0.1', status: 'planned' },
  { id: '3-10', title: 'Mandala Thiên Cầu', chapter: 3, order: 22, contentRevision: 'v0.1', status: 'planned' },

  // Chương 4 — Luân Chuyển (xoay chuyển định hướng; đổi mã từ 3-1 → 3-6 cũ, giữ tên)
  { id: '4-1', title: 'La Bàn Gió', chapter: 4, order: 23, contentRevision: 'v0.1', status: 'planned' },
  { id: '4-2', title: 'Lưỡi Kiếm Thiên Thể', chapter: 4, order: 24, contentRevision: 'v0.1', status: 'planned' },
  { id: '4-3', title: 'Cánh Cung Chiêm Tinh', chapter: 4, order: 25, contentRevision: 'v0.1', status: 'planned' },
  { id: '4-4', title: 'Bánh Xe Số Phận', chapter: 4, order: 26, contentRevision: 'v0.1', status: 'planned' },
  { id: '4-5', title: 'Thánh Giá Thiên Cầu', chapter: 4, order: 27, contentRevision: 'v0.1', status: 'planned' },
  { id: '4-6', title: 'Đại Ấn Tiên Tri', chapter: 4, order: 28, contentRevision: 'v0.1', status: 'planned' },
];
