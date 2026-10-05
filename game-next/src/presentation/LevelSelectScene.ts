import Phaser from 'phaser';
import { campaignManifest } from '../content/manifest.ts';
import { levelAccess, resolveMapCompletedLevels } from '../domain/campaign.ts';
import type { LevelAccessMode } from '../domain/campaign.ts';
import type { Chapter } from '../domain/model.ts';
import { createProgressRepository } from '../infrastructure/progressRepository.ts';
import type { ProgressRepository } from '../application/progressPort.ts';
import { ANIM_TOKENS, COLOR_NUMBERS, COLOR_TOKENS, LAYOUT_TOKENS, TYPO_TOKENS } from './designTokens.ts';
import { TEXTURE_KEYS, TextureFactory } from './TextureFactory.ts';
import { applyDesignViewport, designSafeArea, designViewBounds } from './designViewport.ts';
import { formatProgress } from './hudText.ts';
import { layoutCampaignMap } from './constellationLayout.ts';
import { t, getLevelTitle, getChapterLabel } from './i18n.ts';
import { director } from './transitions/SceneDirector.ts';
import type { Choreographed, TransitionContext } from './transitions/SceneDirector.ts';
import type { TransitionTimeline } from './transitions/TransitionTimeline.ts';
import { applySteps, orderByDistance } from './transitions/choreography.ts';
import type { Parts, Poseable } from './transitions/choreography.ts';
import { MAP_OUT_TO_MENU, MAP_OUT_TO_PLAY, MAP_SPECIAL, mapIn } from './transitions/routes.ts';
import { playUiCue } from './audio/uiCues.ts';

type NodeInfo = {
  id: string;
  title: string;
  chapter: number;
  x: number;
  y: number;
  state: 'completed' | 'current' | 'unlocked' | 'locked';
  available: boolean;
};

/** Sắc độ nền từng chương, phủ rất nhẹ để nền trời vẫn lộ ra. */
const CHAPTER_TINTS: Readonly<Record<Chapter, { color: number; alpha: number }>> = {
  1: { color: 0x7fb8ff, alpha: 0.04 }, // Khởi Nguyên: xanh trời
  2: { color: 0xb48cff, alpha: 0.06 }, // Giao Thoa: tím giao thoa
  3: { color: 0x7ee0c8, alpha: 0.05 }, // Họa Phẩm: ngọc bích
  4: { color: 0xffb86b, alpha: 0.06 }, // Luân Chuyển: hổ phách hoàng hôn
};

export class LevelSelectScene extends Phaser.Scene implements Choreographed {
  readonly directorKey = 'LevelSelectScene' as const;
  private progressRepo!: ProgressRepository;
  private mapContainer!: Phaser.GameObjects.Container;
  private headerContainer!: Phaser.GameObjects.Container;
  private toastContainer?: Phaser.GameObjects.Container;
  private focusLevelId?: string;

  private nodeViews: Array<{ info: NodeInfo; container: Phaser.GameObjects.Container }> = [];
  private linkParts: Poseable[] = [];
  private tappedIndex: number | null = null;

  private mode: LevelAccessMode = 'campaign';
  private previewCompletedThrough?: string;

  private isDragging = false;
  private dragStartY = 0;
  private containerStartY = 0;
  private safe = { top: 0, right: 0, bottom: 0, left: 0 };
  private minY = -2000;
  private maxY = 0;

  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  init(data: { mode?: LevelAccessMode; previewCompletedThrough?: string; focusLevelId?: string } = {}): void {
    this.mode = data.mode ?? 'campaign';
    this.previewCompletedThrough = this.mode === 'harness'
      ? data.previewCompletedThrough
      : undefined;
    this.focusLevelId = data.focusLevelId;
  }

  create(): void {
    applyDesignViewport(this);
    this.safe = designSafeArea(this);
    TextureFactory.generateAll(this);

    this.progressRepo = createProgressRepository(localStorage, campaignManifest, 'oracle-v1');
    const { progress } = this.progressRepo.read();
    const mapCompleted = resolveMapCompletedLevels(
      campaignManifest,
      progress.completed,
      this.mode,
      this.previewCompletedThrough
    );

    // 2. Container bản đồ chòm sao có thể cuộn dọc
    this.mapContainer = this.add.container(0, 0).setDepth(10);

    // 3. Dựng chòm sao & đường nối Bezier
    const currentNode = this.buildConstellation(mapCompleted);

    // 4. Header cố định trên đỉnh có thanh tiến độ (Depth 80)
    this.headerContainer = this.add.container(0, 0).setDepth(80);
    this.buildHeader(mapCompleted.length, campaignManifest.length);

    // 5. Cài đặt cuộn / kéo mượt mà
    this.setupScrolling();

    // 6. Tự động cuộn tới node hiện tại (Auto-scroll to current node)
    if (currentNode) {
      const idealY = Phaser.Math.Clamp(540 - currentNode.y, this.minY, this.maxY);
      this.tweens.add({
        targets: this.mapContainer,
        y: idealY,
        duration: 750,
        ease: 'Cubic.easeOut',
      });
    }

    director.attach(this);
  }

