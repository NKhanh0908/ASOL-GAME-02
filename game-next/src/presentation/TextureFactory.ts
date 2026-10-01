import type Phaser from 'phaser';
import { COLOR_TOKENS, GLASS_TOKENS, LAYOUT_TOKENS } from './designTokens.ts';

export const TEXTURE_KEYS = {
  steleBorder: 'stele_border_9slice',
  glassFrameBoard: 'glass_frame_board',
  glassFrameTray: 'glass_frame_tray',
  btnCircle112: 'btn_circle_112',
  btnCircle80: 'btn_circle_80',
  btnCircle64: 'btn_circle_64',
  btnCircle56: 'btn_circle_56',
  btnPrimaryAmber: 'btn_primary_amber',
  iconReset: 'icon_reset',
  iconRotate: 'icon_rotate',
  iconGear: 'icon_gear',
  iconMenuBack: 'icon_menu_back',
  iconEyeOpen: 'icon_eye_open',
  iconEyeClosed: 'icon_eye_closed',
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

    // 0. Khung kính dùng chung cho bàn chơi và khay mảnh
    TextureFactory.makeGlassFrame(
      scene,
      TEXTURE_KEYS.glassFrameBoard,
      LAYOUT_TOKENS.board.width,
      LAYOUT_TOKENS.board.height,
      LAYOUT_TOKENS.board.cornerRadius
    );
    TextureFactory.makeGlassFrame(
      scene,
      TEXTURE_KEYS.glassFrameTray,
      LAYOUT_TOKENS.tray.width,
      LAYOUT_TOKENS.tray.height,
      LAYOUT_TOKENS.tray.cornerRadius
    );

    // 0a. Nút tròn chính 112px (Chuẩn 56dp: Đặt lại, Xoay)
    if (!tm.exists(TEXTURE_KEYS.btnCircle112)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.btnCircle112, 112, 112);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = COLOR_TOKENS.board.surfaceTop;
        ctx.beginPath();
        ctx.arc(56, 56, 52, 0, Math.PI * 2);
        ctx.fill();

        // Viền kính xanh dày 4px
        ctx.lineWidth = 4;
        ctx.strokeStyle = COLOR_TOKENS.iceGlass.primaryBorder;
        ctx.stroke();

        // Highlight cạnh trên
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = COLOR_TOKENS.iceGlass.bevelHighlight;
        ctx.beginPath();
        ctx.arc(56, 56, 51, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();

        // Rãnh bóng tối cạnh dưới
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = COLOR_TOKENS.iceGlass.bevelShadow;
        ctx.beginPath();
        ctx.arc(56, 56, 51, Math.PI * 0.1, Math.PI * 0.9);
        ctx.stroke();

        // Chỉ vàng hổ phách mảnh bên trong
        ctx.lineWidth = 1;
        ctx.strokeStyle = COLOR_TOKENS.amberGold.gridCoordinate;
        ctx.beginPath();
        ctx.arc(56, 56, 44, 0, Math.PI * 2);
        ctx.stroke();

        canvas.refresh();
      }
    }

    // 0b. Nút tròn phụ 80px (Chuẩn 40dp: Menu, Mắt bóng mẫu)
    if (!tm.exists(TEXTURE_KEYS.btnCircle80)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.btnCircle80, 80, 80);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = COLOR_TOKENS.board.surfaceTop;
        ctx.beginPath();
        ctx.arc(40, 40, 36, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = 3;
        ctx.strokeStyle = COLOR_TOKENS.iceGlass.primaryBorder;
        ctx.stroke();

        ctx.lineWidth = 2;
        ctx.strokeStyle = COLOR_TOKENS.iceGlass.bevelHighlight;
        ctx.beginPath();
        ctx.arc(40, 40, 35, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();

        ctx.lineWidth = 2;
        ctx.strokeStyle = COLOR_TOKENS.iceGlass.bevelShadow;
        ctx.beginPath();
        ctx.arc(40, 40, 35, Math.PI * 0.1, Math.PI * 0.9);
        ctx.stroke();

        canvas.refresh();
      }
    }

    // 0c. Icon Mắt mở 36x36 (Bóng mẫu: Bật)
    if (!tm.exists(TEXTURE_KEYS.iconEyeOpen)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.iconEyeOpen, 36, 36);
      if (canvas) {
        const ctx = canvas.context;
        ctx.strokeStyle = COLOR_TOKENS.iceGlass.bevelHighlight;
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Viền mắt quả hạnh
        ctx.beginPath();
        ctx.moveTo(5, 18);
        ctx.quadraticCurveTo(18, 7, 31, 18);
        ctx.quadraticCurveTo(18, 29, 5, 18);
        ctx.stroke();

        // Đồng tử mắt vàng rực
        ctx.fillStyle = COLOR_TOKENS.amberGold.solidPrimary;
        ctx.beginPath();
        ctx.arc(18, 18, 4.5, 0, Math.PI * 2);
        ctx.fill();

        canvas.refresh();
      }
    }

    // 0d. Icon Mắt gạch chéo 36x36 (Bóng mẫu: Tắt)
    if (!tm.exists(TEXTURE_KEYS.iconEyeClosed)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.iconEyeClosed, 36, 36);
      if (canvas) {
        const ctx = canvas.context;
        ctx.strokeStyle = COLOR_TOKENS.text.secondary;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Viền mắt mờ
        ctx.beginPath();
        ctx.moveTo(5, 18);
        ctx.quadraticCurveTo(18, 7, 31, 18);
        ctx.quadraticCurveTo(18, 29, 5, 18);
        ctx.stroke();

        // Đồng tử mờ
        ctx.fillStyle = COLOR_TOKENS.text.secondary;
        ctx.beginPath();
        ctx.arc(18, 18, 4, 0, Math.PI * 2);
        ctx.fill();

        // Đường gạch chéo đỏ cam
        ctx.strokeStyle = COLOR_TOKENS.danger.warningText;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(7, 29);
        ctx.lineTo(29, 7);
        ctx.stroke();

        canvas.refresh();
      }
    }

    // 1. Nút tròn 64px (Dùng cho Đặt lại và Xoay)
    if (!tm.exists(TEXTURE_KEYS.btnCircle64)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.btnCircle64, 64, 64);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = COLOR_TOKENS.board.surfaceTop;
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
        ctx.fillStyle = COLOR_TOKENS.board.surfaceTop;
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

    // 1. Node Hoàn thành 72px (Vàng đặc + viền sáng + checkmark sắc nét)
    if (!tm.exists(TEXTURE_KEYS.nodeCompleted)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.nodeCompleted, 72, 72);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = COLOR_TOKENS.amberGold.solidPrimary;
        TextureFactory.diamondPath(ctx, 36, 36, 32);
        ctx.fill();

        // Viền sáng vàng lấp lánh
        ctx.strokeStyle = COLOR_TOKENS.amberGold.glowHighlight;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Dấu checkmark navy đậm
        ctx.strokeStyle = COLOR_TOKENS.sky.stops[0];
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(25, 36);
        ctx.lineTo(33, 44);
        ctx.lineTo(49, 28);
        ctx.stroke();
        canvas.refresh();
      }
    }

    // 2. Node Hiện tại 72px (Vành kính xanh + vòng vàng phát quang + tâm rực)
    if (!tm.exists(TEXTURE_KEYS.nodeCurrent)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.nodeCurrent, 72, 72);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = COLOR_TOKENS.board.surfaceTop;
        TextureFactory.diamondPath(ctx, 36, 36, 32);
        ctx.fill();

        // Vành kính xanh
        ctx.strokeStyle = COLOR_TOKENS.iceGlass.primaryBorder;
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // Highlight kính cạnh trên
        ctx.strokeStyle = COLOR_TOKENS.iceGlass.bevelHighlight;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(36, 36, 31, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();

        // Vành vàng phát quang bên trong
        ctx.strokeStyle = COLOR_TOKENS.amberGold.glowHighlight;
        ctx.lineWidth = 2.5;
        TextureFactory.diamondPath(ctx, 36, 36, 25);
        ctx.stroke();

        // Lõi vàng đặc radius 21px để hiển thị số màn rõ nét
        ctx.fillStyle = COLOR_TOKENS.amberGold.solidPrimary;
        TextureFactory.diamondPath(ctx, 36, 36, 21);
        ctx.fill();
        canvas.refresh();
      }
    }

    // 3. Node Đã mở chưa chơi 72px (Viền kính xanh trong suốt + bevel)
    if (!tm.exists(TEXTURE_KEYS.nodeUnlocked)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.nodeUnlocked, 72, 72);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = COLOR_TOKENS.board.surfaceTop;
        TextureFactory.diamondPath(ctx, 36, 36, 32);
        ctx.fill();

        ctx.strokeStyle = COLOR_TOKENS.iceGlass.primaryBorder;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.strokeStyle = COLOR_TOKENS.iceGlass.bevelHighlight;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(36, 36, 31, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();

        ctx.fillStyle = COLOR_TOKENS.iceGlass.primaryBorder;
        TextureFactory.diamondPath(ctx, 36, 36, 7);
        ctx.fill();
        canvas.refresh();
      }
    }

    // 4. Node Khóa 72px (Mờ tối + Icon ổ khóa chiêm tinh)
    if (!tm.exists(TEXTURE_KEYS.nodeLocked)) {
      const canvas = tm.createCanvas(TEXTURE_KEYS.nodeLocked, 72, 72);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = 'rgba(11, 20, 48, 0.7)';
        TextureFactory.diamondPath(ctx, 36, 36, 30);
        ctx.fill();

        ctx.strokeStyle = 'rgba(157, 175, 199, 0.35)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Quai khóa
        ctx.strokeStyle = COLOR_TOKENS.text.secondary;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(36, 32, 7.5, Math.PI, 0, false);
        ctx.stroke();

        // Thân khóa
        ctx.fillStyle = COLOR_TOKENS.text.secondary;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(26, 32, 20, 15, 3);
        } else {
          ctx.rect(26, 32, 20, 15);
        }
        ctx.fill();

        // Lỗ khóa
        ctx.fillStyle = COLOR_TOKENS.sky.stops[0];
        ctx.beginPath();
        ctx.arc(36, 38, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(35, 38, 2, 4);

        canvas.refresh();
      }
    }
  }

  /**
   * Khung kính bao quanh bàn chơi và khay mảnh: gradient băng từ trắng xanh
   * xuống xanh đậm, bo góc, viền tóc trắng mờ ở mép ngoài.
   *
   * Khoét lòng khung để chỉ còn lại dải viền, nên một texture dùng được cho
   * mọi kích thước khung mà không phải vẽ bevel thủ công từng cạnh.
   */
  /**
   * Đường viền hình thoi dùng cho node bản đồ.
   *
   * Mockup dùng thoi chứ không dùng tròn: node phải cùng ngôn ngữ hình học
   * với mảnh ghép trên bàn, nếu không bản đồ trông như game khác.
   */
  private static diamondPath(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
  }

  public static makeGlassFrame(
    scene: Phaser.Scene,
    key: string,
    width: number,
    height: number,
    radius: number
  ): string {
    const tm = scene.textures;
    if (!tm || tm.exists(key)) return key;

    const canvas = tm.createCanvas(key, width, height);
    if (!canvas) return key;
    const ctx = canvas.context;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    GLASS_TOKENS.frameStops.forEach((stop, index) => {
      gradient.addColorStop(GLASS_TOKENS.frameStopOffsets[index], stop);
    });

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, radius);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 255, 255, ${GLASS_TOKENS.hairline.alpha})`;
    ctx.lineWidth = GLASS_TOKENS.hairline.width;
    ctx.stroke();

    const pad = GLASS_TOKENS.padding;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.roundRect(pad, pad, width - pad * 2, height - pad * 2, Math.max(0, radius - pad));
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    canvas.refresh();
    return key;
  }
}
