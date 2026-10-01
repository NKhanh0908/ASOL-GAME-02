import type Phaser from 'phaser';
import { COLOR_TOKENS } from './designTokens.ts';

export const TEXTURE_KEYS = {
  steleBorder: 'stele_border_9slice',
  btnCircle64: 'btn_circle_64',
  btnCircle56: 'btn_circle_56',
  btnPrimaryAmber: 'btn_primary_amber',
  iconReset: 'icon_reset',
  iconRotate: 'icon_rotate',
  iconGear: 'icon_gear',
  iconMenuBack: 'icon_menu_back',
  iconClose: 'icon_close',
  nodeCompleted: 'node_completed',
  nodeCurrent: 'node_current',
  nodeUnlocked: 'node_unlocked',
  nodeLocked: 'node_locked',
  toggleTrackOn: 'toggle_track_on',
  toggleTrackOff: 'toggle_track_off',
  toggleThumb: 'toggle_thumb',
} as const;

export class TextureFactory {
  /**
   * Tạo toàn bộ Canvas Textures một lần lúc khởi động Scene,
   * tránh việc vẽ lại Graphics đắt đỏ trong mỗi frame.
   */
  public static generateAll(scene: Phaser.Scene): void {
    const tm = scene.textures;
    if (!tm) return;

    // 1. Nút tròn 64px (Dùng cho Đặt lại và Xoay)
    if (!tm.exists(TEXTURE_KEYS.btnCircle64)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.btnCircle64, 64, 64);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = COLOR_TOKENS.navy.steleSurface;
        ctx.beginPath();
        ctx.arc(32, 32, 30, 0, Math.PI * 2);
        ctx.fill();

        // Viền kính xanh bevel
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = COLOR_TOKENS.iceGlass.primaryBorder;
        ctx.stroke();

        // Highlight cạnh trên
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = COLOR_TOKENS.iceGlass.bevelHighlight;
        ctx.beginPath();
        ctx.arc(32, 32, 29, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();

        canvas.refresh();
      }
    }

