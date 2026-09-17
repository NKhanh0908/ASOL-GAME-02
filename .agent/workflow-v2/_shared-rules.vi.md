# 📜 ASOL Game OS Ver 2.0 — Shared Operational Rules & Governance
*Hiến Pháp Vận Hành Chung, Quy Chuẩn An Toàn & Ma Trận Trạng Thái Toàn Cục*
*Alpaca Solutions (ASOL) — Áp dụng cho mọi AI Agents và Lập trình viên trong Studio*

---

## 🎯 1. TRIẾT LÝ SẢN PHẨM & STUDIO MISSION

1. **Định vị sản phẩm**: Tập trung vào dòng game **Casual / Hybrid-Casual** (Puzzle, Merge, Match-3, Idle, Arcade).
2. **Nguyên tắc "Thời gian 3 giây"**: Core Verb (hành động cốt lõi) phải trực quan, dễ hiểu trong 3 giây đầu tiên tiếp cận.
3. **Principle 09 — Earn Complexity**: Thiết kế tinh gọn tối đa. Không thêm layer, module, hay boilerplate trừ khi nó đã được chứng minh hiệu quả và tái sử dụng thực tế.

---

## 🛡️ 2. BỘ 3 NGUYÊN TẮC VÀNG BẤT BIẾN (CORE GOVERNANCE RULES)

Mọi AI Agent khi thực thi bất kỳ lệnh nào trong hệ thống **BẮT BUỘC** phải tuân thủ 3 nguyên tắc sau:

### 1. 📂 Tài Liệu Luôn Nằm Tập Trung Trong `docs/` Của Dự Án & Cơ Chế Khởi Tạo Theo Nhu Cầu (On-Demand Docs Initialization)
- **Tập trung 100% tài liệu:** Mọi tài liệu sinh ra từ `workflow-v2` (từ Idea Sheet, Nghiên cứu thị trường, Concept Brief, Master GDD, Kiến trúc & ADR, Kế hoạch Epic/Story, Bảng theo dõi Sprint Task `sprint-status.md`, Báo cáo QA/Perf, Biên bản Release, đến LiveOps & Retrospective) **BẮT BUỘC** sinh ra và lưu trữ tập trung bên trong thư mục `docs/` tại thư mục gốc của dự án người dùng. Tuyệt đối không sinh file tài liệu vương vãi ra thư mục gốc.
- **Cấu trúc cây thư mục chuẩn:**
```
docs/
├── concept/         # Phase 1: idea-sheet.md, research-pack.md, brief.md, g1-validation-signoff.md...
├── gdd/             # Phase 2: master-gdd.md (5 chương hợp nhất), g2-validation-signoff.md...
├── architecture/    # Phase 3: architecture.md, decisions/ADR-*.md, control-manifest.md, g3-validation-signoff.md...
├── prototype/       # Phase 4: playtest-report.md (Fun Gate)...
├── plan/            # Phase 4 & 5: overview.md, epics/EPIC-*.md, stories/STORY-*.md, sprints/sprint-*.md, g4-signoff...
├── qa/              # Phase 5: perf-profile-report.md, balance-report.md, g5-rc-validation-signoff.md...
├── release/         # Phase 6: release-checklist.md, store-metadata.md, patch-notes-*.md, g6-release-signoff...
├── liveops/         # Phase 6: EXP-*.md (A/B Test experiments)...
└── retrospective/   # Phase 6: retrospective-report.md (Đóng gói tri thức Studio)...
```
- **Cơ chế Khởi tạo Thư mục Theo Nhu Cầu (On-Demand / Lazy Creation Gate):**
  - Áp dụng cho cả 2 trường hợp: **Luồng tự động (`/start`)** và **Chạy thủ công từng Skill (`/idea`, `/master-gdd`, `/technical-setup`, `/create-epics`, `/dev-story`...)**.
  - Khi bắt đầu thực hiện một phase/skill, Agent sẽ kiểm tra thư mục `docs/` và thư mục con tương ứng (ví dụ `docs/gdd/`, `docs/plan/stories/`...).
  - Nếu thư mục con chưa tồn tại, Agent sẽ hỏi xác nhận người dùng để tạo thư mục `docs/[subfolder]/` kết hợp với việc phê duyệt ghi file artifact.

