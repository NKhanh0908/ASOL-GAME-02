import Phaser from 'phaser';
import { LevelRepository } from '../domain/levelRepository';
import { levels } from '../domain/levels';
import type { CustomLevelRecord } from '../domain/types';
import { drawBackdrop } from './backdrop';
import { formatLevelLabel, groupLevels } from './levelMenu';
import { THEME } from './theme';

export class LevelMenuScene extends Phaser.Scene {
  private confirmDeleteId: string | undefined = undefined;
  private container!: Phaser.GameObjects.Container;

  constructor() {
    super('LevelMenu');
  }

  create(): void {
    drawBackdrop(this);
    this.confirmDeleteId = undefined;
    this.renderMenu();
  }

  private renderMenu(): void {
    if (this.container) {
      this.container.destroy();
    }
    this.container = this.add.container(0, 0);

    // Header
    this.container.add(
      this.add.text(360, 48, 'MIRROR', {
        fontFamily: 'Arial',
        fontSize: '40px',
        fontStyle: 'bold',
        color: THEME.text,
        letterSpacing: 4,
      }).setOrigin(0.5, 0)
    );

    this.container.add(
      this.add.text(360, 104, 'Chọn màn chơi hoặc sáng tạo màn mới', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: THEME.muted,
      }).setOrigin(0.5, 0)
    );

    // Create Custom Level Button
    const createBtn = this.createButton(
      360,
      170,
      480,
      64,
      '+ TẠO CUSTOM LEVEL',
      THEME.gold,
      0x1a1500,
      () => {
        this.openCreateCustomModal();
      }
    );
    this.container.add(createBtn);

    const all = LevelRepository.list();
    const { builtIn, custom } = groupLevels(all);

    // Section 1: Built-in levels
    this.container.add(
      this.add.text(48, 236, 'MÀN CHƠI CÓ SẴN', {
        fontFamily: 'Arial',
        fontSize: '16px',
        fontStyle: 'bold',
        color: THEME.blueText,
        letterSpacing: 2,
      })
    );

    // 2 columns grid for 6 built-in levels
    builtIn.forEach((lvl, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = col === 0 ? 200 : 520;
      const y = 300 + row * 84;

      const btn = this.createButton(
        x,
        y,
        300,
        64,
        formatLevelLabel(lvl),
        THEME.blue,
        THEME.board,
        () => {
          this.scene.start('Mirror', { levelId: lvl.id });
        }
      );
      this.container.add(btn);
    });

    // Section 2: Custom levels
    const customSectionY = 580;
    this.container.add(
      this.add.text(48, customSectionY, 'CUSTOM LEVELS (TỰ TẠO)', {
        fontFamily: 'Arial',
        fontSize: '16px',
        fontStyle: 'bold',
        color: THEME.goldText,
        letterSpacing: 2,
      })
    );

    if (custom.length === 0) {
      this.container.add(
        this.add.text(360, customSectionY + 60, 'Chưa có màn tự tạo nào. Hãy bấm nút tạo ở trên!', {
          fontFamily: 'Arial',
          fontSize: '18px',
          color: THEME.muted,
        }).setOrigin(0.5, 0)
      );
    } else {
      let curY = customSectionY + 50;
      const maxShown = Math.min(custom.length, 5); // show up to 5 on screen cleanly
      for (let i = 0; i < maxShown; i++) {
        const cLvl = custom[i];
        const card = this.createCustomLevelCard(360, curY + 40, cLvl);
        this.container.add(card);
        curY += 100;
      }
    }

