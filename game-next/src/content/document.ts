import type { Cell, Chapter, Level, Orientation, ShapeKind, Turns } from '../domain/model.ts';

export type ManifestEntry = {
  id: string;
  title: string;
  chapter: Chapter;
  order: number;
  contentRevision: string;
  status: 'planned' | 'authored' | 'validated' | 'approved';
  dataPath?: string;
};

export type LevelDocument = {
  schemaVersion: 1;
  id: string;
  title: string;
  chapter: Chapter;
  order: number;
  contentRevision: string;
  board: { width: 128; height: 160 };
  rotationEnabled: boolean;
  pieces: Array<{
    id: string;
    shapeKind: ShapeKind;
    /** Bắt buộc với tam giác (0–7) và bình hành (0–3); vuông, thoi, tròn bỏ trống hoặc 0 */
    orientation?: Orientation;
    frameSize: number;
    cells: Cell[];
    anchors: Array<{ id: string; x: number; y: number }>;
    color: 'amber';
  }>;
  targetCells: Cell[];
  sampleSolutions: Array<Array<{ pieceId: string; anchorId: string; turns: Turns }>>;
  learningObjective: string;
  /** Câu thơ hiện ở màn hoàn thành; màn nào không có thì ẩn dòng này */
  victoryVerse?: string;
  difficultyEstimate: 1 | 2 | 3 | 4 | 5;
  distractors: Array<{ pieceId: string; anchorId?: string; reason: string }>;
  ftueSteps: Array<{
    id: string;
    trigger: 'idle' | 'first-snap' | 'two-layers' | 'three-layers';
    end: 'drag-start' | 'snap' | 'two-layers' | 'three-layers';
    text: string;
  }>;
};

export type ValidationIssue = {
  levelId: string;
  field: string;
  code: string;
};

export type ValidationResult =
  | { ok: true; level: Level }
  | { ok: false; issues: ValidationIssue[] };
