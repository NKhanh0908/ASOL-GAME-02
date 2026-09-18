export const GRID_WIDTH = 128;
export const GRID_HEIGHT = 192;

export type Cell = readonly [x: number, y: number];

export interface PieceDefinition {
  id: string;
  color: number;
  cells: Cell[];
  anchors: Cell[];
}

export interface Placement {
  pieceId: string;
  x: number;
  y: number;
}

export interface Level {
  id: string;
  title: string;
  pieces: PieceDefinition[];
  solution: Placement[];
  /** Present on persisted custom records; built-ins derive their target at runtime. */
  target?: Uint8Array;
}

export interface CustomLevelRecord extends Level {
  /** Whether this record adds a level or overrides an immutable built-in. */
  kind?: 'new' | 'override';
  /** The XOR silhouette saved by the editor. */
  target?: Uint8Array;
  sourceLevelId?: string;
  createdAt: number;
  updatedAt: number;
  /** Legacy UI marker; new records should use `kind`. */
  custom?: true;
}
