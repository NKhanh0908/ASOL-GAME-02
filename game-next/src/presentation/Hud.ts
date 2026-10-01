import Phaser from 'phaser';
import type { PlayViewSnapshot } from '../application/playController.ts';
import {
  COLOR_NUMBERS,
  COLOR_TOKENS,
  DEPTH_TOKENS,
  LAYOUT_TOKENS,
  TYPO_TOKENS,
} from './designTokens.ts';
import { TEXTURE_KEYS } from './TextureFactory.ts';
import { drawJewel } from './JewelShape.ts';
import { SNAP_HINT_TEXT, VICTORY_LABELS, formatMatchCount } from './hudText.ts';

export type HudCallbacks = {
  onMenu: () => void;
  onReset: () => void;
  onRotate: () => void;
  onToggleTarget: () => void;
  onNextLevel: () => void;
  onLevelSelect: () => void;
};

export class Hud {
  private scene: Phaser.Scene;
  private callbacks: HudCallbacks;
  private levelId: string;

  private titleText: Phaser.GameObjects.Text;
  private subtitleText: Phaser.GameObjects.Text;
  private targetButton: Phaser.GameObjects.Container;
  private targetIcon: Phaser.GameObjects.Image;

  private resetContainer: Phaser.GameObjects.Container;
  private rotateContainer: Phaser.GameObjects.Container;
  private rotateBtnBase: Phaser.GameObjects.Image;
  private rotateIcon: Phaser.GameObjects.Image;
  private rotateLabel: Phaser.GameObjects.Text;

  private winContainer: Phaser.GameObjects.Container;
  private matchBar: Phaser.GameObjects.Container;
  private matchBarGraphics: Phaser.GameObjects.Graphics;
  private matchBarText: Phaser.GameObjects.Text;
  private snapHint: Phaser.GameObjects.Container | null = null;
  private winVerseText!: Phaser.GameObjects.Text;
  private rotateAllowed = false;

