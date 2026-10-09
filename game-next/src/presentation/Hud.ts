import Phaser from 'phaser';
import type { PlayViewSnapshot } from '../application/playController.ts';
import {
  COLOR_NUMBERS,
  COLOR_TOKENS,
  DEPTH_TOKENS,
  FEEDBACK_TOKENS,
  LAYOUT_TOKENS,
  TYPO_TOKENS,
  VICTORY_CARD,
} from './designTokens.ts';
import { TEXTURE_KEYS } from './TextureFactory.ts';
import { computeLayout } from './layout.ts';
import type { LayoutMetrics } from './layout.ts';
import { drawJewel } from './JewelShape.ts';
import { CHAPTERS, chapterInfo, chapterOfLevelId } from '../content/chapters.ts';
import { t, getLevelTitle } from './i18n.ts';
import {
  VICTORY_VERSE_FONT_SIZE,
  fitHudTitleFontSize,
  formatMatchCount,
  getSnapHintText,
  getVictoryLabels,
} from './hudText.ts';
import { enter, exit, type Poseable } from './transitions/choreography.ts';
import { stepScalar } from './pieceMotion.ts';
import { isReducedMotion } from './transitions/motion.ts';
import type { TransitionTimeline } from './transitions/TransitionTimeline.ts';
import type { VictoryPlan } from './feedback/victorySequence.ts';
import { playUiCue } from './audio/uiCues.ts';

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

  private menuButton: Phaser.GameObjects.Container;
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
  private winItems: Poseable[][] = [];
  private rotateAllowed = false;
  private matchIconCenters: number[] = [];
  private hint = { alpha: 0, x: 0, y: 0 };
  private lastCanRotate: boolean | null = null;
  private readonly layout: LayoutMetrics;

  constructor(
    scene: Phaser.Scene,
    title: string,
    callbacks: HudCallbacks,
    levelId: string = '1-1',
    layout: LayoutMetrics = computeLayout(LAYOUT_TOKENS.canvas.width, LAYOUT_TOKENS.canvas.height)
  ) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.levelId = levelId;
    this.layout = layout;

    // Màn dev (mã không theo "<chương>-<số>") hiển thị như Chương I
    const chapter = chapterInfo(chapterOfLevelId(this.levelId) ?? 1) ?? CHAPTERS[0];
    const chapterRoman = `${t('chapter_prefix')} ${chapter.roman}`;
    const rawLevelName = title.includes('·') ? title.split('·')[1].trim() : title;
    const levelName = getLevelTitle(this.levelId, rawLevelName);

    // Header bám mép trên đã trừ lề an toàn. Toạ độ y bên dưới là khoảng cách
    // tính từ đỉnh header trên artboard gốc, nên chỉ việc cộng thêm.
    const headerTop = this.layout.headerBounds.y;

    // 1. Nút Menu tròn 80px (Vùng chạm 96px, Góc trên trái: x=56, y=56)
    this.menuButton = this.scene.add.container(56, headerTop + 56);
    const menuBtn = this.scene.add
      .image(0, 0, TEXTURE_KEYS.btnCircle80)
      .setSize(96, 96)
      .setInteractive({ useHandCursor: true });
    const menuIcon = this.scene.add.image(0, 0, TEXTURE_KEYS.iconMenuBack).setScale(1.25);
    menuBtn.on('pointerdown', () => {
      this.animateButtonTap(menuBtn, () => this.callbacks.onMenu());
    });
    this.menuButton.add([menuBtn, menuIcon]);

    // 2. Tiêu đề màn chơi 36px + Dòng phụ Chương 24px (Giữa header: x=360)
    this.titleText = this.scene.add
      .text(360, headerTop + 34, levelName, {
        fontFamily: TYPO_TOKENS.fontFamily.levelTitle,
        fontSize: TYPO_TOKENS.fontSize.headerTitle,
        color: COLOR_TOKENS.text.primary,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.titleText.setFontSize(fitHudTitleFontSize(this.titleText.width));

    const subtitleContent = this.levelId.startsWith('endless')
      ? `${chapterRoman} · ${t('gate_endless')}`
      : `${chapterRoman} · ${t('level_prefix')} ${this.levelId}`;

    this.subtitleText = this.scene.add
      .text(360, headerTop + 74, subtitleContent, {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '24px',
        color: COLOR_TOKENS.text.secondary,
      })
      .setOrigin(0.5);

    // 3. Nút tròn Icon mắt bóng mục tiêu 80px (Vùng chạm 96px, Góc trên phải: x=664, y=56)
    this.targetButton = this.scene.add.container(664, headerTop + 56);
    const targetBtnBase = this.scene.add
      .image(0, 0, TEXTURE_KEYS.btnCircle80)
      .setSize(96, 96)
      .setInteractive({ useHandCursor: true });
    this.targetIcon = this.scene.add.image(0, 0, TEXTURE_KEYS.iconEyeOpen);

    targetBtnBase.on('pointerdown', () => {
      playUiCue(this.scene, 'tap');
      this.animateButtonTap(targetBtnBase, () => this.callbacks.onToggleTarget());
    });
    this.targetButton.add([targetBtnBase, this.targetIcon]);

    // 4. Hàng nút dưới cùng: Đặt lại ở góc trái, Xoay ở góc phải (chỉ Chương
    // 4 — chương xoay), thanh đếm mảnh ở giữa — theo mockup. Trước đây nút Đặt lại nằm
    // giữa màn, ngay chỗ khay và thanh đếm, nên bị cả hai che.
    const rotationChapter = chapter.rotationEnabled;
    const bottomRowY = this.layout.bottomBarBounds.y + 44;
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
      .text(0, 58, t('btn_reset'), {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '22px',
        color: COLOR_TOKENS.text.secondary,
      })
      .setOrigin(0.5);

    resetBtnBase.on('pointerdown', () => {
      this.animateButtonTap(resetBtnBase, () => this.callbacks.onReset());
    });
    this.resetContainer.add([resetBtnBase, resetIcon, resetLabel]);

    // B. Nút Xoay tròn 112px (chỉ hiện ở Chương 4)
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
      .text(0, 58, t('btn_rotate'), {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '22px',
        color: COLOR_TOKENS.text.secondary,
      })
      .setOrigin(0.5);

    this.rotateBtnBase.on('pointerdown', () => {
      this.animateButtonTap(this.rotateBtnBase, () => this.callbacks.onRotate());
    });
    this.rotateContainer.add([this.rotateBtnBase, this.rotateIcon, this.rotateLabel]);

    this.rotateAllowed = rotationChapter;
    if (!rotationChapter) {
      this.rotateContainer.setVisible(false);
    }

    // 5. Thanh đếm mảnh ở đáy: viên thuốc bo tròn, icon thoi đặc cho mảnh đã
    // khớp và thoi nét đứt cho mảnh còn lại.
    // Cùng hàng với nút Đặt lại để đáy màn hình đọc thành một dải
    const barY = this.layout.bottomBarBounds.y + 44;
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
    // Thẻ chiến thắng bám mép trên khay (artboard gốc: 1016 - 4).
    const victoryLabels = getVictoryLabels();
    const card = {
      x: VICTORY_CARD.x,
      y: this.layout.trayBounds.y + VICTORY_CARD.bottomFromTray - VICTORY_CARD.h,
      w: VICTORY_CARD.w,
      h: VICTORY_CARD.h,
    };
    const cx = card.x + card.w / 2;

    // Lớp chặn chạm xuống bàn, gần như trong suốt để không làm tối khung vàng
    const winOverlay = this.scene.add
      .rectangle(0, 0, LAYOUT_TOKENS.canvas.width, this.layout.designHeight, 0x000000, 0.01)
      .setOrigin(0, 0)
      .setInteractive();

    const cardFrame = this.scene.add
      .image(card.x, card.y, TEXTURE_KEYS.victoryCardFrame)
      .setOrigin(0, 0);
    const cardSurface = this.scene.add
      .image(card.x + 6, card.y + 6, TEXTURE_KEYS.victoryCardSurface)
      .setOrigin(0, 0);

    const winLabel = this.scene.add
      .text(cx, card.y + VICTORY_CARD.offsets.label, victoryLabels.title, {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#FFD983',
      })
      .setOrigin(0.5);

    const winTitle = this.scene.add
      .text(cx, card.y + VICTORY_CARD.offsets.title, levelName, {
        fontFamily: TYPO_TOKENS.fontFamily.levelTitle,
        fontSize: '36px',
        fontStyle: 'bold',
        color: COLOR_TOKENS.text.primary,
      })
      .setOrigin(0.5);

    const winVerse = this.scene.add
      .text(cx, card.y + VICTORY_CARD.offsets.verse, '', {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: `${VICTORY_VERSE_FONT_SIZE}px`,
        color: '#D8E6FF',
        align: 'center',
        wordWrap: { width: card.w - 80, useAdvancedWrap: true },
      })
      .setOrigin(0.5);
    this.winVerseText = winVerse;

    // Hai nút nằm ngang: Chọn màn (phụ, hẹp) | Màn tiếp theo (chính, rộng)
    const btnTop = card.y + VICTORY_CARD.offsets.buttonTop;
    const btnH = VICTORY_CARD.buttonHeight;
    const innerLeft = card.x + 40;
    const selectW = 216;
    const nextX = innerLeft + selectW + 18;

    const selectBtnBg = this.scene.add.graphics();
    selectBtnBg.fillStyle(0x2846a0, 0.5);
    selectBtnBg.fillRoundedRect(innerLeft, btnTop, selectW, btnH, 30);
    selectBtnBg.lineStyle(1.5, COLOR_NUMBERS.icePrimary, 0.45);
    selectBtnBg.strokeRoundedRect(innerLeft, btnTop, selectW, btnH, 30);

    const selectBtn = this.scene.add
      .text(innerLeft + selectW / 2, btnTop + btnH / 2, victoryLabels.levelSelect, {
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
    selectHit.on('pointerdown', () => {
      playUiCue(this.scene, 'tap');
      this.callbacks.onLevelSelect();
    });

    const nextBtnBg = this.scene.add
      .image(nextX, btnTop, TEXTURE_KEYS.victoryNextButton)
      .setOrigin(0, 0);
    const nextBtn = this.scene.add
      .text(nextX + 173, btnTop + btnH / 2, victoryLabels.next, {
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
    nextHit.on('pointerdown', () => {
      playUiCue(this.scene, 'tap');
      this.callbacks.onNextLevel();
    });

    this.winItems = [[winLabel], [winTitle], [winVerse], [selectBtnBg, selectBtn, nextBtnBg, nextBtn]];

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

    if (snapshot.canRotate !== this.lastCanRotate) {
      this.lastCanRotate = snapshot.canRotate;
      if (snapshot.canRotate) this.rotateBtnBase.setInteractive({ useHandCursor: true });
      else this.rotateBtnBase.disableInteractive();
      this.scene.tweens.killTweensOf(this.rotateContainer);
      this.scene.tweens.add({
        targets: this.rotateContainer,
        alpha: snapshot.canRotate ? 1.0 : 0.3,
        duration: FEEDBACK_TOKENS.rotateButtonFadeMs,
        ease: 'Sine.easeInOut',
      });
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
    this.matchIconCenters = [];

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
      this.matchIconCenters[i] = cx;
      drawJewel(g, {
        cx,
        cy: 0,
        radius: iconSize,
        variant: i < matched ? 'solid' : 'placeholder',
      });
    }
  }

  /** Nhãn "Thả để khớp": hiện/ẩn trong ~120 ms, bám mảnh với τ 60 ms */
  public tickSnapHint(dtMs: number, target: { x: number; y: number } | null): void {
    if (!this.snapHint) {
      const bg = this.scene.add.graphics();
      bg.fillStyle(0xfff4d2, 1);
      bg.fillRoundedRect(-80, -22, 160, 44, 14);
      const label = this.scene.add
        .text(0, 0, getSnapHintText(), {
          fontFamily: TYPO_TOKENS.fontFamily.sans,
          fontSize: '22px',
          color: COLOR_TOKENS.text.onAmber,
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.snapHint = this.scene.add.container(0, 0, [bg, label]).setDepth(DEPTH_TOKENS.hudControls).setAlpha(0);
    }
    const reduced = isReducedMotion();
    const goal = target ? 1 : 0;
    const fadeTau = FEEDBACK_TOKENS.hintMs / 3;
    if (target && this.hint.alpha < 0.01) {
      this.hint.x = target.x;
      this.hint.y = target.y;
    } else if (target) {
      this.hint.x = reduced ? target.x : stepScalar(this.hint.x, target.x, dtMs, FEEDBACK_TOKENS.tau.hint);
      this.hint.y = reduced ? target.y : stepScalar(this.hint.y, target.y, dtMs, FEEDBACK_TOKENS.tau.hint);
    }
    this.hint.alpha = stepScalar(this.hint.alpha, goal, dtMs, fadeTau);
    if (Math.abs(this.hint.alpha - goal) < 0.01) this.hint.alpha = goal;
    const scale = reduced ? 1 : 0.9 + 0.1 * this.hint.alpha;
    this.snapHint
      .setPosition(this.hint.x, this.hint.y)
      .setAlpha(this.hint.alpha)
      .setScale(scale)
      .setVisible(this.hint.alpha > 0);
  }

  /** Biểu tượng thứ `index` trên thanh đếm bật 1.3 → 1 khi một mảnh khớp */
  public popCounterIcon(index: number): void {
    const cx = this.matchIconCenters[index];
    if (cx === undefined || isReducedMotion()) return;
    const pop = this.scene.add.graphics();
    drawJewel(pop, { cx: 0, cy: 0, radius: 14, variant: 'solid' });
    pop.setPosition(cx, 0).setScale(FEEDBACK_TOKENS.counterPopScale);
    this.matchBar.add(pop);
    this.scene.tweens.add({
      targets: pop,
      scaleX: 1,
      scaleY: 1,
      duration: FEEDBACK_TOKENS.counterPopMs,
      ease: 'Back.easeOut',
      onComplete: () => pop.destroy(),
    });
  }

  /** Nội dung và chỗ đứng của thẻ; không đụng tư thế để dàn dựng tự lo */
  private prepareWinModal(victoryVerse?: string): void {
    this.winVerseText
      .setText(victoryVerse ? `“${victoryVerse}”` : '')
      .setVisible(Boolean(victoryVerse));
    // Thẻ chiếm chỗ hàng đáy, nên nút và thanh đếm phải nhường chỗ
    this.resetContainer.setVisible(false);
    this.rotateContainer.setVisible(false);
    this.matchBar.setVisible(false);
    this.winContainer.setVisible(true);
  }

  /** Hiện ngay (khôi phục trạng thái đã thắng) */
  public showWinModal(victoryVerse?: string): void {
    this.winContainer.setPosition(0, 0).setAlpha(1);
    this.prepareWinModal(victoryVerse);
  }

  /**
   * Chuỗi thắng: thẻ trượt lên, bốn nhóm con hiện so le. Mọi `enter` lên lịch
   * ngay (đặt tư thế lệch lúc thẻ còn ẩn); lời gọi hiện thẻ ở cùng mốc đứng
   * sau các tween, nên `complete()` gói gọn trong một lượt xử lý.
   */
  public playWinCard(tl: TransitionTimeline, plan: VictoryPlan, victoryVerse?: string): void {
    enter(tl, this.winContainer, plan.cardAtMs, plan.cardMs, { dy: plan.cardSlidePx, alpha: 0 });
    this.winItems.forEach((group, i) => {
      for (const item of group) {
        enter(tl, item, plan.cardAtMs + i * plan.cardItemGapMs, plan.cardItemMs, { alpha: 0 });
      }
    });
    tl.call(plan.cardAtMs, () => this.prepareWinModal(victoryVerse));
  }

  public unwindWinCard(tl: TransitionTimeline, ms: number): void {
    exit(tl, this.winContainer, 0, ms, { dy: 60, alpha: 0 });
    tl.call(ms, () => this.hideWinModal());
  }

  public hideWinModal(): void {
    this.winContainer.setVisible(false).setPosition(0, 0).setAlpha(1);
    this.resetContainer.setVisible(true);
    this.rotateContainer.setVisible(this.rotateAllowed);
    this.matchBar.setVisible(true);
  }

  public getTransitionParts(): { title: Poseable[]; topButtons: Poseable[]; bottomBar: Poseable[]; winCard: Poseable[] } {
    return {
      title: [this.titleText, this.subtitleText],
      topButtons: [this.menuButton, this.targetButton],
      bottomBar: [this.resetContainer, this.matchBar, this.rotateContainer],
      winCard: [this.winContainer],
    };
  }

  public destroy(): void {
    this.menuButton.destroy();
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