    // 2. Nút tròn 56px (Dùng cho Menu header và Cài đặt)
    if (!tm.exists(TEXTURE_KEYS.btnCircle56)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.btnCircle56, 56, 56);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = COLOR_TOKENS.navy.steleSurface;
        ctx.beginPath();
        ctx.arc(28, 28, 26, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = 2;
        ctx.strokeStyle = COLOR_TOKENS.iceGlass.primaryBorder;
        ctx.stroke();

        canvas.refresh();
      }
    }

    // 3. Icon Đặt lại (Reset) 32x32
    if (!tm.exists(TEXTURE_KEYS.iconReset)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.iconReset, 32, 32);
      if (canvas) {
        const ctx = canvas.context;
        ctx.strokeStyle = COLOR_TOKENS.text.primary;
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';

        // Cung tròn xoay ngược chiều kim đồng hồ
        ctx.beginPath();
        ctx.arc(16, 16, 9, Math.PI * 0.25, Math.PI * 1.85, false);
        ctx.stroke();

        // Mũi tên ở đầu cung
        ctx.fillStyle = COLOR_TOKENS.text.primary;
        ctx.beginPath();
        ctx.moveTo(16, 5);
        ctx.lineTo(22, 7);
        ctx.lineTo(18, 12);
        ctx.closePath();
        ctx.fill();

        canvas.refresh();
      }
    }

    // 4. Icon Xoay (Rotate) 32x32
    if (!tm.exists(TEXTURE_KEYS.iconRotate)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.iconRotate, 32, 32);
      if (canvas) {
        const ctx = canvas.context;
        ctx.strokeStyle = COLOR_TOKENS.amberGold.solidPrimary;
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.arc(16, 16, 9, Math.PI * 0.75, Math.PI * 2.15, false);
        ctx.stroke();

        ctx.fillStyle = COLOR_TOKENS.amberGold.solidPrimary;
        ctx.beginPath();
        ctx.moveTo(16, 5);
        ctx.lineTo(10, 7);
        ctx.lineTo(14, 12);
        ctx.closePath();
        ctx.fill();

        canvas.refresh();
      }
    }

    // 5. Icon Bánh răng cổ ngữ (Gear) 28x28
    if (!tm.exists(TEXTURE_KEYS.iconGear)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.iconGear, 28, 28);
      if (canvas) {
        const ctx = canvas.context;
        ctx.strokeStyle = COLOR_TOKENS.iceGlass.bevelHighlight;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(14, 14, 8, 0, Math.PI * 2);
        ctx.stroke();

        // 6 nan hoa
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(14 + Math.cos(angle) * 8, 14 + Math.sin(angle) * 8);
          ctx.lineTo(14 + Math.cos(angle) * 12, 14 + Math.sin(angle) * 12);
          ctx.stroke();
        }

        canvas.refresh();
      }
    }

    // 6. Icon Mũi tên quay lại (Back arrow) 28x28
    if (!tm.exists(TEXTURE_KEYS.iconMenuBack)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.iconMenuBack, 28, 28);
      if (canvas) {
        const ctx = canvas.context;
        ctx.strokeStyle = COLOR_TOKENS.text.primary;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(18, 7);
        ctx.lineTo(11, 14);
        ctx.lineTo(18, 21);
        ctx.stroke();
        canvas.refresh();
      }
    }

    // 7. Icon Đóng (Close) 24x24
    if (!tm.exists(TEXTURE_KEYS.iconClose)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.iconClose, 24, 24);
      if (canvas) {
        const ctx = canvas.context;
        ctx.strokeStyle = COLOR_TOKENS.text.secondary;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(6, 6);
        ctx.lineTo(18, 18);
        ctx.moveTo(18, 6);
        ctx.lineTo(6, 18);
        ctx.stroke();
        canvas.refresh();
      }
    }

    // 8. Node chòm sao
    this.generateNodeTextures(scene);
  }

  private static generateNodeTextures(scene: Phaser.Scene): void {
    const tm = scene.textures;
    if (!tm) return;

    // Node Hoàn thành (Vàng đặc + checkmark)
    if (!tm.exists(TEXTURE_KEYS.nodeCompleted)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.nodeCompleted, 48, 48);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = COLOR_TOKENS.amberGold.solidPrimary;
        ctx.beginPath();
        ctx.arc(24, 24, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = COLOR_TOKENS.navy.spaceBackground;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(16, 24);
        ctx.lineTo(22, 30);
        ctx.lineTo(32, 18);
        ctx.stroke();
        canvas.refresh();
      }
    }

    // Node Hiện tại (Vòng vàng phát sáng)
    if (!tm.exists(TEXTURE_KEYS.nodeCurrent)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.nodeCurrent, 48, 48);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = COLOR_TOKENS.navy.steleSurface;
        ctx.beginPath();
        ctx.arc(24, 24, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = COLOR_TOKENS.amberGold.glowHighlight;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = COLOR_TOKENS.amberGold.solidPrimary;
        ctx.beginPath();
        ctx.arc(24, 24, 7, 0, Math.PI * 2);
        ctx.fill();
        canvas.refresh();
      }
    }

    // Node Đã mở nhưng chưa chơi (Viền kính xanh trong suốt)
    if (!tm.exists(TEXTURE_KEYS.nodeUnlocked)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.nodeUnlocked, 48, 48);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = COLOR_TOKENS.navy.steleSurface;
        ctx.beginPath();
        ctx.arc(24, 24, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = COLOR_TOKENS.iceGlass.primaryBorder;
        ctx.lineWidth = 2;
        ctx.stroke();
        canvas.refresh();
      }
    }

    // Node Khóa (Mờ tối + chấm khóa)
    if (!tm.exists(TEXTURE_KEYS.nodeLocked)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.nodeLocked, 48, 48);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = 'rgba(16, 27, 50, 0.4)';
        ctx.beginPath();
        ctx.arc(24, 24, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(157, 175, 199, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = COLOR_TOKENS.text.secondary;
        ctx.beginPath();
        ctx.arc(24, 24, 3, 0, Math.PI * 2);
        ctx.fill();
        canvas.refresh();
      }
    }
  }
}