  public goToMenu(): void {
    director.go(this, 'MenuScene', {}, { route: 'map-to-menu' });
  }

  private anchorIndex(): number {
    const current = this.nodeViews.findIndex((v) => v.info.state === 'current');
    return current >= 0 ? current : 0;
  }

  private transitionParts(anchor: number): Parts {
    const ordered = orderByDistance(this.nodeViews.map((v) => v.container), anchor);
    const tapped = this.nodeViews[anchor]?.container;
    return {
      header: [this.headerContainer],
      nodes: ordered,
      tappedNode: tapped ? [tapped] : [],
      otherNodes: ordered.filter((c) => c !== tapped),
      links: this.linkParts,
    };
  }

  playIn(tl: TransitionTimeline, ctx: TransitionContext): void {
    applySteps(tl, mapIn(ctx.from === 'PlayScene' ? 400 : 300), this.transitionParts(this.anchorIndex()), 'enter');
  }

  playOut(tl: TransitionTimeline, ctx: TransitionContext): void {
    if (ctx.route === 'map-to-play') {
      applySteps(tl, MAP_OUT_TO_PLAY, this.transitionParts(this.tappedIndex ?? this.anchorIndex()), 'exit');
      if (ctx.origin) this.expandRing(tl, ctx.origin);
    } else {
      applySteps(tl, MAP_OUT_TO_MENU, this.transitionParts(this.anchorIndex()), 'exit');
    }
  }

  /** Vòng sáng lan từ node vừa bấm tới bao trọn vị trí tấm bia của màn chơi */
  private expandRing(tl: TransitionTimeline, origin: { x: number; y: number }): void {
    const b = LAYOUT_TOKENS.board;
    const corners = [
      [b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height],
    ];
    const maxRadius = Math.max(...corners.map(([x, y]) => Math.hypot(x - origin.x, y - origin.y)));
    const ring = this.add.graphics().setDepth(200);
    const state = { radius: MAP_SPECIAL.ringStartRadius, alpha: 0.9 };
    const draw = () => {
      ring.clear();
      ring.fillStyle(COLOR_NUMBERS.icePrimary, state.alpha * 0.12);
      ring.fillCircle(origin.x, origin.y, state.radius);
      ring.lineStyle(3, COLOR_NUMBERS.icePrimary, state.alpha);
      ring.strokeCircle(origin.x, origin.y, state.radius);
    };
    draw();
    tl.at(0, state, { radius: maxRadius, alpha: 0.3 }, MAP_SPECIAL.ringMs, 'cubicOut', draw);
  }

