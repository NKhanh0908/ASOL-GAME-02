import Phaser from 'phaser';
import { campaignManifest } from '../content/manifest.ts';
import { levelAccess } from '../domain/campaign.ts';
import { createProgressRepository } from '../infrastructure/progressRepository.ts';
import type { ProgressRepository } from '../application/progressPort.ts';
import { COLOR_NUMBERS, COLOR_TOKENS, TYPO_TOKENS } from './designTokens.ts';
import { TEXTURE_KEYS, TextureFactory } from './TextureFactory.ts';

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
  private toastText?: Phaser.GameObjects.Text;

  private isDragging = false;
  private dragStartY = 0;
  private containerStartY = 0;
  private minY = -320;
  private maxY = 0;

  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create(): void {
    TextureFactory.generateAll(this);

    this.progressRepo = createProgressRepository(localStorage, campaignManifest, 'oracle-v1');
    const { progress } = this.progressRepo.read();

    // 1. Nền vũ trụ
    const bg = this.add.graphics();
    bg.fillStyle(COLOR_NUMBERS.navySpace, 1.0);
    bg.fillRect(0, 0, 720, 1280);

    // 2. Container bản đồ chòm sao có thể cuộn dọc
    this.mapContainer = this.add.container(0, 0);

    // 3. Header cố định trên đỉnh
    this.headerContainer = this.add.container(0, 0).setDepth(50);
    this.buildHeader();

    // 4. Dựng chòm sao
    this.buildConstellation(progress.completed);

    // 5. Cài đặt cuộn / kéo bản đồ
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
  }

  private buildHeader(): void {
    const headerBg = this.add.graphics();
    headerBg.fillStyle(COLOR_NUMBERS.navySpace, 0.95);
    headerBg.fillRect(0, 0, 720, 96);
    headerBg.lineStyle(1.5, COLOR_NUMBERS.icePrimary, 0.4);
    headerBg.lineBetween(0, 96, 720, 96);

    // Nút quay lại Menu
    const backBtn = this.add
      .image(56, 48, TEXTURE_KEYS.btnCircle56)
      .setInteractive({ useHandCursor: true });
    const backIcon = this.add.image(56, 48, TEXTURE_KEYS.iconMenuBack);
    backBtn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    // Tiêu đề trang
    const headerTitle = this.add
      .text(360, 48, 'Chòm Sao Tiên Tri', {
        fontFamily: TYPO_TOKENS.fontFamily.serif,
        fontSize: '24px',
        color: COLOR_TOKENS.amberGold.solidPrimary,
      })
      .setOrigin(0.5);

    this.headerContainer.add([headerBg, backBtn, backIcon, headerTitle]);
  }

  private buildConstellation(completedLevels: readonly string[]): void {
    const nodes: NodeInfo[] = [];

    // Tính tọa độ cho 18 màn
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

      // Tọa độ uốn lượn hình sin
      const x = 360 + Math.sin(i * 0.85) * 140;
      const y = 160 + i * 72;

      nodes.push({
        id: entry.id,
        title: entry.title,
        chapter: entry.chapter,
        x,
        y,
        state,
        available: access.available,
      });
    }

    // 1. Vẽ các đường nối chòm sao (Constellation Lines)
    const lineGraphics = this.add.graphics();
    lineGraphics.lineStyle(2, COLOR_NUMBERS.amberGrid, 0.4);
    for (let i = 0; i < nodes.length - 1; i++) {
      lineGraphics.lineBetween(nodes[i].x, nodes[i].y, nodes[i + 1].x, nodes[i + 1].y);
    }
    this.mapContainer.add(lineGraphics);

    // 2. Vẽ tiêu đề phân đoạn Chương
    const chapterNames = [
      'Chương I · Khởi Nguyên (Ghép Tiếp Giáp)',
      'Chương II · Giao Thoa (Vùng Giao Triệt Tiêu)',
      'Chương III · Luân Chuyển (Định Hướng 90°)',
    ];

    for (let c = 0; c < 3; c++) {
      const firstNode = nodes[c * 6];
      const chBadge = this.add
        .text(360, firstNode.y - 42, chapterNames[c], {
          fontFamily: TYPO_TOKENS.fontFamily.sans,
          fontSize: '13px',
          color: COLOR_TOKENS.iceGlass.bevelHighlight,
          backgroundColor: '#0c1730',
          padding: { x: 12, y: 6 },
        })
        .setOrigin(0.5);
      this.mapContainer.add(chBadge);
    }

    // 3. Vẽ từng Node màn chơi
    for (const node of nodes) {
      let textureKey = TEXTURE_KEYS.nodeLocked;
      if (node.state === 'completed') textureKey = TEXTURE_KEYS.nodeCompleted;
      else if (node.state === 'current') textureKey = TEXTURE_KEYS.nodeCurrent;
      else if (node.state === 'unlocked') textureKey = TEXTURE_KEYS.nodeUnlocked;

      const nodeSprite = this.add
        .image(node.x, node.y, textureKey)
        .setInteractive({ useHandCursor: node.state !== 'locked' });

      // Nếu là node hiện tại, thêm tween nhấp nháy phát quang
      if (node.state === 'current') {
        this.tweens.add({
          targets: nodeSprite,
          scaleX: 1.12,
          scaleY: 1.12,
          duration: 700,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }

      // Tên màn chơi bên cạnh node
      const isRight = node.x <= 360;
      const labelX = isRight ? node.x + 36 : node.x - 36;
      const labelOrigin = isRight ? 0 : 1;

      const label = this.add
        .text(labelX, node.y, `${node.id} · ${node.title}`, {
          fontFamily: TYPO_TOKENS.fontFamily.sans,
          fontSize: '14px',
          color: node.state === 'locked' ? COLOR_TOKENS.text.secondary : COLOR_TOKENS.text.primary,
        })
        .setOrigin(labelOrigin, 0.5);

      // Tương tác chạm
      nodeSprite.on('pointerdown', () => {
        if (node.state === 'locked') {
          this.showToast(`Màn ${node.id} chưa mở khóa`);
        } else if (!node.available) {
          this.showToast(`Màn ${node.id} đang được tinh chỉnh`);
        } else {
          this.scene.start('PlayScene', { levelId: node.id });
        }
      });

      this.mapContainer.add([nodeSprite, label]);
    }

    // Cập nhật giới hạn cuộn
    const totalHeight = nodes[nodes.length - 1].y + 120;
    this.minY = Math.min(0, 1280 - totalHeight);
  }

  private showToast(message: string): void {
    if (this.toastText) this.toastText.destroy();

    this.toastText = this.add
      .text(360, 1180, message, {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '14px',
        color: COLOR_TOKENS.amberGold.solidPrimary,
        backgroundColor: '#050a1a',
        padding: { x: 16, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.tweens.add({
      targets: this.toastText,
      alpha: 0,
      delay: 1500,
      duration: 500,
      onComplete: () => {
        this.toastText?.destroy();
      },
    });
  }
}
