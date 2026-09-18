import Phaser from 'phaser';
import { LevelRepository } from '../domain/levelRepository';
import { levels } from '../domain/levels';
import { evaluate } from '../domain/mask';
import { containsCell } from '../domain/shapes';
import { GRID_HEIGHT, GRID_WIDTH, type PieceDefinition, type Placement } from '../domain/types';
import { drawBackdrop } from './backdrop';
import {
  createPiece,
  draftToRecord,
  validateDraft,
  type CustomLevelDraft,
  type ShapeKind,
} from './customLevelEditor';
import { clearMaskCells, drawMask, drawPiece, overlapPreviewCells, pieceSize } from './draw';
import { LAYOUT } from './layout';
import { THEME } from './theme';

type PlacedPiece = {
  id: string;
  kind: ShapeKind;
  piece: PieceDefinition;
  x: number; // grid coordinate
  y: number; // grid coordinate
};

type DragState = {
  id: string;
  view: Phaser.GameObjects.Graphics;
  pointerId: number;
  offsetX: number;
  offsetY: number;
};

export class CustomLevelScene extends Phaser.Scene {
  private sourceLevelId = '1-1';
  private editId: string | undefined;
  private levelTitle = 'Màn tự tạo';
  private createdAt: number | undefined;
  private targetMask!: Uint8Array;

  private pieces: PlacedPiece[] = [];
  private selectedPieceId: string | undefined;
  private pieceViews = new Map<string, Phaser.GameObjects.Graphics>();
  private pieceDepth = new Map<string, number>();
  private nextDepth = 10;
  private dragging: DragState | undefined;

  private ghost!: Phaser.GameObjects.Graphics;
  private composite!: Phaser.GameObjects.Graphics;
  private statusText!: Phaser.GameObjects.Text;
  private titleLabel!: Phaser.GameObjects.Text;
  private saveButton!: Phaser.GameObjects.Container;
  private deletePieceBtn!: Phaser.GameObjects.Container;
  private pieceCountText!: Phaser.GameObjects.Text;

  constructor() {
    super('CustomLevel');
  }

  init(data: { sourceLevelId: string; editId?: string }): void {
    this.sourceLevelId = data?.sourceLevelId ?? '1-1';
    this.editId = data?.editId;
    this.selectedPieceId = undefined;
    this.dragging = undefined;
    this.pieces = [];
    this.pieceViews.clear();
    this.pieceDepth.clear();
    this.nextDepth = 10;

    const source = LevelRepository.get(this.sourceLevelId) ?? levels[0];
    this.targetMask = evaluate(source, source.solution);

    if (this.editId) {
      const existing = LevelRepository.get(this.editId);
      if (existing) {
        this.levelTitle = existing.title;
        this.createdAt = (existing as any).createdAt;
        // Reconstruct placed pieces
        this.pieces = existing.pieces.map((p) => {
          const sol = existing.solution.find((s) => s.pieceId === p.id);
          const kind = this.inferKind(p);
          return {
            id: p.id,
            kind,
            piece: p,
            x: sol?.x ?? 0,
            y: sol?.y ?? 0,
          };
        });
        return;
      }
    }

    // New custom level starting from source template
    this.levelTitle = `Custom · ${source.id}`;
    this.createdAt = Date.now();
    this.pieces = source.pieces.map((p) => {
      const sol = source.solution.find((s) => s.pieceId === p.id);
      const kind = this.inferKind(p);
      return {
        id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind,
        piece: createPiece(kind, p.id),
        x: sol?.x ?? 20,
        y: sol?.y ?? 20,
      };
    });
  }

  private inferKind(p: PieceDefinition): ShapeKind {
    const maxX = Math.max(...p.cells.map(([x]) => x)) + 1;
    if (maxX === 24) return 'smallTriangle';
    if (p.cells.length === 48 * 48) return 'square';
    if (containsCell(p.cells, 24, 0)) return 'triangle';
    return 'diamond';
  }