### 2. ✍️ Cổng Xác Nhận Trước Khi Tạo Thư Mục & Ghi File (User Confirmation Gate)
- Tuyệt đối **KHÔNG ĐƯỢC TỰ Ý TẠO THƯ MỤC HOẶC GHI FILE** (không gọi tool `write_to_file` hoặc sửa mã nguồn) khi chưa trình bày bản tóm tắt nội dung và nhận được sự phê duyệt của người dùng.
- Mẫu câu hỏi xác nhận chuẩn:
  > *"Tôi dự kiến tạo thư mục `docs/[subfolder]/` (nếu chưa có) và lưu nội dung vào file `docs/[đường-dẫn-file]`. Bạn có đồng ý phê duyệt để tôi thực hiện không?"*
- **CHỈ KHI** người dùng phản hồi đồng ý ("đồng ý", "ok", "yes", "tạo đi", "ghi file đi"...) thì mới được phép thực thi việc tạo thư mục và ghi file.

### 3. 💡 Quy Tắc Xử Lý Điểm Mơ Hồ & Đưa Ra Khuyến Nghị (Ambiguity & Recommendation Rule)
- Khi gặp yêu cầu chưa rõ ràng hoặc khi cần ra quyết định kỹ thuật / gameplay:
  - Bắt buộc đưa ra **2–4 lựa chọn cụ thể** (A, B, C...).
  - Luôn đánh dấu phương án tối ưu nhất với tiền tố: **`[Recommended - Khuyến nghị]`** kèm giải thích ngắn gọn vì sao nên chọn.
  - Luôn có phương án mở (D / Tùy chỉnh) để người dùng có thể tự nhập ý kiến riêng.

---

## 🚦 3. BẢNG ÁNH XẠ TRẠNG THÁI GATE 2 TẦNG (2-TIER GATE SEMANTIC MAPPING)

Hệ thống phân tách rõ giữa **Trạng thái ngữ nghĩa trừu tượng** (dành cho bộ máy điều hướng `/help` và Dashboard) và **Nhãn hiển thị cụ thể theo từng domain**:

| Abstract Semantic State | Ý nghĩa điều hướng | Discovery & Concept Gates (Idea Gate, Market Gate) | Formal Milestone & Technical Gates (G1, G2, G3, G4, G5, G6) |
|---|---|---|---|
| **`GO-STATE`** | Đạt chuẩn, sẵn sàng đi tiếp sang bước kế tiếp. | **`GO`** (hoặc **`PASS`**) | **`PASS`** |
| **`HOLD-STATE`** | Cần chỉnh sửa, bổ sung dữ liệu hoặc điều kiện ràng buộc trước khi qua Gate. | **`HOLD`** | **`CONDITIONAL PASS`** |
| **`KILL-STATE`** | Không đạt tiêu chuẩn cốt lõi, dừng dự án hoặc yêu cầu Rework lại từ đầu. | **`KILL`** | **`FAIL`** |

### Quy tắc Rework Loop:
- Khi một Gate nhận trạng thái `HOLD` hoặc `FAIL / KILL`, Agent kích hoạt quy trình Rework có định hướng:
  - Chỉ rõ lý do chưa đạt (Root Cause).
  - Đưa ra 2–3 phương án khắc phục có gắn nhãn `[Recommended - Khuyến nghị]`.
  - Hướng dẫn quay lại đúng Agent trước đó cần điều chỉnh (ví dụ: G5 Fail ➔ quay về G3 chỉnh GDD hoặc G4 chỉnh Prototype).

---

## 🧩 4. QUY CHUẨN MÃ NGUỒN & GAMEPLAY MICRO-ENGINES (REUSABILITY STANDARD)

1. **Tách biệt Logic và Engine (Zero UI Dependency)**:
   - Các Gameplay Micro-Engines (`grid-match`, `score-combo`, `level-progression`, `merge-drop`) chỉ chứa logic thuần túy (Pure Functions / State Machines / Data Structures), không import bất kỳ thư viện UI nào của engine (Phaser Scene, Godot Node, Unity MonoBehaviour).
2. **Đa nền tảng (Multi-Platform)**:
   - TypeScript cho **Phaser.js**.
   - GDScript 2.0 / C# cho **Godot 4**.
   - C# cho **Unity 6**.
3. **Kiểm thử tự động (TDD by Default)**:
   - Mọi logic tính điểm, kiểm tra thắng thua, khớp ô, sinh ngẫu nhiên có kiểm soát (Seeded RNG) đều phải có Unit Test độc lập trước khi ráp nối vào giao diện game.
