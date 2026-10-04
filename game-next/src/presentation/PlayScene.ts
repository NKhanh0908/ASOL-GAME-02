import Phaser from 'phaser';
import type { Level } from '../domain/model.ts';
import { GRID_WIDTH, GRID_HEIGHT } from '../domain/model.ts';
import { loadLevel } from '../content/catalog.ts';
import { campaignManifest } from '../content/manifest.ts';
import { furthestLevelId, nextLevelId } from '../domain/campaign.ts';
import { createProgressRepository } from '../infrastructure/progressRepository.ts';
import { PlayController } from '../application/playController.ts';
import { BoardRenderer } from './BoardRenderer.ts';
import { maskCentroid } from '../domain/mask.ts';
import { Hud } from './Hud.ts';
import { applyDesignViewport } from './designViewport.ts';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from './viewport.ts';
import {
  computeLayout,
  gridToCanvas,
  pieceCenterCanvas,
  pieceHitbox,
  pieceRadiusPx,
} from './layout.ts';
import type { LayoutMetrics } from './layout.ts';

import { SkyBackdrop } from './SkyBackdrop.ts';
import { COLOR_TOKENS } from './designTokens.ts';
import { TextureFactory } from './TextureFactory.ts';

import { PauseDialog } from './PauseDialog.ts';
import { TargetBadge } from './TargetBadge.ts';

export class PlayScene extends Phaser.Scene {
  private level!: Level;
  private mode: 'campaign' | 'harness' = 'campaign';
  private controller!: PlayController;
  private boardRenderer!: BoardRenderer;
  private layout!: LayoutMetrics;
  private targetBadge!: TargetBadge;
  private hud!: Hud;
  private pauseDialog!: PauseDialog;
  private sky!: SkyBackdrop;
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
        this.scene.start('MenuScene');
      }
    }
  }

  create(): void {
    applyDesignViewport(this);
    TextureFactory.generateAll(this);
    // Hệ toạ độ thiết kế, không phải kích thước bộ đệm: camera zoom đã quy đổi.
    const layout = computeLayout(DESIGN_WIDTH, DESIGN_HEIGHT);
    this.layout = layout;

    // 1. Nền trời dùng chung
    this.sky = new SkyBackdrop(this, { seed: 2, drift: false });

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

    this.boardRenderer = new BoardRenderer(this, layout, this.level.pieces.length);
    this.targetBadge = new TargetBadge(this, layout, this.level);

    this.pauseDialog = new PauseDialog(this, {
      onResume: () => {},
      onRestart: () => {
        this.controller.onReset();
        this.cleanupCelebration();
        this.refreshView();
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
        this.controller.onReset();
        this.cleanupCelebration();
        this.boardRenderer.setVictoryMode(false);
        this.hud.hideWinModal();
        this.refreshView();
      },
      onRotate: () => {
        const transition = this.controller.onRotate();
        this.refreshView();
        if (transition?.becameWon) {
          this.playCelebration(layout);
        }
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
        if (nextId) {
          try {
            // Kiểm tra đúng chế độ: campaign về menu nếu màn kế chưa approved.
            loadLevel(nextId, this.mode);
            this.scene.start('PlayScene', {
              levelId: nextId,
              mode: this.mode,
              previewCompletedThrough: this.mode === 'harness'
                ? furthestLevelId(
                    campaignManifest,
                    this.previewCompletedThrough,
                    this.level.id
                  )
                : undefined,
            });
          } catch {
            this.scene.start('MenuScene');
          }
        } else {
          this.scene.start('MenuScene');
        }
      },
    }, this.level.id);

    // Pointer events
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const hit = this.controller.onPointerDown(pointer.worldX, pointer.worldY, layout);
      if (hit) {
        this.refreshView();
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.controller.onPointerMove(pointer.worldX, pointer.worldY, layout);
      this.refreshView();
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const transition = this.controller.onPointerUp(pointer.worldX, pointer.worldY, layout);
      this.refreshView();
      if (transition?.becameWon) {
        this.playCelebration(layout);
      }
    });

    this.input.on('pointerupoutside', (pointer: Phaser.Input.Pointer) => {
      const transition = this.controller.onPointerUp(pointer.worldX, pointer.worldY, layout);
      this.refreshView();
      if (transition?.becameWon) {
        this.playCelebration(layout);
      }
    });

    this.input.on('gameout', () => {
      this.controller.onPointerCancel();
      this.refreshView();
    });

    this.refreshView();

    if (this.controller.getSnapshot().phase === 'won') {
      this.boardRenderer.setVictoryMode(true);
      this.hud.showWinModal(this.level.victoryVerse);
    }

    // Chỉ dùng khi phát triển: tự kéo mảnh để chụp ảnh kiểm tra thị giác.
    // ?autosolve=win  -> đặt đủ mảnh, ra màn hoàn thành
    // ?autosolve=drag -> mảnh đầu đã khớp, mảnh sau đang được kéo gần đích
    if (import.meta.env.DEV) {
      const mode = new URLSearchParams(window.location.search).get('autosolve');
      if (mode === 'win' || mode === 'drag') this.autosolve(mode, layout);
    }
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

      const transition = this.controller.onPointerUp(target.x, target.y, layout);
      this.refreshView();
      if (transition?.becameWon) this.playCelebration(layout);
    });
  }

  update(_time: number, delta: number): void {
    this.sky.update(delta);
  }

  private refreshView(): void {
    const snapshot = this.controller.getSnapshot();
    const puzzleState = this.controller.getPuzzleState();

    this.boardRenderer.render(this.level, snapshot, puzzleState.pieces);
    this.hud.update(snapshot);

    // Nhãn "Thả để khớp" chỉ hiện khi mảnh đang kéo trúng vùng hít
    const drag = snapshot.dragInfo;
    if (drag && drag.snapCandidateId !== null) {
      const piece = this.level.pieces.find((p) => p.id === drag.pieceId);
      const radius = piece ? pieceRadiusPx(piece.frameSize, this.layout) : 120;
      this.hud.showSnapHint(drag.x + radius * 0.8, drag.y + radius * 0.5);
    } else {
      this.hud.hideSnapHint();
    }
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
    this.scene.start('LevelSelectScene', {
      mode: this.mode,
      previewCompletedThrough: this.mode === 'harness'
        ? furthestLevelId(
            campaignManifest,
            this.previewCompletedThrough,
            justCompleted
          )
        : undefined,
    });
  }

  public onHardwareBack(): void {
    if (this.pauseDialog.isOpen()) {
      this.pauseDialog.close();
    } else {
      this.pauseDialog.open();
    }
  }
}
