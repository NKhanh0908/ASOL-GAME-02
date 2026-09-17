# 🧩 Grid & Match Micro-Engine (Pure Logic)
*Bộ máy tính toán logic bàn cờ, hoán đổi ô, tìm hàng Match-3 và rơi gạch Cascade — Tái sử dụng cho mọi game Puzzle/Match-3*

---

## 1. 📐 CẤU TRÚC DỮ LIỆU THUẦN (DATA STRUCTS)

```typescript
// Định nghĩa kiểu dữ liệu ô cờ thuần túy
export interface GridPosition {
  x: number; // Cột (0 to Width - 1)
  y: number; // Hàng (0 to Height - 1)
}

export interface TileData {
  id: string;
  type: number; // 0: Empty, 1: Red, 2: Blue, 3: Green, 4: Yellow...
  isObstacle: boolean;
}

export interface MatchResult {
  matchedTiles: GridPosition[];
  matchType: "HORIZONTAL_3" | "VERTICAL_3" | "T_SHAPE" | "L_SHAPE" | "MATCH_4" | "MATCH_5";
  scoreEarned: number;
}
```

---

## 2. ⚙️ THUẬT TOÁN ĐÁNH GIÁ TRẬN ĐẤU (MATCH EVALUATOR LOGIC)

```typescript
export class GridMatchEngine {
  private width: number;
  private height: number;
  private grid: TileData[][];

  constructor(width: number = 8, height: number = 8) {
    this.width = width;
    this.height = height;
    this.grid = this.initEmptyGrid();
  }

  // Khởi tạo bàn cờ rỗng
  private initEmptyGrid(): TileData[][] {
    const matrix: TileData[][] = [];
    for (let x = 0; x < this.width; x++) {
      matrix[x] = [];
      for (let y = 0; y < this.height; y++) {
        matrix[x][y] = { id: `${x}_${y}`, type: 0, isObstacle: false };
      }
    }
    return matrix;
  }

  // Kiểm tra 2 ô có nằm cạnh nhau hợp lệ để swap không
  public isAdjacent(posA: GridPosition, posB: GridPosition): boolean {
    const dx = Math.abs(posA.x - posB.x);
    const dy = Math.abs(posA.y - posB.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }

  // Quét toàn bộ bàn cờ tìm các hàng 3 ô giống nhau liên tiếp
  public findMatches(): MatchResult[] {
    const matches: MatchResult[] = [];

    // 1. Quét theo hàng ngang (Horizontal)
    for (let y = 0; y < this.height; y++) {
      let matchLength = 1;
      for (let x = 0; x < this.width; x++) {
        const currentType = this.grid[x][y].type;
        const nextType = x + 1 < this.width ? this.grid[x + 1][y].type : -1;

        if (currentType !== 0 && currentType === nextType) {
          matchLength++;
        } else {
          if (matchLength >= 3) {
            const matchedPositions: GridPosition[] = [];
            for (let i = x - matchLength + 1; i <= x; i++) {
              matchedPositions.push({ x: i, y });
            }
            matches.push({
              matchedTiles: matchedPositions,
              matchType: matchLength === 3 ? "HORIZONTAL_3" : "MATCH_4",
              scoreEarned: matchLength * 100
            });
          }
          matchLength = 1;
        }
      }
    }

    return matches;
  }
}
```