  create(): void {
    drawBackdrop(this);

    // Top navigation bar
    this.createButton(80, 50, 120, 50, '< Menu', THEME.blue, THEME.board, () => {
      this.scene.start('LevelMenu');
    }, 16);

    this.titleLabel = this.add.text(360, 48, this.levelTitle, {
      fontFamily: 'Arial',
      fontSize: '22px',
      fontStyle: 'bold',
      color: THEME.text,
    }).setOrigin(0.5, 0.5);

    this.createButton(640, 50, 110, 50, 'Đổi tên', THEME.gold, THEME.board, () => {
      this.promptRename();
    }, 15);

    this.add.text(360, 96, `Mẫu bóng mục tiêu: ${this.sourceLevelId}  ·  Kéo để đặt vị trí lời giải`, {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: THEME.muted,
    }).setOrigin(0.5, 0);

    // Board Graphics
    this.ghost = this.add.graphics().setDepth(1).setPosition(LAYOUT.boardX, LAYOUT.boardY);
    this.composite = this.add.graphics().setDepth(2).setPosition(LAYOUT.boardX, LAYOUT.boardY);
    drawMask(this.ghost, this.targetMask, LAYOUT.cell, 0, 0, true);

    // Setup pieces
    this.pieces.forEach((p) => this.spawnPieceView(p));

    // Shape Palette Header & Count
    this.add.text(48, 946, 'THÊM MẢNH GHÉP (TỐI ĐA 8):', {
      fontFamily: 'Arial',
      fontSize: '15px',
      fontStyle: 'bold',
      color: THEME.blueText,
      letterSpacing: 1,
    });

    this.pieceCountText = this.add.text(672, 946, `${this.pieces.length}/8`, {
      fontFamily: 'Arial',
      fontSize: '15px',
      fontStyle: 'bold',
      color: THEME.muted,
    }).setOrigin(1, 0);

    // 4 Shape Palette Buttons
    this.createButton(114, 995, 150, 56, '+ Vuông', THEME.blue, THEME.board, () => this.addPiece('square'), 16);
    this.createButton(278, 995, 150, 56, '+ Δ Lớn', THEME.blue, THEME.board, () => this.addPiece('triangle'), 16);
    this.createButton(442, 995, 150, 56, '+ Δ Nhỏ', THEME.blue, THEME.board, () => this.addPiece('smallTriangle'), 16);
    this.createButton(606, 995, 150, 56, '+ Thoi', THEME.blue, THEME.board, () => this.addPiece('diamond'), 16);

    // Validation Status Bar
    this.statusText = this.add.text(360, 1070, '', {
      fontFamily: 'Arial',
      fontSize: '18px',
      fontStyle: 'bold',
      color: THEME.text,
      align: 'center',
    }).setOrigin(0.5, 0.5).setDepth(15);

    // Action Controls
    this.deletePieceBtn = this.createButton(160, 1140, 240, 60, 'Xóa mảnh đã chọn', THEME.danger, 0x220808, () => {
      this.deleteSelectedPiece();
    }, 16);
    this.deletePieceBtn.setVisible(false);

    this.saveButton = this.createButton(480, 1140, 240, 60, 'LƯU & CHƠI', THEME.gold, 0x251c02, () => {
      this.saveAndPlay();
    }, 18);

    // Bottom hint
    this.add.text(360, 1220, 'Nhấp vào mảnh để chọn/xóa · Kéo để căn chỉnh vị trí', {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: THEME.muted,
    }).setOrigin(0.5, 0.5);

    // Input events
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointermove', this.onMove, this);
      this.input.off('pointerup', this.onUp, this);
    });

    this.refresh();
  }

  private promptRename(): void {
    const entered = window.prompt('Nhập tên custom level:', this.levelTitle);
    if (entered && entered.trim().length > 0) {
      this.levelTitle = entered.trim();
      this.titleLabel.setText(this.levelTitle);
      this.refresh();
    }
  }

  private addPiece(kind: ShapeKind): void {
    if (this.pieces.length >= 8) {
      this.statusText.setText('Đã đạt giới hạn tối đa 8 mảnh');
      this.statusText.setColor(THEME.dangerText);
      return;
    }

    const id = `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const def = createPiece(kind, id);
    const placed: PlacedPiece = {
      id,
      kind,
      piece: def,
      x: 40,
      y: 72,
    };
    this.pieces.push(placed);
    this.selectedPieceId = id;
    this.spawnPieceView(placed);
    this.refresh();
  }

  private deleteSelectedPiece(): void {
    if (!this.selectedPieceId) return;
    const id = this.selectedPieceId;
    this.pieces = this.pieces.filter((p) => p.id !== id);
    const view = this.pieceViews.get(id);
    if (view) {
      view.destroy();
      this.pieceViews.delete(id);
    }
    this.pieceDepth.delete(id);
    this.selectedPieceId = undefined;
    this.refresh();
  }

  private spawnPieceView(p: PlacedPiece): void {
    const depth = this.nextDepth++;
    const px = LAYOUT.boardX + p.x * LAYOUT.cell;
    const py = LAYOUT.boardY + p.y * LAYOUT.cell;
    const view = this.add.graphics({ x: px, y: py }).setDepth(depth);
    this.pieceViews.set(p.id, view);
    this.pieceDepth.set(p.id, depth);

    const { width, height } = pieceSize(p.piece);
    drawPiece(view, p.piece, LAYOUT.cell, 'placed');
    view.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width * LAYOUT.cell, height * LAYOUT.cell),
      (_area: unknown, localX: number, localY: number) =>
        containsCell(p.piece.cells, localX / LAYOUT.cell, localY / LAYOUT.cell)
    );

    view.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.selectedPieceId = p.id;
      const topDepth = this.nextDepth++;
      view.setDepth(topDepth);
      this.pieceDepth.set(p.id, topDepth);
      this.dragging = {
        id: p.id,
        view,
        pointerId: pointer.id,
        offsetX: pointer.x - view.x,
        offsetY: pointer.y - view.y,
      };
      this.refresh();
    });
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    if (!this.dragging || pointer.id !== this.dragging.pointerId) return;
    const targetX = pointer.x - this.dragging.offsetX;
    const targetY = pointer.y - this.dragging.offsetY;

    // Grid snap during drag
    const piece = this.pieces.find((p) => p.id === this.dragging!.id)!;
    const { width, height } = pieceSize(piece.piece);

    let gx = Math.round((targetX - LAYOUT.boardX) / LAYOUT.cell);
    let gy = Math.round((targetY - LAYOUT.boardY) / LAYOUT.cell);

    gx = Math.max(0, Math.min(GRID_WIDTH - width, gx));
    gy = Math.max(0, Math.min(GRID_HEIGHT - height, gy));

    piece.x = gx;
    piece.y = gy;
    this.dragging.view.setPosition(LAYOUT.boardX + gx * LAYOUT.cell, LAYOUT.boardY + gy * LAYOUT.cell);
    this.refresh();
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    if (this.dragging && pointer.id === this.dragging.pointerId) {
      this.dragging = undefined;
      this.refresh();
    }
  }

  private getDraft(): CustomLevelDraft {
    const solution: Placement[] = this.pieces.map((p) => ({
      pieceId: p.id,
      x: p.x,
      y: p.y,
    }));
    return {
      id: this.editId,
      sourceLevelId: this.sourceLevelId,
      title: this.levelTitle,
      pieces: this.pieces.map((p) => p.piece),
      solution,
      createdAt: this.createdAt,
    };
  }

  private refresh(): void {
    this.pieceCountText.setText(`${this.pieces.length}/8`);

    // Transparency overlaps calculation
    const transparentByPiece = this.collectTransparency();
    for (const p of this.pieces) {
      const view = this.pieceViews.get(p.id);
      if (view) {
        view.setPosition(LAYOUT.boardX + p.x * LAYOUT.cell, LAYOUT.boardY + p.y * LAYOUT.cell);
        const transparent = transparentByPiece.get(p.id);
        drawPiece(view, p.piece, LAYOUT.cell, 'placed', transparent);
      }
    }

    // Composite preview
    const compositeMask = this.compositePreview(transparentByPiece);
    drawMask(this.composite, compositeMask, LAYOUT.cell);

    // Validation
    const draft = this.getDraft();
    const validation = validateDraft(draft, this.targetMask);

    if (validation.ok) {
      this.statusText.setText('✓ Hợp lệ! Khớp 100% bóng mục tiêu');
      this.statusText.setColor(THEME.goldText);
      this.saveButton.setAlpha(1);
    } else {
      this.statusText.setText(`✗ ${validation.reason}`);
      this.statusText.setColor(THEME.dangerText);
      this.saveButton.setAlpha(0.45);
    }

    // Selected piece delete button visibility
    this.deletePieceBtn.setVisible(this.selectedPieceId !== undefined);
  }

  private collectTransparency(): Map<string, Set<string>> {
    const transparentByPiece = new Map(this.pieces.map((p) => [p.id, new Set<string>()]));
    for (let i = 0; i < this.pieces.length; i++) {
      const first = this.pieces[i];
      for (let j = i + 1; j < this.pieces.length; j++) {
        const second = this.pieces[j];
        const overlap = overlapPreviewCells(
          first.piece.cells,
          first.x,
          first.y,
          second.piece.cells,
          second.x,
          second.y
        );
        for (const cell of overlap.dragged) transparentByPiece.get(first.id)!.add(cell);
        for (const cell of overlap.underneath) transparentByPiece.get(second.id)!.add(cell);
      }
    }
    return transparentByPiece;
  }

  private compositePreview(transparentByPiece: Map<string, Set<string>>): Uint8Array {
    const draft = this.getDraft();
    let preview = evaluate(
      {
        id: 'draft',
        title: draft.title,
        pieces: draft.pieces,
        solution: draft.solution,
      },
      draft.solution
    );

    for (const p of this.pieces) {
      const transparent = transparentByPiece.get(p.id)!;
      if (!transparent || !transparent.size) continue;
      preview = clearMaskCells(preview, transparent, p.x, p.y, GRID_WIDTH);
    }
    return preview;
  }

  private saveAndPlay(): void {
    const draft = this.getDraft();
    const validation = validateDraft(draft, this.targetMask);
    if (!validation.ok) {
      this.statusText.setText(`Không thể lưu: ${validation.reason}`);
      this.statusText.setColor(THEME.dangerText);
      return;
    }

    const record = draftToRecord(draft, this.editId, this.createdAt);
    LevelRepository.save(record);
    this.scene.start('Mirror', { levelId: record.id });
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
    background.on('pointerdown', action);

    const label = this.add
      .text(0, 0, text, {
        fontFamily: 'Arial',
        fontSize: `${fontSize}px`,
        fontStyle: 'bold',
        color: strokeColor === THEME.gold ? '#ffe28a' : THEME.text,
      })
      .setOrigin(0.5);

    return this.add.container(x, y, [background, label]).setDepth(20);
  }
}
