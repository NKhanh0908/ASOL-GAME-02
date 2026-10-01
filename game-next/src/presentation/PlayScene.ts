import Phaser from 'phaser';
import type { Level } from '../domain/model.ts';
import { loadLevel } from '../content/catalog.ts';
import { campaignManifest } from '../content/manifest.ts';
import { nextLevelId } from '../domain/campaign.ts';
import { createProgressRepository } from '../infrastructure/progressRepository.ts';
import { PlayController } from '../application/playController.ts';
import { BoardRenderer } from './BoardRenderer.ts';
import { Hud } from './Hud.ts';
import { computeLayout } from './layout.ts';

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
  private starGraphics!: Phaser.GameObjects.Graphics;
  private stars: StarParticle[] = [];

  constructor() {
    super({ key: 'PlayScene' });
  }

  init(data: { levelId?: string; mode?: 'campaign' | 'harness' }): void {
    const levelId = data.levelId ?? '1-1';
    this.mode = data.mode ?? 'campaign';
    this.level = loadLevel(levelId, this.mode);
  }

  create(): void {
    const layout = computeLayout(this.scale.width, this.scale.height);

    // 1. Sao li ti nền galaxy
    this.starGraphics = this.add.graphics();
    this.stars = [];
    for (let i = 0; i < 40; i++) {
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

    this.hud = new Hud(this, `${this.level.id} · ${this.level.title}`, {
      onMenu: () => {
        this.scene.start('MenuScene');
      },
      onReset: () => {
        this.controller.onReset();
        this.refreshView();
      },
      onRotate: () => {
        this.controller.onRotate();
        this.refreshView();
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
    });

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
      this.controller.onPointerUp(pointer.x, pointer.y, layout);
      this.refreshView();
    });

    this.input.on('gameout', () => {
      this.controller.onPointerCancel();
      this.refreshView();
    });

    this.refreshView();
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
}
