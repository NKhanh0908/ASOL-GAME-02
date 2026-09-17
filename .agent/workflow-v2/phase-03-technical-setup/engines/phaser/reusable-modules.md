# 🌐 Phaser.js Reusable Modules & Templates
*Các mô-đun TypeScript mẫu tái sử dụng từ game trước sang game sau — ASOL Game OS v2*

---

## 1. 💾 MODULE: LOCALSTORAGE SAVE MANAGER (Pure TS)
*Dùng để lưu tiến độ màn chơi, tiền vàng, cấu hình âm thanh mà không phụ thuộc backend.*

```typescript
export interface PlayerSaveData {
  currentLevel: number;
  gold: number;
  hasRemovedAds: boolean;
  unlockedSkins: string[];
  settings: { bgm: number; sfx: number; haptics: boolean };
}

export class SaveManager {
  private static readonly SAVE_KEY = "ASOL_GAME_SAVE_V1";

  public static load(): PlayerSaveData {
    try {
      const raw = localStorage.getItem(this.SAVE_KEY);
      if (!raw) return this.getDefaultSave();
      return JSON.parse(atob(raw));
    } catch {
      return this.getDefaultSave();
    }
  }

  public static save(data: PlayerSaveData): void {
    const encoded = btoa(JSON.stringify(data));
    localStorage.setItem(this.SAVE_KEY, encoded);
  }

  private static getDefaultSave(): PlayerSaveData {
    return {
      currentLevel: 1,
      gold: 0,
      hasRemovedAds: false,
      unlockedSkins: ["default"],
      settings: { bgm: 0.8, sfx: 1.0, haptics: true }
    };
  }
}
```

---

## 2. 🎵 MODULE: WEB AUDIO POOL
*Quản lý âm thanh không bị giật lag trên trình duyệt di động.*

```typescript
export class SoundManager {
  private scene: Phaser.Scene;
  private isMuted: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public playSFX(key: string, volume = 1.0): void {
    if (this.isMuted) return;
    this.scene.sound.play(key, { volume });
  }

  public playBGM(key: string, volume = 0.6): void {
    if (this.isMuted) return;
    if (!this.scene.sound.get(key)) {
      this.scene.sound.play(key, { loop: true, volume });
    }
  }
}
```
