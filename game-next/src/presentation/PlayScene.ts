import Phaser from 'phaser';
import type { Level } from '../domain/model.ts';
import { loadLevel } from '../content/catalog.ts';
import { campaignManifest } from '../content/manifest.ts';
import { nextLevelId } from '../domain/campaign.ts';
import { createProgressRepository } from '../infrastructure/progressRepository.ts';
import { PlayController } from '../application/playController.ts';
import { BoardRenderer } from './BoardRenderer.ts';
import { Hud } from './Hud.ts';
import { computeLayout, gridToCanvas } from './layout.ts';
import type { LayoutMetrics } from './layout.ts';

import { TextureFactory } from './TextureFactory.ts';

import { PauseDialog } from './PauseDialog.ts';

type StarParticle = {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  speed: number;
  phase: number;
};

export class PlayScene extends Phaser.Scene {
  private level!: Level;
  private mode: 'campaign' | 'harness' = 'campaign';
  private controller!: PlayController;
  private boardRenderer!: BoardRenderer;
  private hud!: Hud;
  private pauseDialog!: PauseDialog;
  private starGraphics!: Phaser.GameObjects.Graphics;
  private stars: StarParticle[] = [];
  private celebrationContainer: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { levelId?: string; mode?: 'campaign' | 'harness' }): void {
    const levelId = data.levelId ?? '1-1';
    this.mode = data.mode ?? 'campaign';
    this.level = loadLevel(levelId, this.mode);
  }

  create(): void {
    TextureFactory.generateAll(this);
    const layout = computeLayout(this.scale.width, this.scale.height);

    // 1. Sao li ti nền galaxy
    this.starGraphics = this.add.graphics();
    this.stars = [];
    for (let i = 0; i < 30; i++) {
      this.stars.push({
        x: Phaser.Math.Between(10, 710),
        y: Phaser.Math.Between(10, 1270),
        r: Phaser.Math.FloatBetween(0.8, 2.2),
        baseAlpha: Phaser.Math.FloatBetween(0.15, 0.6),
        speed: Phaser.Math.FloatBetween(0.1, 0.3),
        phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
      });
    }

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

    this.boardRenderer = new BoardRenderer(this, layout);

    this.pauseDialog = new PauseDialog(this, {
      onResume: () => {},
      onRestart: () => {
        this.controller.onReset();
        this.cleanupCelebration();
        this.refreshView();
      },
      onLevelSelect: () => {
        this.scene.start('LevelSelectScene');
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
      onNextLevel: () => {
        const nextId = nextLevelId(campaignManifest, this.level.id);
        if (nextId) {
          try {
            loadLevel(nextId, 'harness');
            this.scene.start('PlayScene', { levelId: nextId });
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
      const hit = this.controller.onPointerDown(pointer.x, pointer.y, layout);
      if (hit) {
        this.refreshView();
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.controller.onPointerMove(pointer.x, pointer.y, layout);
      this.refreshView();
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const transition = this.controller.onPointerUp(pointer.x, pointer.y, layout);
      this.refreshView();
      if (transition?.becameWon) {
        this.playCelebration(layout);
      }
    });

    this.input.on('pointerupoutside', (pointer: Phaser.Input.Pointer) => {
      const transition = this.controller.onPointerUp(pointer.x, pointer.y, layout);
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
      this.hud.showWinModal();
    }
  }

  update(_time: number, delta: number): void {
    this.starGraphics.clear();
    for (const star of this.stars) {
      star.y += star.speed * (delta / 16);
      star.phase += 0.02;
      if (star.y > 1280) star.y = 0;

      const alpha = star.baseAlpha + Math.sin(star.phase) * 0.2;
      this.starGraphics.fillStyle(0xffffff, Phaser.Math.Clamp(alpha, 0.08, 0.8));
      this.starGraphics.fillCircle(star.x, star.y, star.r);
    }
  }

  private refreshView(): void {
    const snapshot = this.controller.getSnapshot();
    const puzzleState = this.controller.getPuzzleState();

    this.boardRenderer.render(this.level, snapshot, puzzleState.pieces);
    this.hud.update(snapshot);
  }

  private playCelebration(layout: LayoutMetrics): void {
    this.cleanupCelebration();

    const celebration = this.add.container(0, 0).setDepth(90);
    this.celebrationContainer = celebration;

    // 1. Ánh chớp sao starlight flash dịu nhẹ
    this.cameras.main.flash(350, 249, 199, 79, false);

    // Tọa độ tâm điểm tiếp giáp 2 hình thoi: (64, 96)
    const center = gridToCanvas(64, 96, layout);

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

    // 4. Dòng chữ chiêm tinh thức tỉnh
    const runeText = this.add
      .text(center.x, center.y - 120, '✦ CỔ NGỮ THỨC TỈNH ✦', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '26px',
        color: '#FFD166',
        fontStyle: 'bold',
        stroke: '#080E24',
        strokeThickness: 5,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: '#F9C74F',
          blur: 16,
          stroke: true,
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setScale(0.6)
      .setAlpha(0);

    celebration.add(runeText);

    this.tweens.add({
      targets: runeText,
      scale: 1,
      alpha: 1,
      y: center.y - 140,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // 5. Hoãn 1.5s để người chơi tận hưởng khoảnh khắc hoàn thành trước khi mở bảng modal
    this.time.delayedCall(1500, () => {
      this.tweens.add({
        targets: runeText,
        alpha: 0,
        duration: 400,
        ease: 'Linear',
      });
      this.hud.showWinModal();
    });
  }

  private cleanupCelebration(): void {
    if (this.celebrationContainer) {
      this.celebrationContainer.destroy();
      this.celebrationContainer = null;
    }
  }
}
