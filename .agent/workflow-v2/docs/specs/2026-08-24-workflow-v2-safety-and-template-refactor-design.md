# Design Document: Workflow-v2 Safety, Template Alignment & Boilerplate Refactoring

- **Date**: 2026-08-24
- **Author**: Antigravity & ASOL Engineering
- **Status**: Draft / Pending Implementation
- **Target Subsystem**: `ASOL-game-OS/workflow-v2`

---

## 1. Context & Motivation

Through an audit of `ASOL-game-OS/workflow-v2` against the studio foundation documents in `overview-project-agent`, three key structural risks were identified:

1. **Context Isolation Safety Leak**: The "User Confirmation Gate" (mandatory confirmation before modifying or writing files) was only explicitly stated in `00-start-agent`, `00-help-agent`, and `01-idea-agent`. When other agents are loaded in isolated context (e.g. via direct slash commands), the runtime lacks the explicit prohibition against unconfirmed file writes.
2. **Missing & Divergent Artifact Templates**: 
   - `02-research-agent` requires `docs/concept/market-validation-gate.md`, but `phase-01-concept-discovery/templates/` lacked a `market-validation-gate-template.md`.
   - Redundancy existed in Phase 1 between `concept-validation-gate.md` and `g1-validation-signoff.md`.
   - File naming discrepancies existed in Phase 4 (`overview.md` vs `production-plan-overview-template.md`) and Phase 6 (`release-checklist.md` vs `release-validation-checklist-template.md`).
3. **High Boilerplate Duplication & Maintenance Overhead**: Duplication of verbose "5-Question Answer Sheets" and "KSTW Matrices" across 20+ agent files created high maintenance friction and version drift risk.

---

## 2. Architecture & Design Specification

### 2.1. Global Operational Rules (`_shared-rules.vi.md`)
A central governance file `workflow-v2/_shared-rules.vi.md` will serve as the Single Source of Truth (SSOT) for:
- **Standard `docs/` workspace folder structure** (7 subdirectories).
- **Ambiguity resolution protocol** (2–4 options with `[Recommended - Khuyến nghị]` prefix).
- **2-Tier Gate Semantic Mapping Table**:
  Instead of forcing a single rigid vocabulary across different domains, the system uses a 2-tier mapping:
  - **Tier 1 — Abstract Semantic State** (cho `/help` GPS agent, Dashboard, và công cụ quản lý): `GO-STATE`, `HOLD-STATE`, `KILL-STATE`.
  - **Tier 2 — Domain Concrete Labels**:
    - *Discovery/Concept Gates (Idea Gate, Market Gate)*: `GO / HOLD / KILL` (hoặc `PASS / HOLD / KILL`).
    - *Formal Milestone & Technical Gates (G1, G2, G3, G4, G5, G6)*: `PASS / CONDITIONAL PASS / FAIL`.
- **Multi-engine coding and micro-engine logic boundaries** (Pure logic isolation).

---

### 2.2. Standard Agent Prompt Skeleton & Local Safety Invariants
Every agent file (`01-idea-agent` through `04-liveops-retrospective-agent`) will adopt a lean 4-part skeleton with an explicit local safety block at the top AND a safety anchor right before file operations:

```markdown
---
name: "<Agent Name>"
description: "<Short description with trigger and outputs>"
color: "<color>"
emoji: "<emoji>"
vibe: "<Working Vibe>"
---

# 🚀 <Agent Name> (Lệnh `<command>` — ASOL Game OS v2)

Bạn là **<Agent Name>**, agent chuyên trách `<Nhiệm vụ cụ thể>` trong Phase `<N>` của ASOL Game OS Ver 2.0.

---

## 🛡️ BỘ QUY TẮC BẤT DI BẤT DỊCH (CORE INVARIANTS):
1. **User Confirmation Gate**: Tuyệt đối KHÔNG tự ý ghi file (`write_to_file`) khi chưa tóm tắt nội dung và nhận được sự đồng ý từ người dùng ("Tôi dự kiến ghi vào file `docs/...`. Bạn có đồng ý không?").
2. **Ambiguity & Recommendation**: Khi gặp điểm chưa rõ hoặc cần chọn phương án, luôn đưa ra 2–4 lựa chọn, gắn nhãn `[Recommended - Khuyến nghị]` cho phương án tối ưu kèm phương án mở.
3. **Docs SSOT**: Mọi artifact bắt buộc ghi vào đúng thư mục `docs/<phase-folder>/` theo mẫu template trong `templates/`.
4. **Quy chuẩn chung**: Tham chiếu và tuân thủ `_shared-rules.vi.md`.

---

## 📋 HỢP ĐỒNG INPUT / OUTPUT & TEMPLATES:
- **Lệnh kích hoạt**: `<command>`
- **Đầu vào (Input)**: `<các file trong docs/ cần đọc>`
- **Đầu ra (Output)**: `<các file trong docs/ sẽ tạo>`
- **Template đối ứng**: `<đường dẫn template chuẩn trong templates/>`

---

## 🔄 QUY TRÌNH THỰC THI CHI TIẾT (STEP-BY-STEP EXECUTION):
1. **Bước 1: Kiểm tra đầu vào** (Silent inspection)...
2. **Bước 2: Xử lý nghiệp vụ chuyên sâu (BẢO TOÀN 100% TRI THỨC DOMAIN)**:
   > ⚠️ **QUY TẮC BẢO TOÀN TRI THỨC**: Phần này BẮT BUỘC giữ nguyên 100% các bảng tiêu chí, công thức, rubric chấm điểm, ma trận quyết định, checklist nghiệp vụ đặc thù hiện có của từng Agent (ví dụ: RD1–RD6 của Research Agent, 4 Design States & Save JSON Schema của Master GDD Agent, 3 ADRs của ADR Agent, TDD 3 nhịp Red-Green-Refactor của Dev Story Agent, 5 bước Smoke test của RC Agent...). 
   > Chỉ lược bỏ phần vỏ bọc thừa (nhãn "KSTW Matrix", format bảng 4 cột Knowledge/Skill/Tool/Workflow, Answer Sheet 5 câu), TUYỆT ĐỐI KHÔNG lược bỏ nội dung nghiệp vụ bên trong!
3. **Bước 3: Trình bày bản tóm tắt & Hỏi xác nhận ghi file**:
   > ⚠️ **SAFETY ANCHOR**: Nhắc lại: Tuyệt đối KHÔNG gọi tool ghi file nếu chưa được User xác nhận đồng ý (đối chiếu Core Invariant 1).
4. **Bước 4: Hướng dẫn bước tiếp theo** (Chỉ dẫn lệnh kế tiếp theo `workflow-catalog.yaml`)...
```

