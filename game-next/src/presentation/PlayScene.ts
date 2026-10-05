import Phaser from 'phaser';
import type { Level, PuzzleState, Transition } from '../domain/model.ts';
import { GRID_WIDTH, GRID_HEIGHT } from '../domain/model.ts';
import { loadLevel } from '../content/catalog.ts';
import { campaignManifest } from '../content/manifest.ts';
import { furthestLevelId, nextLevelId } from '../domain/campaign.ts';
import { createProgressRepository } from '../infrastructure/progressRepository.ts';
import { PlayController, type PlayViewSnapshot } from '../application/playController.ts';
import { BoardRenderer } from './BoardRenderer.ts';
import { maskCentroid } from '../domain/mask.ts';
import { Hud } from './Hud.ts';
import { applyDesignViewport, designSafeArea, designViewBounds } from './designViewport.ts';
import {
  computeLayout,
  gridToCanvas,
  pieceCenterCanvas,
  pieceHitbox,
  pieceRadiusPx,
} from './layout.ts';
import type { LayoutMetrics } from './layout.ts';

import { COLOR_NUMBERS, COLOR_TOKENS, DEPTH_TOKENS, TYPO_TOKENS } from './designTokens.ts';
import { TextureFactory } from './TextureFactory.ts';

import { PauseDialog } from './PauseDialog.ts';
import { TargetBadge } from './TargetBadge.ts';
import { t, getLevelTitle } from './i18n.ts';
import { director } from './transitions/SceneDirector.ts';
import type { Choreographed, TransitionContext } from './transitions/SceneDirector.ts';
import type { TransitionTimeline } from './transitions/TransitionTimeline.ts';
import { choreographPlayIn, choreographPlayOut, type PlayTransitionView } from './transitions/playChoreography.ts';

import { PieceTextureCache } from './PieceTextureCache.ts';
import { FeedbackDirector } from './feedback/FeedbackDirector.ts';
import { feedbackEvents, type FeedbackSubject } from './feedback/feedbackEvents.ts';
import { createHaptics } from '../infrastructure/haptics.ts';
import { capacitorHapticsDriver } from '../infrastructure/capacitorHaptics.ts';
import { Capacitor } from '@capacitor/core';
import type { BackgroundScene } from './BackgroundScene.ts';