  private buildHeader(completedCount: number, totalCount: number): void {
    // Header phủ từ mép trên thật xuống, kể cả phần dưới notch: nền phải liền
    // tới y=0 chứ không chỉ từ lề an toàn, nếu không sẽ hở một dải trời ở trên.
    const top = this.safe.top;
    const view = designViewBounds(this);

    // Nền header mờ dần xuống dưới (Soft gradient fade thay cho kẻ ngang)
    const headerBg = this.add.graphics();
    headerBg.fillStyle(COLOR_NUMBERS.skyTop, 0.96);
    headerBg.fillRect(0, 0, view.width, top + 96);

    // Gradient mờ dần trong 40 đơn vị kế tiếp
    for (let h = 0; h < 40; h++) {
      const alpha = 0.96 * (1 - h / 40);
      headerBg.fillStyle(COLOR_NUMBERS.skyTop, alpha);
      headerBg.fillRect(0, top + 96 + h, view.width, 1);
    }

    // Nút Menu tròn 80px (Vùng chạm 96px, chuẩn 1dp = 2px)
    const backBtn = this.add
      .image(56, top + 56, TEXTURE_KEYS.btnCircle80)
      .setSize(96, 96)
      .setInteractive({ useHandCursor: true });
    const backIcon = this.add.image(56, top + 56, TEXTURE_KEYS.iconMenuBack).setScale(1.25);
    backBtn.on('pointerdown', () => {
      playUiCue(this, 'tap');
      this.goToMenu();
    });

    // Tiêu đề trang 32px serif
    const headerTitle = this.add
      .text(360, top + 56, t('level_select_title'), {
        fontFamily: TYPO_TOKENS.fontFamily.serif,
        fontSize: '32px',
        color: COLOR_TOKENS.text.primary,
      })
      .setOrigin(0.5);

    // Huy hiệu tiến độ tổng ở góc phải (ví dụ: "✦ 1/18")
    const progressPill = this.add.container(640, 56);
    const pillBg = this.add.graphics();
    pillBg.fillStyle(COLOR_NUMBERS.boardSurfaceTop, 0.95);
    pillBg.fillRoundedRect(-52, -22, 104, 44, 22);
    pillBg.lineStyle(1.5, COLOR_NUMBERS.gridModule, 0.65);
    pillBg.strokeRoundedRect(-52, -22, 104, 44, 22);

    const progressText = this.add
      .text(0, 0, formatProgress(completedCount, totalCount), {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '20px',
        color: COLOR_TOKENS.amberGold.solidPrimary,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    progressPill.add([pillBg, progressText]);

    this.headerContainer.add([headerBg, backBtn, backIcon, headerTitle, progressPill]);
  }

  private buildConstellation(completedLevels: readonly string[]): NodeInfo | null {
    this.nodeViews = [];
    this.linkParts = [];

    // 1. Toạ độ nút và dải chương suy ra từ manifest (constellationLayout.ts)
    const layout = layoutCampaignMap(campaignManifest);
    const nodes: NodeInfo[] = layout.nodes.map((mapNode) => {
      const access = levelAccess(campaignManifest, completedLevels, mapNode.id, this.mode);
      let state: NodeInfo['state'] = 'locked';
      if (access.completed) {
        state = 'completed';
      } else if (access.unlocked && access.available) {
        state = 'current';
      } else if (access.unlocked && !access.available) {
        state = 'unlocked';
      }

      return {
        id: mapNode.id,
        title: mapNode.title,
        chapter: mapNode.chapter,
        x: mapNode.x,
        y: mapNode.y,
        state,
        available: access.available,
      };
    });
    const currentNode = nodes.find((n) => n.state === 'current') ?? null;

    // 2. Sắc độ riêng cho từng chương theo dải của bố cục
    const chBackdrop = this.add.graphics();
    for (const band of layout.chapters) {
      const tint = CHAPTER_TINTS[band.chapter];
      chBackdrop.fillStyle(tint.color, tint.alpha);
      chBackdrop.fillRect(0, band.top, 720, band.bottom - band.top);
    }
    this.mapContainer.add(chBackdrop);

    // 3. Vẽ các đường cong Bezier mềm mại kết nối chòm sao (B3)
    const linesGraphics = this.add.graphics();
    this.mapContainer.add(linesGraphics);
    this.linkParts.push(linesGraphics);

    for (let i = 0; i < nodes.length - 1; i++) {
      const p1 = nodes[i];
      const p2 = nodes[i + 1];

      // Xác định trạng thái đoạn đường:
      // Đoạn đã đi: p1 đã hoàn thành và p2 đã hoàn thành (hoặc p2 là current)
      const isPathWalked = p1.state === 'completed' && (p2.state === 'completed' || p2.state === 'current');

      const curve = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(p1.x, p1.y),
        new Phaser.Math.Vector2((p1.x + p2.x) / 2 + (p1.x > p2.x ? 25 : -25), (p1.y + p2.y) / 2),
        new Phaser.Math.Vector2(p2.x, p2.y)
      );

      const points = curve.getPoints(24);

      if (isPathWalked) {
        // Đoạn đã đi: Vàng đặc 4px có glow 8px
        linesGraphics.lineStyle(8, COLOR_NUMBERS.amberSolid, 0.22);
        for (let j = 0; j < points.length - 1; j++) {
          linesGraphics.lineBetween(points[j].x, points[j].y, points[j + 1].x, points[j + 1].y);
        }

        linesGraphics.lineStyle(4, COLOR_NUMBERS.amberSolid, 0.95);
        for (let j = 0; j < points.length - 1; j++) {
          linesGraphics.lineBetween(points[j].x, points[j].y, points[j + 1].x, points[j + 1].y);
        }

        // Đốm sáng chạy dọc đường. Phaser không có stroke-dashoffset như
        // mockup, nên mô phỏng bằng một chấm tween theo các điểm của đường.
        const spark = this.add.circle(points[0].x, points[0].y, 4, COLOR_NUMBERS.amberGlow, 0.9);
        this.mapContainer.add(spark);
        this.linkParts.push(spark);
        this.tweens.addCounter({
          from: 0,
          to: points.length - 1,
          duration: ANIM_TOKENS.duration.linkSweepMs,
          repeat: -1,
          onUpdate: (tween) => {
            const point = points[Math.round(tween.getValue() ?? 0)];
            if (point) spark.setPosition(point.x, point.y);
          },
        });
      } else {
        // Đoạn chưa tới: Xanh kính 25% opacity nét đứt
        linesGraphics.lineStyle(2, COLOR_NUMBERS.icePrimary, 0.35);
        for (let j = 0; j < points.length - 1; j += 2) {
          linesGraphics.lineBetween(points[j].x, points[j].y, points[j + 1].x, points[j + 1].y);
        }
      }
    }

    // 4. Tiêu đề phân đoạn Chương (B2: Bỏ thuật ngữ kỹ thuật, banner kính thanh lịch)
    for (const band of layout.chapters) {
      const chContainer = this.add.container(360, band.bannerY);
      // Mockup dùng chữ serif có hai gạch amber hai bên, không có nền
      const chText = this.add
        .text(0, 0, getChapterLabel(band.chapter), {
          fontFamily: TYPO_TOKENS.fontFamily.serif,
          fontSize: TYPO_TOKENS.fontSize.sectionHeader,
          color: COLOR_TOKENS.text.primary,
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      const chBg = this.add.graphics();
      chBg.lineStyle(1.5, COLOR_NUMBERS.gridModule, 0.5);
      const rule = 80;
      const gap = chText.width / 2 + 24;
      chBg.lineBetween(-gap - rule, 0, -gap, 0);
      chBg.lineBetween(gap, 0, gap + rule, 0);

      chContainer.add([chBg, chText]);
      this.mapContainer.add(chContainer);
      this.linkParts.push(chContainer);
    }

    // 5. Render từng Node màn chơi (B1, B4, B5: 72px canvas, touch 96px, chỉ hiện số)
    for (const node of nodes) {
      const nodeContainer = this.add.container(node.x, node.y);

      let textureKey: string = TEXTURE_KEYS.nodeLocked;
      if (node.state === 'completed') textureKey = TEXTURE_KEYS.nodeCompleted;
      else if (node.state === 'current') textureKey = TEXTURE_KEYS.nodeCurrent;
      else if (node.state === 'unlocked') textureKey = TEXTURE_KEYS.nodeUnlocked;

      // Hình nút hiển thị 72px, vùng chạm mở rộng 96x96px
      const nodeSprite = this.add
        .image(0, 0, textureKey)
        .setSize(96, 96)
        .setInteractive({ useHandCursor: node.state !== 'locked' });

      nodeContainer.add(nodeSprite);

      // Hiển thị số màn chơi rõ ràng
      if (node.state === 'completed') {
        // Màn đã xong: Số màn nhỏ dưới node
        const numText = this.add
          .text(0, 46, node.id, {
            fontFamily: TYPO_TOKENS.fontFamily.sans,
            fontSize: '18px',
            color: COLOR_TOKENS.amberGold.solidPrimary,
            fontStyle: 'bold',
          })
          .setOrigin(0.5);
        nodeContainer.add(numText);
      } else if (node.state === 'current') {
        // Node hiện tại: Thêm tween nhấp nháy phát quang hào quang
        this.tweens.add({
          targets: nodeSprite,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 750,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        // Số màn nổi bật ở tâm
        const numText = this.add
          .text(0, 0, node.id, {
            fontFamily: TYPO_TOKENS.fontFamily.sans,
            fontSize: '20px',
            color: COLOR_TOKENS.sky.stops[0],
            fontStyle: 'bold',
          })
          .setOrigin(0.5);
        nodeContainer.add(numText);

        // Huy hiệu tên màn đang chơi nổi bật phía dưới node (y = 56)
        const titleBadge = this.add.container(0, 56);
        const badgeBg = this.add.graphics();
        badgeBg.fillStyle(COLOR_NUMBERS.navyBackdrop, 0.95);
        badgeBg.fillRoundedRect(-130, -18, 260, 36, 18);
        badgeBg.lineStyle(1.5, COLOR_NUMBERS.amberSolid, 0.9);
        badgeBg.strokeRoundedRect(-130, -18, 260, 36, 18);

        const localizedTitle = getLevelTitle(node.id, node.title);
        const badgeText = this.add
          .text(0, 0, `✦ ${node.id} · ${localizedTitle} ✦`, {
            fontFamily: TYPO_TOKENS.fontFamily.sans,
            fontSize: '18px',
            color: COLOR_TOKENS.amberGold.solidPrimary,
            fontStyle: 'bold',
          })
          .setOrigin(0.5);

        titleBadge.add([badgeBg, badgeText]);
        nodeContainer.add(titleBadge);

        // Tween nhịp thở nhẹ nhàng cho nhãn màn hiện tại
        this.tweens.add({
          targets: titleBadge,
          y: 60,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      } else if (node.state === 'unlocked') {
        const numText = this.add
          .text(0, 0, node.id, {
            fontFamily: TYPO_TOKENS.fontFamily.sans,
            fontSize: '20px',
            color: COLOR_TOKENS.iceGlass.bevelHighlight,
            fontStyle: 'bold',
          })
          .setOrigin(0.5);
        nodeContainer.add(numText);
      } else {
        // Node khóa: Số màn mờ bên dưới
        const numText = this.add
          .text(0, 44, node.id, {
            fontFamily: TYPO_TOKENS.fontFamily.sans,
            fontSize: '16px',
            color: COLOR_TOKENS.text.secondary,
          })
          .setOrigin(0.5)
          .setAlpha(0.5);
        nodeContainer.add(numText);
      }

      // Xử lý sự kiện chạm
      nodeSprite.on('pointerdown', () => {
        if (node.state === 'locked') {
          playUiCue(this, 'locked');
          this.showToast(t('toast_level_locked', { id: node.id }));
        } else if (!node.available) {
          playUiCue(this, 'locked');
          this.showToast(t('toast_level_polishing', { id: node.id }));
        } else {
          playUiCue(this, 'node');
          this.tappedIndex = this.nodeViews.findIndex((v) => v.info.id === node.id);
          director.go(this, 'PlayScene', {
            levelId: node.id,
            mode: this.mode,
            previewCompletedThrough: this.previewCompletedThrough,
          }, {
            route: 'map-to-play',
            origin: { x: node.x, y: node.y + this.mapContainer.y },
          });
        }
      });

      this.mapContainer.add(nodeContainer);
      this.nodeViews.push({ info: node, container: nodeContainer });
    }

    // Giới hạn cuộn cho bản đồ
    this.minY = Math.min(0, designViewBounds(this).height - layout.totalHeight);

    // Dev có thể cuộn tới màn bất kỳ qua ?focus=<id>; mặc định là màn hiện tại
    const focusNode = this.focusLevelId ? nodes.find((n) => n.id === this.focusLevelId) : undefined;
    return focusNode ?? currentNode;
  }

  private setupScrolling(): void {
    // worldY chứ không phải y: camera có zoom nên toạ độ màn hình không còn
    // trùng toạ độ thiết kế, dùng nhầm thì ngưỡng header và quãng cuộn đều lệch.
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.worldY > this.safe.top + 100) {
        this.isDragging = true;
        this.dragStartY = pointer.worldY;
        this.containerStartY = this.mapContainer.y;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const dy = pointer.worldY - this.dragStartY;
        let targetY = this.containerStartY + dy;
        targetY = Phaser.Math.Clamp(targetY, this.minY, this.maxY);
        this.mapContainer.y = targetY;
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    this.input.on('pointerupoutside', () => {
      this.isDragging = false;
    });
  }

  private showToast(message: string): void {
    if (this.toastContainer) this.toastContainer.destroy();

    this.toastContainer = this.add.container(360, 1160).setDepth(100);

    const bg = this.add.graphics();
    bg.fillStyle(COLOR_NUMBERS.navyBackdrop, 0.95);
    bg.fillRoundedRect(-180, -26, 360, 52, 26);
    bg.lineStyle(1.5, COLOR_NUMBERS.amberSolid, 0.85);
    bg.strokeRoundedRect(-180, -26, 360, 52, 26);

    const toast = this.add
      .text(0, 0, message, {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '22px',
        color: COLOR_TOKENS.amberGold.solidPrimary,
      })
      .setOrigin(0.5);

    this.toastContainer.add([bg, toast]);

    this.tweens.add({
      targets: this.toastContainer,
      alpha: 0,
      delay: 1400,
      duration: 400,
      onComplete: () => {
        this.toastContainer?.destroy();
      },
    });
  }
}