    // If confirmation modal is open
    if (this.confirmDeleteId) {
      this.renderDeleteModal();
    }
  }

  private createCustomLevelCard(x: number, y: number, lvl: CustomLevelRecord): Phaser.GameObjects.Container {
    const card = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 640, 80, THEME.board, 0.9)
      .setStrokeStyle(1, THEME.blue, 0.4);
    card.add(bg);

    const titleText = this.add.text(-300, -18, lvl.title, {
      fontFamily: 'Arial',
      fontSize: '18px',
      fontStyle: 'bold',
      color: THEME.text,
    });
    const subText = this.add.text(-300, 8, `Mẫu gốc: ${lvl.sourceLevelId}  ·  ${lvl.pieces.length} mảnh`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: THEME.muted,
    });
    card.add([titleText, subText]);

    // Action buttons
    const playBtn = this.createButton(130, 0, 90, 52, 'Chơi', THEME.blue, THEME.board, () => {
      this.scene.start('Mirror', { levelId: lvl.id });
    }, 15);

    const editBtn = this.createButton(215, 0, 64, 52, 'Sửa', THEME.gold, THEME.board, () => {
      this.scene.start('CustomLevel', { sourceLevelId: lvl.sourceLevelId, editId: lvl.id });
    }, 15);

    const delBtn = this.createButton(285, 0, 64, 52, 'Xóa', THEME.danger, THEME.board, () => {
      this.confirmDeleteId = lvl.id;
      this.renderMenu();
    }, 15);

    card.add([playBtn, editBtn, delBtn]);
    return card;
  }

  private openCreateCustomModal(): void {
    const modal = this.add.container(360, 640).setDepth(20);
    const overlay = this.add.rectangle(0, 0, 720, 1280, 0x000000, 0.75).setInteractive();
    const box = this.add.rectangle(0, 0, 640, 700, THEME.board, 0.98).setStrokeStyle(2, THEME.gold, 0.8);
    modal.add([overlay, box]);

    modal.add(
      this.add.text(0, -300, 'CHỌN LEVEL MẪU', {
        fontFamily: 'Arial',
        fontSize: '24px',
        fontStyle: 'bold',
        color: THEME.goldText,
      }).setOrigin(0.5)
    );

    modal.add(
      this.add.text(0, -255, 'Bóng mục tiêu sẽ được lấy từ level mẫu đã chọn:', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: THEME.muted,
      }).setOrigin(0.5)
    );

    levels.forEach((lvl, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const bx = col === 0 ? -150 : 150;
      const by = -170 + row * 90;

      const btn = this.createButton(
        bx,
        by,
        270,
        68,
        formatLevelLabel(lvl),
        THEME.blue,
        0x0c152a,
        () => {
          modal.destroy();
          this.scene.start('CustomLevel', { sourceLevelId: lvl.id });
        },
        16
      );
      modal.add(btn);
    });

    const cancelBtn = this.createButton(0, 260, 320, 60, 'Đóng', THEME.blue, THEME.board, () => {
      modal.destroy();
    });
    modal.add(cancelBtn);
  }

  private renderDeleteModal(): void {
    const id = this.confirmDeleteId;
    if (!id) return;
    const target = LevelRepository.get(id);
    const modal = this.add.container(360, 640).setDepth(25);
    const overlay = this.add.rectangle(0, 0, 720, 1280, 0x000000, 0.75).setInteractive();
    const box = this.add.rectangle(0, 0, 580, 320, THEME.board, 0.98).setStrokeStyle(2, THEME.danger, 0.9);
    modal.add([overlay, box]);

    modal.add(
      this.add.text(0, -90, 'XÁC NHẬN XÓA', {
        fontFamily: 'Arial',
        fontSize: '24px',
        fontStyle: 'bold',
        color: THEME.dangerText,
      }).setOrigin(0.5)
    );

    modal.add(
      this.add.text(0, -30, `Bạn có chắc muốn xóa màn:\n"${target?.title ?? id}"?`, {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: THEME.text,
        align: 'center',
      }).setOrigin(0.5)
    );

    const yesBtn = this.createButton(-130, 70, 200, 56, 'Xóa vĩnh viễn', THEME.danger, 0x220505, () => {
      LevelRepository.remove(id);
      this.confirmDeleteId = undefined;
      modal.destroy();
      this.renderMenu();
    }, 16);


    const noBtn = this.createButton(130, 70, 200, 56, 'Hủy bỏ', THEME.blue, THEME.board, () => {
      this.confirmDeleteId = undefined;
      modal.destroy();
      this.renderMenu();
    }, 16);

    modal.add([yesBtn, noBtn]);
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    strokeColor: number,
    fillColor: number,
    action: () => void,
    fontSize = 18
  ): Phaser.GameObjects.Container {
    const background = this.add
      .rectangle(0, 0, width, height, fillColor, 0.85)
      .setStrokeStyle(2, strokeColor, 0.8)
      .setInteractive({ useHandCursor: true });

    background.on('pointerdown', () => {
      background.setAlpha(0.6);
    });
    background.on('pointerout', () => {
      background.setAlpha(0.85);
    });
    background.on('pointerup', () => {
      background.setAlpha(0.85);
      this.time.delayedCall(0, action);
    });

    const label = this.add
      .text(0, 0, text, {
        fontFamily: 'Arial',
        fontSize: `${fontSize}px`,
        fontStyle: 'bold',
        color: strokeColor === THEME.gold ? '#ffe28a' : THEME.text,
      })
      .setOrigin(0.5);

    return this.add.container(x, y, [background, label]);
  }
}

