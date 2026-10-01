import Phaser from 'phaser';
import { campaignManifest } from '../content/manifest.ts';
import { levelAccess } from '../domain/campaign.ts';
import { createProgressRepository } from '../infrastructure/progressRepository.ts';
import type { ProgressRepository } from '../application/progressPort.ts';
import { ANIM_TOKENS, COLOR_NUMBERS, COLOR_TOKENS, TYPO_TOKENS } from './designTokens.ts';
import { TEXTURE_KEYS, TextureFactory } from './TextureFactory.ts';
import { SkyBackdrop } from './SkyBackdrop.ts';
import { formatProgress } from './hudText.ts';

type NodeInfo = {
  id: string;
  title: string;
  chapter: number;
  x: number;
  y: number;
  state: 'completed' | 'current' | 'unlocked' | 'locked';
  available: boolean;
};

export class LevelSelectScene extends Phaser.Scene {
  private progressRepo!: ProgressRepository;
  private mapContainer!: Phaser.GameObjects.Container;
  private headerContainer!: Phaser.GameObjects.Container;
  private toastContainer?: Phaser.GameObjects.Container;

  private sky!: SkyBackdrop;

  private isDragging = false;
  private dragStartY = 0;
  private containerStartY = 0;
  private minY = -2000;
  private maxY = 0;

  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create(): void {
    TextureFactory.generateAll(this);

    this.progressRepo = createProgressRepository(localStorage, campaignManifest, 'oracle-v1');
    const { progress } = this.progressRepo.read();

    // 1. Nền trời dùng chung; màn chọn màn cho sao trôi xuống
    this.sky = new SkyBackdrop(this, { seed: 3, drift: true });

    // 2. Container bản đồ chòm sao có thể cuộn dọc
    this.mapContainer = this.add.container(0, 0).setDepth(10);

    // 3. Dựng chòm sao & đường nối Bezier
    const currentNode = this.buildConstellation(progress.completed);

    // 4. Header cố định trên đỉnh có thanh tiến độ (Depth 80)
    this.headerContainer = this.add.container(0, 0).setDepth(80);
    this.buildHeader(progress.completed.length, campaignManifest.length);

    // 5. Cài đặt cuộn / kéo mượt mà
    this.setupScrolling();

    // 6. Tự động cuộn tới node hiện tại (Auto-scroll to current node)
    if (currentNode) {
      const idealY = Phaser.Math.Clamp(540 - currentNode.y, this.minY, this.maxY);
      this.tweens.add({
        targets: this.mapContainer,
        y: idealY,
        duration: 750,
        ease: 'Cubic.easeOut',
      });
    }
  }

  update(_time: number, delta: number): void {
    this.sky.update(delta);
  }

