# Workflow-v2 Safety, Template Alignment & Boilerplate Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor all 18 AI Agent prompt files, templates, and catalog in `workflow-v2` to enforce local User Confirmation Gates, harmonize 1-to-1 artifact templates, implement the 2-tier gate vocabulary mapping, and extract studio governance into `_shared-rules.vi.md` while preserving 100% of domain rubrics and matrices.

**Architecture:** A centralized `_shared-rules.vi.md` serves as the global operational SSOT. Every agent adopts a lean 4-part skeleton with an explicit Core Invariants header and a decision-point Safety Anchor right before file writes. Missing templates (`market-validation-gate-template.md`) are created, redundant gates (`concept-validation-gate.md`) eliminated, and template filenames harmonized across all 6 lifecycle phases.

**Tech Stack:** Markdown (Prompt Engineering, Agent Specifications), YAML (`workflow-catalog.yaml`).

**Spec:** [`docs/specs/2026-08-24-workflow-v2-safety-and-template-refactor-design.md`](file:///D:/Working/ASOL/tool/ASOL-game-OS/workflow-v2/docs/specs/2026-08-24-workflow-v2-safety-and-template-refactor-design.md)

## Global Constraints

- **Single Source of Truth (SSOT)**: Mọi artifact đầu ra của 18 agent phải nằm trong đúng thư mục con của `docs/` (`docs/concept/`, `docs/gdd/`, `docs/architecture/`, `docs/prototype/`, `docs/plan/`, `docs/qa/`, `docs/release/`, `docs/liveops/`, `docs/retrospective/`).
- **Hard User Confirmation Gate**: 100% Agent files bắt buộc chứa luật cấm ghi file (`write_to_file`) khi chưa tóm tắt nội dung và chưa nhận được sự đồng ý của User.
- **Decision-Point Safety Anchor**: Mọi agent phải có dòng nhắc an toàn ngay trước bước ghi file: `⚠️ SAFETY ANCHOR: Nhắc lại: Tuyệt đối KHÔNG gọi tool ghi file nếu chưa được User xác nhận đồng ý (đối chiếu Core Invariant 1)`.
- **Ambiguity & Recommendation Rule**: 100% Agent files bắt buộc chứa quy tắc đưa ra 2–4 lựa chọn gắn nhãn `[Recommended - Khuyến nghị]` khi có điểm mơ hồ hoặc cần ra quyết định.
- **Domain Knowledge Preservation Mandate**: Giữ nguyên 100% các bảng tiêu chí, checklist, công thức, ma trận quyết định, rubric chấm điểm (RD1-RD6, 4 Design States, Save JSON Schema, 3 ADRs, TDD 3 nhịp, Smoke test 5 bước...). Chỉ loại bỏ vỏ bọc boilerplate thừa (nhãn KSTW, Answer Sheet 5 câu lặp).
- **2-Tier Gate Semantic Vocabulary**:
  - Abstract Tier: `GO-STATE`, `HOLD-STATE`, `KILL-STATE`.
  - Concrete Tier: Concept/Market = `GO / HOLD / KILL` (hoặc `PASS / HOLD / KILL`); Technical/Milestone Gates (G1–G6) = `PASS / CONDITIONAL PASS / FAIL`.

---

### Task 1: Create Global Operational SSOT (`_shared-rules.vi.md`)

**Files:**
- Create: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\_shared-rules.vi.md`

**Interfaces:**
- Produces: Global governance rules, 2-tier gate mapping table, `docs/` directory taxonomy, ambiguity prompt format, and micro-engine logic boundaries referenced by all 18 agents.

- [ ] **Step 1: Write `_shared-rules.vi.md`**
  Include the following sections:
  1. Studio Mission & Casual/Hybrid-Casual Design Philosophy.
  2. The 3 Core Invariants (Docs in `docs/`, User Confirmation Gate prompt format, Ambiguity `[Recommended]` rule).
  3. Standard `docs/` folder layout (7 subdirectories).
  4. 2-Tier Gate Semantic Mapping Table:
     | Abstract Semantic State | Discovery & Concept Gates (Idea/Market) | Formal Lifecycle Gates (G1–G6) |
     |---|---|---|
     | `GO-STATE` | `GO` (hoặc `PASS`) | `PASS` |
     | `HOLD-STATE` | `HOLD` | `CONDITIONAL PASS` |
     | `KILL-STATE` | `KILL` | `FAIL` |
  5. Safe File Operation Protocol (Preview -> Ask -> Await "ok/yes/đồng ý" -> Write).
  6. Pure Logic & Micro-Engine boundaries (Zero UI dependency).

- [ ] **Step 2: Verify `_shared-rules.vi.md` completeness**
  Check that all 6 sections exist, formatting is valid markdown, and no placeholders remain.

---

### Task 2: Phase 1 Concept Discovery Alignment & Template Creation

**Files:**
- Create: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-01-concept-discovery\templates\market-validation-gate-template.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-01-concept-discovery\01-idea-agent.vi.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-01-concept-discovery\02-research-agent.vi.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-01-concept-discovery\03-concept-brief-agent.vi.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-01-concept-discovery\README.md`

**Interfaces:**
- Consumes: `_shared-rules.vi.md`
- Produces: `docs/concept/idea-sheet.md`, `docs/concept/idea-gate.md`, `docs/concept/research-pack.md`, `docs/concept/market-validation-gate.md`, `docs/concept/brief.md`, `docs/concept/g1-validation-signoff.md`. (Eliminates redundant `concept-validation-gate.md`).

- [ ] **Step 1: Create `market-validation-gate-template.md`**
  Include market validation scoring against RD1–RD6, competitor summary, and decision status (`GO / HOLD / KILL`).
- [ ] **Step 2: Refactor `01-idea-agent.vi.md`**
  Apply the standard 4-part skeleton. Embed Core Invariants, Step 3 Safety Anchor, and preserve the 5 Idea Gate criteria and Light MDA structure.
- [ ] **Step 3: Refactor `02-research-agent.vi.md`**
  Apply the standard 4-part skeleton. Embed Core Invariants, Step 3 Safety Anchor, map `templates/market-validation-gate-template.md`, and preserve 100% of the 6 dimensions RD1–RD6 and Competitor Matrix rules.
- [ ] **Step 4: Refactor `03-concept-brief-agent.vi.md`**
  Apply the standard 4-part skeleton. Embed Core Invariants, Step 3 Safety Anchor, standardize output to `docs/concept/g1-validation-signoff.md` using `templates/g1-validation-signoff.md` (remove `concept-validation-gate.md`), preserve the 8 Brief fields, and preserve the 3-Engine comparison table (Phaser/Godot/Unity).
- [ ] **Step 5: Update `phase-01-concept-discovery/README.md`**
  Synchronize table and diagram with the standardized template list and sign-off artifacts.
- [ ] **Step 6: Diff Verification Gate**
  Diff each agent in Phase 1 against previous version to ensure 100% domain knowledge (RD1-RD6, 5 Idea criteria, 8 Brief fields, 3 Engine table) is preserved.

---

### Task 3: Phase 2 Gameplay & Systems Design Alignment

**Files:**
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-02-gameplay-systems\01-master-gdd-agent.vi.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-02-gameplay-systems\02-gdd-review-agent.vi.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-02-gameplay-systems\README.md`

**Interfaces:**
- Consumes: `_shared-rules.vi.md`, `docs/concept/brief.md`
- Produces: `docs/gdd/master-gdd.md`, `docs/gdd/g2-validation-signoff.md`

- [ ] **Step 1: Refactor `01-master-gdd-agent.vi.md`**
  Apply standard 4-part skeleton. Embed Core Invariants, Step 3 Safety Anchor, and preserve: 5 Unified Chapters, 4 Design States (`DEFINED / PROPOSED / ASSUMED / OPEN`), and concrete Save JSON Schema specifications.
- [ ] **Step 2: Refactor `02-gdd-review-agent.vi.md`**
  Apply standard 4-part skeleton. Embed Core Invariants, Step 3 Safety Anchor, and preserve: Cross-review rules (Gameplay vs UI vs Economy vs Save), Zero-OPEN mandate, and Gate G2 Sign-off checklist.
- [ ] **Step 3: Update `phase-02-gameplay-systems/README.md`**
  Synchronize table, hand-off contract, and diagram.
- [ ] **Step 4: Diff Verification Gate**
  Diff agents in Phase 2 to verify 100% preservation of 5-chapter requirements, 4 Design States, and G2 review criteria.

---

### Task 4: Phase 3 Technical Setup & Architecture Alignment

**Files:**
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-03-technical-setup\01-technical-setup-agent.vi.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-03-technical-setup\02-adr-agent.vi.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-03-technical-setup\03-control-manifest-agent.vi.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-03-technical-setup\README.md`

**Interfaces:**
- Consumes: `_shared-rules.vi.md`, `docs/gdd/master-gdd.md`
- Produces: `docs/architecture/architecture.md`, `docs/architecture/decisions/ADR-*.md`, `docs/architecture/control-manifest.md`, `docs/architecture/g3-validation-signoff.md`

- [ ] **Step 1: Refactor `01-technical-setup-agent.vi.md`**
  Apply standard 4-part skeleton. Embed Core Invariants, Step 3 Safety Anchor, and preserve: 4-Layer Architecture mapping, Platform Engine integration (Phaser/Godot/Unity), and Gameplay Micro-Engines mapping.
- [ ] **Step 2: Refactor `02-adr-agent.vi.md`**
  Apply standard 4-part skeleton. Embed Core Invariants, Step 3 Safety Anchor, and preserve: 3 Mandatory ADR specs (ADR-001 State Management/FSM, ADR-002 Encrypted Save, ADR-003 UI Decoupling).
- [ ] **Step 3: Refactor `03-control-manifest-agent.vi.md`**
  Apply standard 4-part skeleton. Embed Core Invariants, Step 3 Safety Anchor, and preserve: 1-Page Manifest rules (MUST DO, NEVER DO), and Gate G3 sign-off rubric.
- [ ] **Step 4: Update `phase-03-technical-setup/README.md`**
  Synchronize table, hand-off contract, and diagram.
- [ ] **Step 5: Diff Verification Gate**
  Diff Phase 3 agents to verify 100% preservation of 4-layer structure, 3 mandatory ADRs, and Control Manifest rules.

---

### Task 5: Phase 4 Pre-Production & Planning Alignment

**Files:**
- Rename/Standardize: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-04-pre-production\templates\production-plan-overview-template.md` -> `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-04-pre-production\templates\overview-template.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-04-pre-production\01-prototype-agent.vi.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-04-pre-production\02-epic-decomposition-agent.vi.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-04-pre-production\03-story-planning-agent.vi.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-04-pre-production\04-sprint-setup-agent.vi.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-04-pre-production\README.md`

**Interfaces:**
- Consumes: `_shared-rules.vi.md`, `docs/architecture/architecture.md`
- Produces: `docs/prototype/playtest-report.md`, `docs/plan/overview.md`, `docs/plan/epics/EPIC-*.md`, `docs/plan/stories/STORY-*.md`, `docs/plan/sprints/sprint-01.md`, `docs/plan/g4-validation-signoff.md`

- [ ] **Step 1: Standardize `overview-template.md`**
  Ensure template file name matches `docs/plan/overview.md` mapping (`overview-template.md`).
- [ ] **Step 2: Refactor `01-prototype-agent.vi.md`**
  Apply standard 4-part skeleton. Embed Core Invariants, Step 3 Safety Anchor, and preserve: Greybox scope limitation, Fun Gate playtest metrics, and 1-2 day timebox rules.
- [ ] **Step 3: Refactor `02-epic-decomposition-agent.vi.md`**
  Apply standard 4-part skeleton. Embed Core Invariants, Step 3 Safety Anchor, and preserve: 4-Tier Epic decomposition (Architecture -> Micro-Engines -> UI -> Integration).
- [ ] **Step 4: Refactor `03-story-planning-agent.vi.md`**
  Apply standard 4-part skeleton. Embed Core Invariants, Step 3 Safety Anchor, and preserve: 15-45 minute story sizing rule, Definition of Ready (DoR), and Acceptance Criteria structure.
- [ ] **Step 5: Refactor `04-sprint-setup-agent.vi.md`**
  Apply standard 4-part skeleton. Embed Core Invariants, Step 3 Safety Anchor, and preserve: Test Runner setup instructions (Jest/GUT/UTF), Sprint 1 backlog assembly, and Gate G4 sign-off.
- [ ] **Step 6: Update `phase-04-pre-production/README.md`**
  Synchronize table and template names.
- [ ] **Step 7: Diff Verification Gate**
  Diff Phase 4 agents to verify 100% preservation of Fun Gate criteria, 4-tier Epic rules, Story sizing bounds, and Test setup rubrics.

---

### Task 6: Phase 5 Sprint Execution & Hardening Alignment

**Files:**
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-05-sprint-execution\01-dev-story-agent.vi.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-05-sprint-execution\02-perf-profile-agent.vi.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-05-sprint-execution\03-balance-economy-agent.vi.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-05-sprint-execution\04-rc-signoff-agent.vi.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-05-sprint-execution\README.md`

**Interfaces:**
- Consumes: `_shared-rules.vi.md`, `docs/plan/stories/STORY-*.md`, `docs/plan/sprints/sprint-01.md`
- Produces: `docs/plan/sprints/sprint-status.md`, `docs/qa/perf-profile-report.md`, `docs/qa/balance-report.md`, `docs/qa/g5-rc-validation-signoff.md`

- [ ] **Step 1: Refactor `01-dev-story-agent.vi.md`**
  Apply standard 4-part skeleton. Embed Core Invariants, Step 3 Safety Anchor, and preserve: TDD 3-beat cycle (Red -> Green -> Refactor), Deviation Alert triggers, Task Execution Log, and Live Dashboard sync.
- [ ] **Step 2: Refactor `02-perf-profile-agent.vi.md`**
  Apply standard 4-part skeleton. Embed Core Invariants, Step 3 Safety Anchor, and preserve: Mobile 60 FPS benchmarks, RAM < 250MB, Draw Calls < 50, and GC spike elimination rubrics.
- [ ] **Step 3: Refactor `03-balance-economy-agent.vi.md`**
  Apply standard 4-part skeleton. Embed Core Invariants, Step 3 Safety Anchor, and preserve: Economy simulation rules (Gold/Gem sink & faucet), Level 1-50+ difficulty curve verification, and Ad pacing formulas.
- [ ] **Step 4: Refactor `04-rc-signoff-agent.vi.md`**
  Apply standard 4-part skeleton. Embed Core Invariants, Step 3 Safety Anchor, and preserve: 5-step Smoke test checklist, Save data backward compatibility check, and IAP/Ads sandbox signoff.
- [ ] **Step 5: Update `phase-05-sprint-execution/README.md`**
  Synchronize table and hybrid workflow diagram.
- [ ] **Step 6: Diff Verification Gate**
  Diff Phase 5 agents to verify 100% preservation of TDD cycle, 60 FPS thresholds, Economy formulas, and RC signoff checklist.

---

### Task 7: Phase 6 Release & LiveOps Alignment

**Files:**
- Rename/Standardize: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-06-release-liveops\templates\release-validation-checklist-template.md` -> `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-06-release-liveops\templates\release-checklist-template.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-06-release-liveops\01-release-checklist-agent.vi.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-06-release-liveops\02-publish-store-agent.vi.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-06-release-liveops\03-hotfix-patch-agent.vi.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-06-release-liveops\04-liveops-retrospective-agent.vi.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\phase-06-release-liveops\README.md`

**Interfaces:**
- Consumes: `_shared-rules.vi.md`, `docs/qa/g5-rc-validation-signoff.md`
- Produces: `docs/release/release-checklist.md`, `docs/release/store-metadata.md`, `docs/release/patch-notes-*.md`, `docs/release/g6-release-signoff.md`, `docs/liveops/EXP-*.md`, `docs/retrospective/retrospective-report.md`

- [ ] **Step 1: Standardize `release-checklist-template.md`**
  Rename/create template matching 1-1 with `docs/release/release-checklist.md`.
- [ ] **Step 2: Refactor `01-release-checklist-agent.vi.md`**
  Apply standard 4-part skeleton. Embed Core Invariants, Step 3 Safety Anchor, and preserve: 7 Store Release criteria, ASO Keyword formulas, and Metadata pack requirements.
- [ ] **Step 3: Refactor `02-publish-store-agent.vi.md`**
  Apply standard 4-part skeleton. Embed Core Invariants, Step 3 Safety Anchor, and preserve: Release Key signing checklist, v1.0.0 Patch Notes format, and Gate G6 sign-off rubric.
- [ ] **Step 4: Refactor `03-hotfix-patch-agent.vi.md`**
  Apply standard 4-part skeleton. Embed Core Invariants, Step 3 Safety Anchor, and preserve: Day-1 emergency triage protocol and Zero Save Loss preservation rule.
- [ ] **Step 5: Refactor `04-liveops-retrospective-agent.vi.md`**
  Apply standard 4-part skeleton. Embed Core Invariants, Step 3 Safety Anchor, and preserve: O-A-H-D-I-T-R-O A/B testing cycle and Studio Knowledge Harvesting procedure.
- [ ] **Step 6: Update `phase-06-release-liveops/README.md`**
  Synchronize table and completion pack list.
- [ ] **Step 7: Diff Verification Gate**
  Diff Phase 6 agents to verify 100% preservation of 7 Release standards, ASO formulas, Hotfix triage protocol, and LiveOps loop.

---

### Task 8: Entrypoint & Catalog Synchronization

**Files:**
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\00-start-agent.vi.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\00-help-agent.vi.md`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\workflow-catalog.yaml`
- Modify: `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2\README.md`

**Interfaces:**
- Consumes: All updated Phase agents, templates, and `_shared-rules.vi.md`.
- Produces: Fully synchronized satellite map, GPS navigation engine, and root README.

- [ ] **Step 1: Update `00-start-agent.vi.md`**
  Ensure Core Invariants and references to `_shared-rules.vi.md` are aligned with the new standard skeleton.
- [ ] **Step 2: Update `00-help-agent.vi.md`**
  Ensure GPS scanning logic recognizes the 2-tier gate mapping (`GO-STATE / HOLD-STATE / KILL-STATE`) and 1-to-1 template paths.
- [ ] **Step 3: Update `workflow-catalog.yaml`**
  Synchronize all 18 commands, exact artifact paths, gate sign-off files, and eliminate legacy `concept-validation-gate.md`.
- [ ] **Step 4: Update root `workflow-v2/README.md`**
  Synchronize the 6-phase master table, governance rules summary, and directory structure.

---

### Task 9: System-Wide Coherence & Verification Audit

**Files:**
- Audit: All files in `D:\Working\ASOL\tool\ASOL-game-OS\workflow-v2`

- [ ] **Step 1: Automated Link & Reference Integrity Audit**
  Verify that all relative links and file references in `workflow-catalog.yaml`, READMEs, and agent files point to existing files.
- [ ] **Step 2: 1-to-1 Template Completeness Check**
  Verify that every output artifact in `workflow-catalog.yaml` has a corresponding template in `templates/`.
- [ ] **Step 3: Safety Invariant & Safety Anchor Grep Check**
  Run grep across all 18 agent files to confirm:
  - 100% contain `User Confirmation Gate` in Header.
  - 100% contain `⚠️ SAFETY ANCHOR` at Step 3.
  - 100% contain `Ambiguity & Recommendation`.
  - 100% reference `_shared-rules.vi.md`.
- [ ] **Step 4: Final Domain Knowledge Preservation Sign-off**
  Verify that no business rubrics, checklists, formulas, or decision matrices were lost during the entire refactor.
