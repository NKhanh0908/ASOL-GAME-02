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

export class PlayScene extends Phaser.Scene {
  private level!: Level;
  private mode: 'campaign' | 'harness' = 'campaign';
  private controller!: PlayController;
  private boardRenderer!: BoardRenderer;
  private hud!: Hud;

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

  private refreshView(): void {
    const snapshot = this.controller.getSnapshot();
    const puzzleState = this.controller.getPuzzleState();

    this.boardRenderer.render(this.level, snapshot, puzzleState.pieces);
    this.hud.update(snapshot);
  }
}