  private buildHeader(completedCount: number, totalCount: number): void {
    // Nền header mờ dần xuống dưới (Soft gradient fade thay cho kẻ ngang)
    const headerBg = this.add.graphics();
    headerBg.fillStyle(COLOR_NUMBERS.skyTop, 0.96);
    headerBg.fillRect(0, 0, 720, 96);

    // Gradient mờ dần từ y=96 đến y=136
    for (let h = 0; h < 40; h++) {
      const alpha = 0.96 * (1 - h / 40);
      headerBg.fillStyle(COLOR_NUMBERS.skyTop, alpha);
      headerBg.fillRect(0, 96 + h, 720, 1);
    }

    // Nút Menu tròn 80px (Vùng chạm 96px, chuẩn 1dp = 2px)
    const backBtn = this.add
      .image(56, 56, TEXTURE_KEYS.btnCircle80)
      .setSize(96, 96)
      .setInteractive({ useHandCursor: true });
    const backIcon = this.add.image(56, 56, TEXTURE_KEYS.iconMenuBack).setScale(1.25);
    backBtn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    // Tiêu đề trang 32px serif
    const headerTitle = this.add
      .text(360, 56, 'Chòm Sao Tiên Tri', {
        fontFamily: TYPO_TOKENS.fontFamily.serif,
        fontSize: '32px',
        color: COLOR_TOKENS.text.primary,
      })
      .setOrigin(0.5);

    // Huy hiệu tiến độ tổng ở góc phải (ví dụ: "✦ 1/18")
    const progressPill = this.add.container(640, 56);
    const pillBg = this.add.graphics();
    pillBg.fillStyle(COLOR_NUMBERS.boardSurfaceTop, 0.95);
    pillBg.fillRoundedRect(-52, -22, 104, 44, 22);
    pillBg.lineStyle(1.5, COLOR_NUMBERS.gridModule, 0.65);
    pillBg.strokeRoundedRect(-52, -22, 104, 44, 22);

    const progressText = this.add
      .text(0, 0, formatProgress(completedCount, totalCount), {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '20px',
        color: COLOR_TOKENS.amberGold.solidPrimary,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    progressPill.add([pillBg, progressText]);

    this.headerContainer.add([headerBg, backBtn, backIcon, headerTitle, progressPill]);
  }

  private buildConstellation(completedLevels: readonly string[]): NodeInfo | null {
    const nodes: NodeInfo[] = [];
    let currentNode: NodeInfo | null = null;

    // 1. Phân bổ tọa độ hình zigzag rộng (Biên độ x: 195px .. 525px, khoảng cách y: 160px)
    let currentY = 270;

    for (let i = 0; i < campaignManifest.length; i++) {
      const entry = campaignManifest[i];
      const access = levelAccess(campaignManifest, completedLevels, entry.id);

      let state: NodeInfo['state'] = 'locked';
      if (access.completed) {
        state = 'completed';
      } else if (access.unlocked && access.available) {
        state = 'current';
      } else if (access.unlocked && !access.available) {
        state = 'unlocked';
      }

      // Thêm khoảng đệm cho tiêu đề phân đoạn Chương 2 & 3
      if (i === 6 || i === 12) {
        currentY += 100;
      }

      // Zigzag tự nhiên chiếm ~46% bề ngang màn hình: x in [195, 525]
      const dir = i % 2 === 0 ? -1 : 1;
      const x = 360 + dir * (135 + ((i * 43) % 35));
      const y = currentY;

      const node: NodeInfo = {
        id: entry.id,
        title: entry.title,
        chapter: entry.chapter,
        x,
        y,
        state,
        available: access.available,
      };

      nodes.push(node);
      if (state === 'current' && !currentNode) {
        currentNode = node;
      }

      currentY += 160;
    }

    // 2. Sắc độ riêng cho từng chương, phủ rất nhẹ để nền trời vẫn lộ ra.
    // Trước đây phủ 98% nên che kín SkyBackdrop và bản đồ trông như cũ.
    const chBackdrop = this.add.graphics();
    chBackdrop.fillStyle(0x7fb8ff, 0.04); // Chương I: xanh trời
    chBackdrop.fillRect(0, 0, 720, 1160);
    chBackdrop.fillStyle(0xb48cff, 0.06); // Chương II: tím giao thoa
    chBackdrop.fillRect(0, 1160, 720, 1040);
    chBackdrop.fillStyle(0xffb86b, 0.06); // Chương III: hổ phách hoàng hôn
    chBackdrop.fillRect(0, 2200, 720, 1200);

    this.mapContainer.add(chBackdrop);

    // 3. Vẽ các đường cong Bezier mềm mại kết nối chòm sao (B3)
    const linesGraphics = this.add.graphics();
    this.mapContainer.add(linesGraphics);

    for (let i = 0; i < nodes.length - 1; i++) {
      const p1 = nodes[i];
      const p2 = nodes[i + 1];

      // Xác định trạng thái đoạn đường:
      // Đoạn đã đi: p1 đã hoàn thành và p2 đã hoàn thành (hoặc p2 là current)
      const isPathWalked = p1.state === 'completed' && (p2.state === 'completed' || p2.state === 'current');

      const curve = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(p1.x, p1.y),
        new Phaser.Math.Vector2((p1.x + p2.x) / 2 + (p1.x > p2.x ? 25 : -25), (p1.y + p2.y) / 2),
        new Phaser.Math.Vector2(p2.x, p2.y)
      );

      const points = curve.getPoints(24);

      if (isPathWalked) {
        // Đoạn đã đi: Vàng đặc 4px có glow 8px
        linesGraphics.lineStyle(8, COLOR_NUMBERS.amberSolid, 0.22);
        for (let j = 0; j < points.length - 1; j++) {
          linesGraphics.lineBetween(points[j].x, points[j].y, points[j + 1].x, points[j + 1].y);
        }

        linesGraphics.lineStyle(4, COLOR_NUMBERS.amberSolid, 0.95);
        for (let j = 0; j < points.length - 1; j++) {
          linesGraphics.lineBetween(points[j].x, points[j].y, points[j + 1].x, points[j + 1].y);
        }

        // Đốm sáng chạy dọc đường. Phaser không có stroke-dashoffset như
        // mockup, nên mô phỏng bằng một chấm tween theo các điểm của đường.
        const spark = this.add.circle(points[0].x, points[0].y, 4, COLOR_NUMBERS.amberGlow, 0.9);
        this.mapContainer.add(spark);
        this.tweens.addCounter({
          from: 0,
          to: points.length - 1,
          duration: ANIM_TOKENS.duration.linkSweepMs,
          repeat: -1,
          onUpdate: (tween) => {
            const point = points[Math.round(tween.getValue() ?? 0)];
            if (point) spark.setPosition(point.x, point.y);
          },
        });
      } else {
        // Đoạn chưa tới: Xanh kính 25% opacity nét đứt
        linesGraphics.lineStyle(2, COLOR_NUMBERS.icePrimary, 0.35);
        for (let j = 0; j < points.length - 1; j += 2) {
          linesGraphics.lineBetween(points[j].x, points[j].y, points[j + 1].x, points[j + 1].y);
        }
      }
    }

    // 4. Tiêu đề phân đoạn Chương (B2: Bỏ thuật ngữ kỹ thuật, banner kính thanh lịch)
    const chapterTitles = [
      'Chương I · Khởi Nguyên',
      'Chương II · Giao Thoa',
      'Chương III · Luân Chuyển',
    ];

    for (let c = 0; c < 3; c++) {
      const firstNode = nodes[c * 6];
      const bannerY = firstNode.y - 85;

      const chContainer = this.add.container(360, bannerY);
      // Mockup dùng chữ serif có hai gạch amber hai bên, không có nền
      const chText = this.add
        .text(0, 0, chapterTitles[c], {
          fontFamily: TYPO_TOKENS.fontFamily.serif,
          fontSize: TYPO_TOKENS.fontSize.sectionHeader,
          color: COLOR_TOKENS.text.primary,
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      const chBg = this.add.graphics();
      chBg.lineStyle(1.5, COLOR_NUMBERS.gridModule, 0.5);
      const rule = 80;
      const gap = chText.width / 2 + 24;
      chBg.lineBetween(-gap - rule, 0, -gap, 0);
      chBg.lineBetween(gap, 0, gap + rule, 0);

      chContainer.add([chBg, chText]);
      this.mapContainer.add(chContainer);
    }

    // 5. Render từng Node màn chơi (B1, B4, B5: 72px canvas, touch 96px, chỉ hiện số)
    for (const node of nodes) {
      const nodeContainer = this.add.container(node.x, node.y);

      let textureKey: string = TEXTURE_KEYS.nodeLocked;
      if (node.state === 'completed') textureKey = TEXTURE_KEYS.nodeCompleted;
      else if (node.state === 'current') textureKey = TEXTURE_KEYS.nodeCurrent;
      else if (node.state === 'unlocked') textureKey = TEXTURE_KEYS.nodeUnlocked;

      // Hình nút hiển thị 72px, vùng chạm mở rộng 96x96px
      const nodeSprite = this.add
        .image(0, 0, textureKey)
        .setSize(96, 96)
        .setInteractive({ useHandCursor: node.state !== 'locked' });

      nodeContainer.add(nodeSprite);

      // Hiển thị số màn chơi rõ ràng
      if (node.state === 'completed') {
        // Màn đã xong: Số màn nhỏ dưới node
        const numText = this.add
          .text(0, 46, node.id, {
            fontFamily: TYPO_TOKENS.fontFamily.sans,
            fontSize: '18px',
            color: COLOR_TOKENS.amberGold.solidPrimary,
            fontStyle: 'bold',
          })
          .setOrigin(0.5);
        nodeContainer.add(numText);
      } else if (node.state === 'current') {
        // Node hiện tại: Thêm tween nhấp nháy phát quang hào quang
        this.tweens.add({
          targets: nodeSprite,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 750,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        // Số màn nổi bật ở tâm
        const numText = this.add
          .text(0, 0, node.id, {
            fontFamily: TYPO_TOKENS.fontFamily.sans,
            fontSize: '20px',
            color: COLOR_TOKENS.sky.stops[0],
            fontStyle: 'bold',
          })
          .setOrigin(0.5);
        nodeContainer.add(numText);

        // Huy hiệu tên màn đang chơi nổi bật phía dưới node (y = 56)
        const titleBadge = this.add.container(0, 56);
        const badgeBg = this.add.graphics();
        badgeBg.fillStyle(COLOR_NUMBERS.navyBackdrop, 0.95);
        badgeBg.fillRoundedRect(-130, -18, 260, 36, 18);
        badgeBg.lineStyle(1.5, COLOR_NUMBERS.amberSolid, 0.9);
        badgeBg.strokeRoundedRect(-130, -18, 260, 36, 18);

        const badgeText = this.add
          .text(0, 0, `✦ ${node.id} · ${node.title} ✦`, {
            fontFamily: TYPO_TOKENS.fontFamily.sans,
            fontSize: '18px',
            color: COLOR_TOKENS.amberGold.solidPrimary,
            fontStyle: 'bold',
          })
          .setOrigin(0.5);

        titleBadge.add([badgeBg, badgeText]);
        nodeContainer.add(titleBadge);

        // Tween nhịp thở nhẹ nhàng cho nhãn màn hiện tại
        this.tweens.add({
          targets: titleBadge,
          y: 60,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      } else if (node.state === 'unlocked') {
        const numText = this.add
          .text(0, 0, node.id, {
            fontFamily: TYPO_TOKENS.fontFamily.sans,
            fontSize: '20px',
            color: COLOR_TOKENS.iceGlass.bevelHighlight,
            fontStyle: 'bold',
          })
          .setOrigin(0.5);
        nodeContainer.add(numText);
      } else {
        // Node khóa: Số màn mờ bên dưới
        const numText = this.add
          .text(0, 44, node.id, {
            fontFamily: TYPO_TOKENS.fontFamily.sans,
            fontSize: '16px',
            color: COLOR_TOKENS.text.secondary,
          })
          .setOrigin(0.5)
          .setAlpha(0.5);
        nodeContainer.add(numText);
      }

      // Xử lý sự kiện chạm
      nodeSprite.on('pointerdown', () => {
        if (node.state === 'locked') {
          this.showToast(`Màn ${node.id} chưa mở khóa`);
        } else if (!node.available) {
          this.showToast(`Màn ${node.id} đang được tinh chỉnh`);
        } else {
          this.scene.start('PlayScene', { levelId: node.id });
        }
      });

      this.mapContainer.add(nodeContainer);
    }

    // Giới hạn cuộn cho bản đồ
    const totalHeight = nodes[nodes.length - 1].y + 240;
    this.minY = Math.min(0, 1280 - totalHeight);

    return currentNode;
  }

  private setupScrolling(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > 100) {
        this.isDragging = true;
        this.dragStartY = pointer.y;
        this.containerStartY = this.mapContainer.y;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const dy = pointer.y - this.dragStartY;
        let targetY = this.containerStartY + dy;
        targetY = Phaser.Math.Clamp(targetY, this.minY, this.maxY);
        this.mapContainer.y = targetY;
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    this.input.on('pointerupoutside', () => {
      this.isDragging = false;
    });
  }

  private showToast(message: string): void {
    if (this.toastContainer) this.toastContainer.destroy();

    this.toastContainer = this.add.container(360, 1160).setDepth(100);

    const bg = this.add.graphics();
    bg.fillStyle(COLOR_NUMBERS.navyBackdrop, 0.95);
    bg.fillRoundedRect(-180, -26, 360, 52, 26);
    bg.lineStyle(1.5, COLOR_NUMBERS.amberSolid, 0.85);
    bg.strokeRoundedRect(-180, -26, 360, 52, 26);

    const toast = this.add
      .text(0, 0, message, {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '22px',
        color: COLOR_TOKENS.amberGold.solidPrimary,
      })
      .setOrigin(0.5);

    this.toastContainer.add([bg, toast]);

    this.tweens.add({
      targets: this.toastContainer,
      alpha: 0,
      delay: 1400,
      duration: 400,
      onComplete: () => {
        this.toastContainer?.destroy();
      },
    });
  }
}
