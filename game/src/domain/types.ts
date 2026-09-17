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
}