export class PlayScene extends Phaser.Scene implements Choreographed {
  readonly directorKey = 'PlayScene' as const;
  private loadFailed = false;
  private level!: Level;
  private mode: 'campaign' | 'harness' = 'campaign';
  private controller!: PlayController;
  private boardRenderer!: BoardRenderer;
  private textureCache!: PieceTextureCache;
  private feedback!: FeedbackDirector;
  private layout!: LayoutMetrics;
  private targetBadge!: TargetBadge;
  private hud!: Hud;
  private pauseDialog!: PauseDialog;
  private celebrationContainer: Phaser.GameObjects.Container | null = null;
  private previewCompletedThrough?: string;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: {
    levelId?: string;
    mode?: 'campaign' | 'harness';
    previewCompletedThrough?: string;
  }): void {
    this.loadFailed = false;
    const levelId = data.levelId ?? '1-1';
    this.mode = data.mode ?? 'campaign';
    this.previewCompletedThrough = this.mode === 'harness'
      ? data.previewCompletedThrough
      : undefined;
    try {
      this.level = loadLevel(levelId, this.mode);
    } catch (err) {
      console.warn(`[PlayScene] Không thể tải màn ${levelId}, tự động chuyển về màn 1-1 an toàn:`, err);
      try {
        this.level = loadLevel('1-1', this.mode);
      } catch (fallbackErr) {
        console.error('[PlayScene] Lỗi nghiêm trọng khi tải màn 1-1:', fallbackErr);
        this.loadFailed = true;
      }
    }
  }

  create(): void {
    if (this.loadFailed) {
      // Không tải được cả 1-1: kết thúc chuyển cảnh đang chờ rồi về Menu
      director.attach(this);
      director.skip();
      this.time.delayedCall(0, () => {
        director.go(this, 'MenuScene', {}, { route: 'play-to-menu' });
      });
      return;
    }

    applyDesignViewport(this);
    TextureFactory.generateAll(this);
    // Hệ toạ độ thiết kế, không phải kích thước bộ đệm: camera zoom đã quy đổi.
    // Chiều cao chạy theo máy thật nên bố cục dọc giãn ra lấp kín màn hình.
    const view = designViewBounds(this);
    const layout = computeLayout(view.width, view.height, designSafeArea(this));
    this.layout = layout;

    const progressRepo = createProgressRepository(
      localStorage,
      campaignManifest,
      'oracle-v1'
    );

    const savedProgress = progressRepo.read().progress;
    this.controller = new PlayController(
      this.level,
      progressRepo,
      this.mode === 'campaign',
      savedProgress.settings.showTarget
    );

    // Texture mảnh vẽ rải mỗi khung một mảnh trong update(), không vẽ trong
    // create() để handoff của chuyển cảnh F1 không có khung > 50 ms.
    this.textureCache = new PieceTextureCache(this, this.level, layout.cellPixel);
    for (const piece of this.level.pieces) this.textureCache.enqueue(piece.id, 0);
    this.events.once('shutdown', () => this.textureCache.destroy());

    this.boardRenderer = new BoardRenderer(this, layout, this.level, this.textureCache);
    this.targetBadge = new TargetBadge(this, layout, this.level);

    this.pauseDialog = new PauseDialog(this, {
      onResume: () => {},
      onRestart: () => {
        this.resetLevel();
      },
      onLevelSelect: () => {
        this.openLevelSelect();
      },
    });

    this.hud = new Hud(
      this,
      `${this.level.id} · ${this.level.title}`,
      {
        onMenu: () => {
          this.pauseDialog.open();
        },
        onReset: () => {
          this.resetLevel();
        },
        onRotate: () => {
          const pieceId = this.controller.getSnapshot().selectedPieceId;
          const prev = this.controller.getPuzzleState();
          this.commit(prev, this.controller.onRotate(), { command: 'rotate', pieceId });
        },
        onToggleTarget: () => {
          this.controller.onToggleTarget();
          this.refreshView();
        },
        onLevelSelect: () => {
          this.openLevelSelect();
        },
        onNextLevel: () => {
          const nextId = nextLevelId(campaignManifest, this.level.id);
          let playable = false;
          if (nextId) {
            try {
              // Kiểm tra đúng chế độ: campaign về menu nếu màn kế chưa approved.
              loadLevel(nextId, this.mode);
              playable = true;
            } catch {
              playable = false;
            }
          }
          if (nextId && playable) {
            director.go(this, 'PlayScene', {
              levelId: nextId,
              mode: this.mode,
              previewCompletedThrough: this.mode === 'harness'
                ? furthestLevelId(campaignManifest, this.previewCompletedThrough, this.level.id)
                : undefined,
            }, { route: 'next-level' });
          } else {
            director.go(this, 'MenuScene', {}, { route: 'play-to-menu' });
          }
        },
      },
      this.level.id,
      layout
    );

    const haptics = createHaptics(
      Capacitor.isNativePlatform() ? capacitorHapticsDriver() : null,
      () => savedProgress.settings.haptics
    );
    this.feedback = new FeedbackDirector({
      scene: this,
      level: this.level,
      layout,
      board: this.boardRenderer,
      hud: this.hud,
      textures: this.textureCache,
      haptics,
      getState: () => this.controller.getPuzzleState(),
      background: () => this.scene.get('BackgroundScene') as BackgroundScene | null,
    });

    // Pointer events
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const hit = this.controller.onPointerDown(pointer.worldX, pointer.worldY, layout);
      if (hit) {
        const pieceId = this.controller.getSnapshot().dragInfo?.pieceId;
        if (pieceId) this.feedback.handle([{ type: 'lift', pieceId }]);
        this.refreshView();
      } else {
        this.spawnCosmicInteraction(pointer.worldX, pointer.worldY);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.controller.onPointerMove(pointer.worldX, pointer.worldY, layout);
    });

    const release = (pointer: Phaser.Input.Pointer) => {
      const pieceId = this.controller.getSnapshot().dragInfo?.pieceId ?? null;
      const prev = this.controller.getPuzzleState();
      this.commit(prev, this.controller.onPointerUp(pointer.worldX, pointer.worldY, layout), { command: 'move', pieceId });
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);

    this.input.on('gameout', () => {
      const pieceId = this.controller.getSnapshot().dragInfo?.pieceId ?? null;
      const prev = this.controller.getPuzzleState();
      this.commit(prev, this.controller.onPointerCancel(), { command: 'move', pieceId });
    });

    this.refreshView();

    if (this.controller.getSnapshot().phase === 'won') {
      this.boardRenderer.setVictoryMode(true);
      this.hud.showWinModal(this.level.victoryVerse);
    } else {
      // Thông báo banner chào đón đầu màn chơi
      this.showLevelStartToast(layout);
    }

    // Chỉ dùng khi phát triển: tự kéo mảnh để chụp ảnh kiểm tra thị giác.
    // ?autosolve=win  -> đặt đủ mảnh, ra màn hoàn thành
    // ?autosolve=drag -> mảnh đầu đã khớp, mảnh sau đang được kéo gần đích
    if (import.meta.env.DEV) {
      const mode = new URLSearchParams(window.location.search).get('autosolve');
      if (mode === 'win' || mode === 'drag') this.autosolve(mode, layout);
    }

    director.attach(this);
  }

  update(_time: number, delta: number): void {
    if (this.loadFailed) return;
    this.textureCache.bakeNext();
    this.feedback.tick(delta);
    const snapshot = this.controller.getSnapshot();
    this.boardRenderer.tick(delta, snapshot, this.controller.getPuzzleState().pieces);
    this.hud.tickSnapHint(delta, this.snapHintTarget(snapshot));
  }

  private snapHintTarget(snapshot: PlayViewSnapshot): { x: number; y: number } | null {
    const drag = snapshot.dragInfo;
    if (!drag || drag.snapCandidateId === null) return null;
    const piece = this.level.pieces.find((p) => p.id === drag.pieceId);
    const radius = piece ? pieceRadiusPx(piece.frameSize, this.layout) : 120;
    return { x: drag.x + radius * 0.8, y: drag.y + radius * 0.5 };
  }

  /** Áp kết quả một lệnh: phát phản hồi rồi cập nhật HUD */
  private commit(prev: PuzzleState, transition: Transition | null, subject: FeedbackSubject): void {
    if (!transition) return;
    this.feedback.handle(feedbackEvents(prev, transition, this.level, subject));
    this.refreshView();
    if (transition.becameWon) this.playCelebration(this.layout); // Task 9 chuyển vào FeedbackDirector
  }

  private resetLevel(): void {
    const prev = this.controller.getPuzzleState();
    const transition = this.controller.onReset();
    this.cleanupCelebration();
    this.boardRenderer.setVictoryMode(false);
    this.hud.hideWinModal();
    this.commit(prev, transition, { command: 'reset', pieceId: null });
  }

  private transitionView(): PlayTransitionView {
    const board = this.boardRenderer.getTransitionParts();
    const hud = this.hud.getTransitionParts();
    const state = this.controller.getPuzzleState();
    const pieceCenters = this.level.pieces.flatMap((piece) => {
      const s = state.pieces[piece.id];
      if (!s || s.kind !== 'snapped') return [];
      const anchor = piece.anchors.find((a) => a.id === s.anchorId);
      return anchor ? [pieceCenterCanvas(piece.frameSize, anchor.x, anchor.y, this.layout)] : [];
    });
    return {
      scene: this,
      parts: {
        board: board.board,
        runes: board.runes,
        rings: board.rings,
        tray: board.tray,
        trayPieces: board.trayPieces,
        pieces: board.pieces,
        targets: board.targets,
        title: hud.title,
        topButtons: [...hud.topButtons, this.targetBadge.getContainer()],
        bottomBar: hud.bottomBar,
        winCard: hud.winCard,
      },
      grid: board.grid,
      boardBounds: this.layout.boardBounds,
      targetCount: this.level.targetPlacements?.length ?? 0,
      setTargetReveal: (values) => this.boardRenderer.setTargetReveal(values),
      setFrameGold: (on) => this.boardRenderer.setFrameGold(on),
      pieceCenters,
    };
  }

  playIn(tl: TransitionTimeline, ctx: TransitionContext): void {
    if (this.loadFailed) return;
    choreographPlayIn(tl, ctx, this.transitionView());
  }

  playOut(tl: TransitionTimeline, ctx: TransitionContext): void {
    if (this.loadFailed) return;
    choreographPlayOut(tl, ctx, this.transitionView());
  }

  private autosolve(mode: 'win' | 'drag', layout: LayoutMetrics): void {
    const pieces = this.level.pieces;
    pieces.forEach((piece, index) => {
      const start = pieceHitbox(piece, { kind: 'tray', turns: 0 }, layout, index, pieces.length);
      const anchor = piece.anchors.find((a) => a.id === 'A') ?? piece.anchors[0];
      const target = pieceCenterCanvas(piece.frameSize, anchor.x, anchor.y, layout);
      this.controller.onPointerDown(start.x + start.width / 2, start.y + start.height / 2, layout);

      const isLast = index === pieces.length - 1;
      if (mode === 'drag' && isLast) {
        // Dừng giữa chừng, lệch nhẹ khỏi đích để còn trong vùng hít
        this.controller.onPointerMove(target.x + 12, target.y - 12, layout);
        this.refreshView();
        return;
      }

      const prev = this.controller.getPuzzleState();
      const transition = this.controller.onPointerUp(target.x, target.y, layout);
      this.commit(prev, transition, { command: 'move', pieceId: piece.id });
    });
  }

  private refreshView(): void {
    this.hud.update(this.controller.getSnapshot());
  }

  private playCelebration(layout: LayoutMetrics): void {
    this.cleanupCelebration();

    const celebration = this.add.container(0, 0).setDepth(90);
    this.celebrationContainer = celebration;

    // 1. Ánh chớp sao starlight flash dịu nhẹ
    this.cameras.main.flash(350, 249, 199, 79, false);

    // Trọng tâm hình mục tiêu (với 1-1 là tâm bàn, nơi hai thoi chạm đỉnh)
    const centroid = maskCentroid(this.level.targetMask) ?? { x: GRID_WIDTH / 2, y: GRID_HEIGHT / 2 };
    const center = gridToCanvas(centroid.x, centroid.y, layout);

    // 2. Vòng sóng năng lượng cổ ngữ (Resonance Shockwave Rings)
    const ringGraphics = this.add.graphics();
    celebration.add(ringGraphics);

    const ringState = { radius1: 10, alpha1: 0.9, radius2: 0, alpha2: 0 };
    this.tweens.add({
      targets: ringState,
      radius1: 160,
      alpha1: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        ringGraphics.clear();
        if (ringState.alpha1 > 0) {
          ringGraphics.lineStyle(2.5, 0xffd166, ringState.alpha1);
          ringGraphics.strokeCircle(center.x, center.y, ringState.radius1);
        }
        if (ringState.alpha2 > 0) {
          ringGraphics.lineStyle(1.8, 0x4ecdc4, ringState.alpha2);
          ringGraphics.strokeCircle(center.x, center.y, ringState.radius2);
        }
      },
    });

    this.time.delayedCall(160, () => {
      ringState.radius2 = 10;
      ringState.alpha2 = 0.8;
      this.tweens.add({
        targets: ringState,
        radius2: 180,
        alpha2: 0,
        duration: 850,
        ease: 'Cubic.easeOut',
      });
    });

    // 3. Bung tỏa các hạt bụi sao stardust
    const colors = [0xffd166, 0xf9c74f, 0x4ecdc4, 0xffffff];
    const particleGraphics = this.add.graphics();
    celebration.add(particleGraphics);

    type Particle = {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      currentX: number;
      currentY: number;
      radius: number;
      color: number;
    };

    const particles: Particle[] = [];
    for (let i = 0; i < 40; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.FloatBetween(40, 200);
      particles.push({
        x: center.x,
        y: center.y,
        targetX: center.x + Math.cos(angle) * dist,
        targetY: center.y + Math.sin(angle) * dist,
        currentX: center.x,
        currentY: center.y,
        radius: Phaser.Math.FloatBetween(1.5, 3.5),
        color: colors[i % colors.length],
      });
    }

    const tweenProgress = { t: 0 };
    this.tweens.add({
      targets: tweenProgress,
      t: 1,
      duration: 1100,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        particleGraphics.clear();
        const p = tweenProgress.t;
        for (const pt of particles) {
          pt.currentX = Phaser.Math.Linear(pt.x, pt.targetX, p);
          pt.currentY = Phaser.Math.Linear(pt.y, pt.targetY, p);
          const alpha = (1 - p) * Phaser.Math.FloatBetween(0.7, 1);
          particleGraphics.fillStyle(pt.color, Math.max(0, alpha));
          particleGraphics.fillCircle(pt.currentX, pt.currentY, pt.radius * (1 - p * 0.3));
        }
      },
    });

    // 4. Khung bàn đổi vàng, rồi hiện thẻ hoàn thành sau một nhịp để người
    // chơi kịp thấy hai mảnh khớp. Thẻ thay chỗ khay, không đè lên bàn.
    this.boardRenderer.setVictoryMode(true);
    this.time.delayedCall(700, () => {
      this.hud.showWinModal(this.level.victoryVerse);
    });
  }

  private cleanupCelebration(): void {
    if (this.celebrationContainer) {
      this.celebrationContainer.destroy();
      this.celebrationContainer = null;
    }
  }

  private openLevelSelect(): void {
    const justCompleted = this.controller?.getSnapshot().phase === 'won'
      ? this.level.id
      : undefined;
    director.go(this, 'LevelSelectScene', {
      mode: this.mode,
      previewCompletedThrough: this.mode === 'harness'
        ? furthestLevelId(
            campaignManifest,
            this.previewCompletedThrough,
            justCompleted
          )
        : undefined,
    }, { route: 'play-to-map' });
  }

  public onHardwareBack(): void {
    if (this.pauseDialog.isOpen()) {
      this.pauseDialog.close();
    } else {
      this.pauseDialog.open();
    }
  }

  /**
   * Banner chào đón đầu màn chơi (Level Start Toast)
   * Xuất hiện với hiệu ứng pop-in đàn hồi, giữ 1.25s rồi trôi nhẹ lên trên và biến mất.
   */
  private showLevelStartToast(layout: LayoutMetrics): void {
    const chapterNum = this.level.id.split('-')[0] ?? '1';
    const localizedTitle = getLevelTitle(this.level.id, this.level.title);

    const cx = layout.boardBounds.x + layout.boardBounds.width / 2;
    const cy = layout.boardBounds.y + layout.boardBounds.height * 0.42;

    const toastContainer = this.add.container(cx, cy).setDepth(120);

    const toastW = 380;
    const toastH = 92;

    // Bóng đổ sẫm màu
    const shadow = this.add.graphics();
    shadow.fillStyle(0x050a1a, 0.75);
    shadow.fillRoundedRect(-toastW / 2 + 4, -toastH / 2 + 6, toastW, toastH, 24);

    // Tấm thẻ kính saphire rực rỡ
    const card = this.add.graphics();
    card.fillStyle(0x131b4d, 0.94);
    card.fillRoundedRect(-toastW / 2, -toastH / 2, toastW, toastH, 24);

    // Lớp tráng gương phía trên
    card.fillStyle(0xffffff, 0.12);
    card.fillRoundedRect(-toastW / 2 + 10, -toastH / 2 + 4, toastW - 20, 20, 10);

    // Viền kép ngọc vàng và băng lam
    card.lineStyle(2.5, 0xffd23f, 0.9);
    card.strokeRoundedRect(-toastW / 2, -toastH / 2, toastW, toastH, 24);
    card.lineStyle(1.2, 0x7fd8ff, 0.65);
    card.strokeRoundedRect(-toastW / 2 + 4, -toastH / 2 + 4, toastW - 8, toastH - 8, 20);

    // Dòng trên: Tên chương (CHƯƠNG 1 / CHAPTER 1)
    const chapterText = this.add
      .text(0, -toastH / 2 + 24, `${t('chapter_prefix').toUpperCase()} ${chapterNum}`, {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '14px',
        color: '#FFD23F',
        stroke: '#22145A',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    // Dòng dưới: Tiêu đề màn (Màn 1-3 · Cánh Chim Điềm Báo)
    const titleText = this.add
      .text(0, -toastH / 2 + 56, `${t('level_prefix')} ${this.level.id} · ${localizedTitle}`, {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '24px',
        color: '#FFFFFF',
        stroke: '#16215A',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    toastContainer.add([shadow, card, chapterText, titleText]);

    // Hoạt cảnh pop-in, giữ 1.25s rồi trôi lên và biến mất
    toastContainer.setScale(0.65);
    toastContainer.setAlpha(0);

    this.tweens.add({
      targets: toastContainer,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 380,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(1250, () => {
          this.tweens.add({
            targets: toastContainer,
            y: cy - 28,
            alpha: 0,
            scaleX: 0.95,
            scaleY: 0.95,
            duration: 320,
            ease: 'Quad.easeIn',
            onComplete: () => toastContainer.destroy(),
          });
        });
      },
    });
  }

  /**
   * Tạo sóng lượng tử và chùm bụi sao khi chạm vào khoảng trống bầu trời
   */
  private spawnCosmicInteraction(x: number, y: number): void {
    const ripple = this.add.graphics().setDepth(DEPTH_TOKENS.backgroundSky + 4);
    const rippleData = { radius: 8, alpha: 0.85 };
    this.tweens.add({
      targets: rippleData,
      radius: 65,
      alpha: 0,
      duration: 500,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        ripple.clear();
        ripple.lineStyle(2.5, 0x7fd8ff, rippleData.alpha);
        ripple.strokeCircle(x, y, rippleData.radius);
      },
      onComplete: () => ripple.destroy(),
    });

    const colors = [0xffd23f, 0x7fd8ff, 0xffffff];
    for (let i = 0; i < 6; i++) {
      const p = this.add.graphics().setDepth(DEPTH_TOKENS.backgroundSky + 5);
      const col = colors[i % colors.length];
      p.fillStyle(col, 0.9);
      p.fillCircle(0, 0, 4);
      p.setPosition(x, y);

      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 50;

      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 450 + Math.random() * 200,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }
}