  constructor(scene: Phaser.Scene, title: string, callbacks: HudCallbacks, levelId: string = '1-1') {
    this.scene = scene;
    this.callbacks = callbacks;
    this.levelId = levelId;

    const chapterNum = parseInt(this.levelId.split('-')[0], 10) || 1;
    const chapterRoman = chapterNum === 1 ? 'Chương I' : chapterNum === 2 ? 'Chương II' : 'Chương III';
    const levelName = title.includes('·') ? title.split('·')[1].trim() : title;

    // 1. Nút Menu tròn 80px (Vùng chạm 96px, Góc trên trái: x=56, y=56)
    const menuBtn = this.scene.add
      .image(56, 56, TEXTURE_KEYS.btnCircle80)
      .setSize(96, 96)
      .setInteractive({ useHandCursor: true });
    const menuIcon = this.scene.add.image(56, 56, TEXTURE_KEYS.iconMenuBack).setScale(1.25);
    menuBtn.on('pointerdown', () => {
      this.animateButtonTap(menuBtn, () => this.callbacks.onMenu());
    });

    // 2. Tiêu đề màn chơi 36px + Dòng phụ Chương 24px (Giữa header: x=360)
    this.titleText = this.scene.add
      .text(360, 34, levelName, {
        fontFamily: TYPO_TOKENS.fontFamily.serif,
        fontSize: TYPO_TOKENS.fontSize.headerTitle,
        color: COLOR_TOKENS.text.primary,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.subtitleText = this.scene.add
      .text(360, 74, `${chapterRoman} · Màn ${this.levelId}`, {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '24px',
        color: COLOR_TOKENS.text.secondary,
      })
      .setOrigin(0.5);

    // 3. Nút tròn Icon mắt bóng mục tiêu 80px (Vùng chạm 96px, Góc trên phải: x=664, y=56)
    this.targetButton = this.scene.add.container(664, 56);
    const targetBtnBase = this.scene.add
      .image(0, 0, TEXTURE_KEYS.btnCircle80)
      .setSize(96, 96)
      .setInteractive({ useHandCursor: true });
    this.targetIcon = this.scene.add.image(0, 0, TEXTURE_KEYS.iconEyeOpen);

    targetBtnBase.on('pointerdown', () => {
      this.animateButtonTap(targetBtnBase, () => this.callbacks.onToggleTarget());
    });
    this.targetButton.add([targetBtnBase, this.targetIcon]);

    // 4. Hàng nút dưới cùng: Đặt lại ở góc trái, Xoay ở góc phải (từ Chương
    // 3), thanh đếm mảnh ở giữa — theo mockup. Trước đây nút Đặt lại nằm
    // giữa màn, ngay chỗ khay và thanh đếm, nên bị cả hai che.
    const isChapter3Plus = chapterNum >= 3;
    const bottomRowY = LAYOUT_TOKENS.bottomBar.y + 44;
    const buttonScale = 0.8; // 112px -> ~90px, vẫn trên chuẩn chạm tối thiểu

    // A. Nút Đặt lại
    this.resetContainer = this.scene.add
      .container(84, bottomRowY)
      .setDepth(DEPTH_TOKENS.hudControls);
    const resetBtnBase = this.scene.add
      .image(0, 0, TEXTURE_KEYS.btnCircle112)
      .setScale(buttonScale)
      .setSize(112, 112)
      .setInteractive({ useHandCursor: true });
    const resetIcon = this.scene.add.image(0, 0, TEXTURE_KEYS.iconReset).setScale(1.2);
    const resetLabel = this.scene.add
      .text(0, 58, 'Đặt lại', {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '22px',
        color: COLOR_TOKENS.text.secondary,
      })
      .setOrigin(0.5);

    resetBtnBase.on('pointerdown', () => {
      this.animateButtonTap(resetBtnBase, () => this.callbacks.onReset());
    });
    this.resetContainer.add([resetBtnBase, resetIcon, resetLabel]);

    // B. Nút Xoay tròn 112px (Chỉ hiện từ Chương 3)
    this.rotateContainer = this.scene.add
      .container(636, bottomRowY)
      .setDepth(DEPTH_TOKENS.hudControls);
    this.rotateBtnBase = this.scene.add
      .image(0, 0, TEXTURE_KEYS.btnCircle112)
      .setScale(buttonScale)
      .setSize(112, 112)
      .setInteractive({ useHandCursor: true });
    this.rotateIcon = this.scene.add.image(0, 0, TEXTURE_KEYS.iconRotate).setScale(1.2);
    this.rotateLabel = this.scene.add
      .text(0, 58, 'Xoay', {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '22px',
        color: COLOR_TOKENS.text.secondary,
      })
      .setOrigin(0.5);

    this.rotateBtnBase.on('pointerdown', () => {
      this.animateButtonTap(this.rotateBtnBase, () => this.callbacks.onRotate());
    });
    this.rotateContainer.add([this.rotateBtnBase, this.rotateIcon, this.rotateLabel]);

    this.rotateAllowed = isChapter3Plus;
    if (!isChapter3Plus) {
      this.rotateContainer.setVisible(false);
    }

    // 5. Thanh đếm mảnh ở đáy: viên thuốc bo tròn, icon thoi đặc cho mảnh đã
    // khớp và thoi nét đứt cho mảnh còn lại.
    // Cùng hàng với nút Đặt lại để đáy màn hình đọc thành một dải
    const barY = LAYOUT_TOKENS.bottomBar.y + 44;
    this.matchBar = this.scene.add.container(360, barY).setDepth(DEPTH_TOKENS.hudControls);
    this.matchBarGraphics = this.scene.add.graphics();
    this.matchBarText = this.scene.add
      .text(24, 0, formatMatchCount(0, 2), {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: TYPO_TOKENS.fontSize.caption,
        color: COLOR_TOKENS.text.primary,
      })
      .setOrigin(0, 0.5);
    this.matchBar.add([this.matchBarGraphics, this.matchBarText]);

    // 6. Modal Hoàn Thành Chiến Thắng (Celestial Victory Dialog)
    this.winContainer = this.scene.add.container(0, 0).setDepth(100).setVisible(false);

    // Thẻ hoàn thành thay chỗ khay và hàng nút đáy, theo mockup: bàn chơi đã
    // giải vẫn hiện trọn phía trên, không có gì đè lên nó.
    const card = { x: 30, y: 1012, w: 660, h: 262 };
    const cx = card.x + card.w / 2;

    // Lớp chặn chạm xuống bàn, gần như trong suốt để không làm tối khung vàng
    const winOverlay = this.scene.add
      .rectangle(0, 0, LAYOUT_TOKENS.canvas.width, LAYOUT_TOKENS.canvas.height, 0x000000, 0.01)
      .setOrigin(0, 0)
      .setInteractive();

    const cardFrame = this.scene.add
      .image(card.x, card.y, TEXTURE_KEYS.victoryCardFrame)
      .setOrigin(0, 0);
    const cardSurface = this.scene.add
      .image(card.x + 6, card.y + 6, TEXTURE_KEYS.victoryCardSurface)
      .setOrigin(0, 0);

    const winLabel = this.scene.add
      .text(cx, card.y + 38, VICTORY_LABELS.title, {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#FFD983',
      })
      .setOrigin(0.5);

    const winTitle = this.scene.add
      .text(cx, card.y + 79, levelName, {
        fontFamily: TYPO_TOKENS.fontFamily.serif,
        fontSize: '40px',
        fontStyle: 'bold',
        color: COLOR_TOKENS.text.primary,
      })
      .setOrigin(0.5);

    const winVerse = this.scene.add
      .text(cx, card.y + 123, '', {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '22px',
        color: '#D8E6FF',
        align: 'center',
        wordWrap: { width: card.w - 80, useAdvancedWrap: true },
      })
      .setOrigin(0.5);
    this.winVerseText = winVerse;

    // Hai nút nằm ngang: Chọn màn (phụ, hẹp) | Màn tiếp theo (chính, rộng)
    const btnTop = card.y + 152;
    const btnH = 76;
    const innerLeft = card.x + 40;
    const selectW = 216;
    const nextX = innerLeft + selectW + 18;

    const selectBtnBg = this.scene.add.graphics();
    selectBtnBg.fillStyle(0x2846a0, 0.5);
    selectBtnBg.fillRoundedRect(innerLeft, btnTop, selectW, btnH, 30);
    selectBtnBg.lineStyle(1.5, COLOR_NUMBERS.icePrimary, 0.45);
    selectBtnBg.strokeRoundedRect(innerLeft, btnTop, selectW, btnH, 30);

    const selectBtn = this.scene.add
      .text(innerLeft + selectW / 2, btnTop + btnH / 2, VICTORY_LABELS.levelSelect, {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '26px',
        fontStyle: 'bold',
        color: COLOR_TOKENS.text.primary,
      })
      .setOrigin(0.5);
    const selectHit = this.scene.add
      .zone(innerLeft, btnTop, selectW, btnH)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });
    selectHit.on('pointerdown', () => this.callbacks.onLevelSelect());

    const nextBtnBg = this.scene.add
      .image(nextX, btnTop, TEXTURE_KEYS.victoryNextButton)
      .setOrigin(0, 0);
    const nextBtn = this.scene.add
      .text(nextX + 173, btnTop + btnH / 2, VICTORY_LABELS.next, {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '28px',
        fontStyle: 'bold',
        color: COLOR_TOKENS.text.onAmber,
      })
      .setOrigin(0.5);
    const nextHit = this.scene.add
      .zone(nextX, btnTop, 346, btnH)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });
    nextHit.on('pointerdown', () => this.callbacks.onNextLevel());

    this.winContainer.add([
      winOverlay,
      cardFrame,
      cardSurface,
      winLabel,
      winTitle,
      winVerse,
      selectBtnBg,
      selectBtn,
      selectHit,
      nextBtnBg,
      nextBtn,
      nextHit,
    ]);
  }

  private animateButtonTap(target: Phaser.GameObjects.GameObject, onComplete: () => void): void {
    this.scene.tweens.add({
      targets: target,
      scaleX: 0.94,
      scaleY: 0.94,
      duration: 80,
      yoyo: true,
      ease: 'Cubic.easeOut',
      onComplete,
    });
  }

  public update(snapshot: PlayViewSnapshot): void {
    this.targetIcon.setTexture(snapshot.showTarget ? TEXTURE_KEYS.iconEyeOpen : TEXTURE_KEYS.iconEyeClosed);

    if (snapshot.canRotate) {
      this.rotateContainer.setAlpha(1.0);
      this.rotateBtnBase.setInteractive({ useHandCursor: true });
    } else {
      this.rotateContainer.setAlpha(0.3);
      this.rotateBtnBase.disableInteractive();
    }

    this.drawMatchBar(snapshot.snappedCount, snapshot.totalPieces);

    if (snapshot.phase !== 'won' && this.winContainer.visible) {
      this.hideWinModal();
    }
  }

  /**
   * Vẽ lại thanh đếm. Chiều rộng viên thuốc co theo độ dài chữ nên số mảnh
   * đổi thì khung vẫn ôm sát.
   */
  private drawMatchBar(matched: number, total: number): void {
    this.matchBarText.setText(formatMatchCount(matched, total));

    const iconSize = 14;
    const iconGap = 10;
    const iconsWidth = total * (iconSize * 2 + iconGap);
    const padding = 24;
    const width = iconsWidth + this.matchBarText.width + padding * 2;
    const height = 56;

    this.matchBar.setX(360);
    this.matchBarText.setX(-width / 2 + padding + iconsWidth);

    const g = this.matchBarGraphics;
    g.clear();
    g.fillStyle(COLOR_NUMBERS.boardSurfaceBottom, 0.6);
    g.fillRoundedRect(-width / 2, -height / 2, width, height, height / 2);
    g.lineStyle(1.5, COLOR_NUMBERS.icePrimary, 0.6);
    g.strokeRoundedRect(-width / 2, -height / 2, width, height, height / 2);

    for (let i = 0; i < total; i++) {
      const cx = -width / 2 + padding + iconSize + i * (iconSize * 2 + iconGap);
      drawJewel(g, {
        cx,
        cy: 0,
        radius: iconSize,
        variant: i < matched ? 'solid' : 'placeholder',
      });
    }
  }

  /** Nhãn nổi cạnh mảnh khi kéo trúng vùng hít. */
  public showSnapHint(x: number, y: number): void {
    if (!this.snapHint) {
      const bg = this.scene.add.graphics();
      bg.fillStyle(0xfff4d2, 1);
      bg.fillRoundedRect(-80, -22, 160, 44, 14);
      const label = this.scene.add
        .text(0, 0, SNAP_HINT_TEXT, {
          fontFamily: TYPO_TOKENS.fontFamily.sans,
          fontSize: '22px',
          color: COLOR_TOKENS.text.onAmber,
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.snapHint = this.scene.add
        .container(0, 0, [bg, label])
        .setDepth(DEPTH_TOKENS.hudControls);
    }
    this.snapHint.setPosition(x, y).setVisible(true);
  }

  public hideSnapHint(): void {
    this.snapHint?.setVisible(false);
  }

  public showWinModal(victoryVerse?: string): void {
    this.winVerseText
      .setText(victoryVerse ? `“${victoryVerse}”` : '')
      .setVisible(Boolean(victoryVerse));
    // Thẻ chiếm chỗ hàng đáy, nên nút và thanh đếm phải nhường chỗ
    this.resetContainer.setVisible(false);
    this.rotateContainer.setVisible(false);
    this.matchBar.setVisible(false);
    if (this.winContainer.visible) return;
    this.winContainer.setAlpha(0).setVisible(true);
    this.scene.tweens.add({
      targets: this.winContainer,
      alpha: 1,
      duration: 500,
      ease: 'Cubic.easeOut',
    });
  }

  public hideWinModal(): void {
    this.winContainer.setVisible(false);
    this.resetContainer.setVisible(true);
    this.rotateContainer.setVisible(this.rotateAllowed);
    this.matchBar.setVisible(true);
  }

  public destroy(): void {
    this.matchBar.destroy();
    this.snapHint?.destroy();
    this.titleText.destroy();
    this.subtitleText.destroy();
    this.targetButton.destroy();
    this.resetContainer.destroy();
    this.rotateContainer.destroy();
    this.winContainer.destroy();
  }
}
