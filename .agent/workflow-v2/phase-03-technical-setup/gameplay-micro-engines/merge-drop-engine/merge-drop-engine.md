# 🍒 Merge & Drop Micro-Engine
*Bộ máy tính toán logic kéo thả gộp 2 vật phẩm cùng cấp (2048 / Suika Game / Merge Bakery) — Tái sử dụng cho mọi game Merge Casual*

---

## 1. 📐 CẤU TRÚC DỮ LIỆU MERGE (DATA STRUCTS)

```typescript
export interface MergeItemData {
  instanceId: string;
  tier: number;       // Cấp độ item: Tier 1 (Bột mì) -> Tier 2 (Bánh mì) -> Tier 10 (Bánh kem hoàng gia)
  value: number;      // Giá trị tiền sinh ra khi merge
  canMerge: boolean;  // Có thể merge tiếp không (Max tier = false)
}

export interface MergeResult {
  isSuccess: boolean;
  newTier: number;
  scoreAwarded: number;
  spawnPosition: { x: number; y: number };
}
```

---

## 2. ⚙️ THUẬT TOÁN HỢP NHẤT VẬT PHẨM (MERGE RESOLVER LOGIC)

```typescript
export class MergeDropEngine {
  private maxTier: number;

  constructor(maxTier: number = 10) {
    this.maxTier = maxTier;
  }

  // Kiểm tra 2 item có thể gộp thành 1 item cấp cao hơn không
  public evaluateMerge(itemA: MergeItemData, itemB: MergeItemData, dropPosition: { x: number; y: number }): MergeResult {
    // 1. Kiểm tra cùng cấp độ và chưa đạt max tier
    if (itemA.tier === itemB.tier && itemA.tier < this.maxTier) {
      const nextTier = itemA.tier + 1;
      const score = Math.pow(2, nextTier) * 10; // Điểm tăng theo cấp số nhân 2^N

      return {
        isSuccess: true,
        newTier: nextTier,
        scoreAwarded: score,
        spawnPosition: dropPosition
      };
    }

    return {
      isSuccess: false,
      newTier: itemA.tier,
      scoreAwarded: 0,
      spawnPosition: dropPosition
    };
  }
}
```