---

### 2.3. Template Synchronization & 1-to-1 Mapping Matrix

1. **New Template Created**:
   - `phase-01-concept-discovery/templates/market-validation-gate-template.md` (Criteria for RD1–RD6, Competitor matrix summary, Decision `GO / HOLD / KILL`).
2. **Redundancy Removed**:
   - Eliminate `concept-validation-gate.md`; standardize solely on `docs/concept/g1-validation-signoff.md` for Gate G1 sign-off (`PASS / CONDITIONAL PASS / FAIL`).
3. **Harmonized Template Names**:
   - `phase-04-pre-production/templates/overview-template.md` (mapped 1-1 to `docs/plan/overview.md`).
   - `phase-06-release-liveops/templates/release-checklist-template.md` (mapped 1-1 to `docs/release/release-checklist.md`).

---

## 3. Scope & Phased Implementation Breakdown

- **Phase 0: Shared Foundation**
  - Create `workflow-v2/_shared-rules.vi.md` (bao gồm Bảng Ánh Xạ Gate 2 Tầng).
- **Phase 1: Concept Discovery Alignment**
  - Create `market-validation-gate-template.md`.
  - Refactor `01-idea-agent.vi.md`, `02-research-agent.vi.md`, `03-concept-brief-agent.vi.md`, and Phase 1 `README.md`.
- **Phase 2: Gameplay Systems Alignment**
  - Refactor `01-master-gdd-agent.vi.md`, `02-gdd-review-agent.vi.md`, and Phase 2 `README.md`.
- **Phase 3: Technical Setup Alignment**
  - Refactor `01-technical-setup-agent.vi.md`, `02-adr-agent.vi.md`, `03-control-manifest-agent.vi.md`, and Phase 3 `README.md`.
- **Phase 4: Pre-Production Alignment**
  - Align `overview-template.md`.
  - Refactor `01-prototype-agent.vi.md`, `02-epic-decomposition-agent.vi.md`, `03-story-planning-agent.vi.md`, `04-sprint-setup-agent.vi.md`, and Phase 4 `README.md`.
- **Phase 5: Sprint Execution Alignment**
  - Refactor `01-dev-story-agent.vi.md`, `02-perf-profile-agent.vi.md`, `03-balance-economy-agent.vi.md`, `04-rc-signoff-agent.vi.md`, and Phase 5 `README.md`.
- **Phase 6: Release & LiveOps Alignment**
  - Align `release-checklist-template.md`.
  - Refactor `01-release-checklist-agent.vi.md`, `02-publish-store-agent.vi.md`, `03-hotfix-patch-agent.vi.md`, `04-liveops-retrospective-agent.vi.md`, and Phase 6 `README.md`.
- **Phase 7: Catalog & Entrypoint Verification**
  - Update `00-start-agent.vi.md`, `00-help-agent.vi.md`, and `workflow-catalog.yaml` to ensure complete system coherence.
- **Verification Rule (Domain Knowledge Diff Check)**:
  - Sau khi refactor mỗi agent, kiểm tra đối chiếu (diff) nội dung nghiệp vụ trước/sau để đảm bảo 100% rules, rubrics, và checklists nghiệp vụ được giữ nguyên vẹn.

---

## 4. Spec Self-Review
- **Placeholder Scan**: No TODOs, TBDs, or masked placeholders. Explicit mandate to preserve 100% existing domain knowledge in Step 2.
- **Internal Consistency**: Gate vocabulary harmonized via 2-Tier Semantic Mapping Table (`GO-STATE / HOLD-STATE / KILL-STATE`).
- **Scope Check**: Well-defined, self-contained within `workflow-v2/`.
- **Ambiguity Check**: Unambiguous Safety Invariants (Header + Footer Anchor), exact 1-1 template paths.
