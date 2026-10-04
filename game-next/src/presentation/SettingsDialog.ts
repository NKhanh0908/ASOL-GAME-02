import Phaser from 'phaser';
import type { ProgressRepository } from '../application/progressPort.ts';
import { COLOR_NUMBERS, COLOR_TOKENS, TYPO_TOKENS } from './designTokens.ts';
import { designViewBounds } from './designViewport.ts';
import { TEXTURE_KEYS } from './TextureFactory.ts';
import { t, getLocale, setLocale } from './i18n.ts';

export class SettingsDialog {
  private scene: Phaser.Scene;
  private progressRepo: ProgressRepository;
  private container?: Phaser.GameObjects.Container;
  private onCloseCallback?: () => void;

  constructor(scene: Phaser.Scene, progressRepo: ProgressRepository, onClose?: () => void) {
    this.scene = scene;
    this.progressRepo = progressRepo;
    this.onCloseCallback = onClose;
  }

  public open(): void {
    if (this.container) return;

    const view = designViewBounds(this.scene);
    this.container = this.scene.add.container(view.width / 2, view.height / 2).setDepth(150);

    // 1. Nền mờ 65%
    const backdrop = this.scene.add
      .rectangle(0, 0, view.width, view.height, COLOR_NUMBERS.navyBackdrop, 0.65)
      .setInteractive();
    backdrop.on('pointerdown', () => this.close());

    // 2. Tấm bia cài đặt (460 x 500)
    const modalW = 460;
    const modalH = 500;
    const panel = this.scene.add.graphics();
    panel.fillStyle(COLOR_NUMBERS.boardSurfaceTop, 0.98);
    panel.fillRoundedRect(-modalW / 2, -modalH / 2, modalW, modalH, 24);
    panel.lineStyle(4, COLOR_NUMBERS.icePrimary, 0.85);
    panel.strokeRoundedRect(-modalW / 2, -modalH / 2, modalW, modalH, 24);

    // Đường viền vàng mờ bên trong
    panel.lineStyle(1.2, COLOR_NUMBERS.gridModule, 0.35);
    panel.strokeRoundedRect(-modalW / 2 + 6, -modalH / 2 + 6, modalW - 12, modalH - 12, 18);

    // 3. Tiêu đề
    const title = this.scene.add
      .text(0, -modalH / 2 + 38, t('settings_title'), {
        fontFamily: TYPO_TOKENS.fontFamily.serif,
        fontSize: '22px',
        color: COLOR_TOKENS.amberGold.solidPrimary,
      })
      .setOrigin(0.5);

    // Nút đóng "X"
    const closeBtn = this.scene.add
      .image(modalW / 2 - 32, -modalH / 2 + 36, TEXTURE_KEYS.iconClose)
      .setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.close());

    this.container.add([backdrop, panel, title, closeBtn]);

    // 4. Hàng chọn Ngôn ngữ (Language Switcher Row)
    this.createLanguageRow(-modalH / 2 + 96);

    // 5. Các tùy chọn Toggle
    let showTarget = this.progressRepo.read().progress.settings.showTarget;

    // Toggle 1: Bóng mục tiêu
    this.createToggleRow(
      -modalH / 2 + 165,
      t('setting_show_target'),
      showTarget,
      (val) => {
        showTarget = val;
        this.progressRepo.setShowTarget(showTarget);
      }
    );

    // Toggle 2: Giảm chuyển động
    this.createToggleRow(
      -modalH / 2 + 230,
      t('setting_reduce_motion'),
      false,
      (_val) => {
        // Tùy chọn accessibility
      }
    );

    // Toggle 3: Rung phản hồi (nếu thiết bị hỗ trợ)
    const hasVibration = typeof navigator !== 'undefined' && 'vibrate' in navigator;
    if (hasVibration) {
      this.createToggleRow(
        -modalH / 2 + 295,
        t('setting_haptics'),
        true,
        (_val) => {}
      );
    }

    // 6. Khu vực nguy hiểm: Xóa tiến trình chơi (tách biệt dưới đáy)
    const dangerY = modalH / 2 - 50;
    const resetProgressBtn = this.scene.add
      .text(0, dangerY, t('setting_danger_reset'), {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '13px',
        color: COLOR_TOKENS.danger.warningText,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    resetProgressBtn.on('pointerdown', () => {
      this.showDeleteConfirmation();
    });

    this.container.add(resetProgressBtn);
  }

  /**
   * Hàng chọn ngôn ngữ Song ngữ Tiếng Việt | English
   */
  private createLanguageRow(y: number): void {
    if (!this.container) return;

    const current = getLocale();

    const rowLabel = this.scene.add
      .text(-190, y, t('setting_language'), {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '14px',
        color: COLOR_TOKENS.text.primary,
      })
      .setOrigin(0, 0.5);

    // Pill Selector: [ VI ] [ EN ]
    const pillW = 120;
    const pillH = 34;
    const pillX = 135;

    const pillBg = this.scene.add.graphics();
    pillBg.fillStyle(COLOR_NUMBERS.skyTop, 1.0);
    pillBg.fillRoundedRect(pillX - pillW / 2, y - pillH / 2, pillW, pillH, 17);
    pillBg.lineStyle(1.5, COLOR_NUMBERS.iceShadow, 0.8);
    pillBg.strokeRoundedRect(pillX - pillW / 2, y - pillH / 2, pillW, pillH, 17);

    // Nửa bên chọn VI (x: pillX - 30)
    const viSelected = current === 'vi';
    const viBg = this.scene.add.graphics();
    if (viSelected) {
      viBg.fillStyle(COLOR_NUMBERS.amberSolid, 1.0);
      viBg.fillRoundedRect(pillX - pillW / 2 + 2, y - pillH / 2 + 2, pillW / 2 - 2, pillH - 4, 15);
    }

    const viText = this.scene.add
      .text(pillX - 30, y, 'VI', {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '14px',
        color: viSelected ? '#22145A' : COLOR_TOKENS.text.secondary,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    viText.on('pointerdown', () => {
      if (getLocale() !== 'vi') {
        setLocale('vi');
        this.close();
        this.open();
        // Thông báo scene rebuild nếu có
        if ('buildMainMenu' in this.scene) {
          (this.scene as any).buildMainMenu((this.progressRepo.read().progress.completed));
        }
      }
    });

    // Nửa bên chọn EN (x: pillX + 30)
    const enSelected = current === 'en';
    const enBg = this.scene.add.graphics();
    if (enSelected) {
      enBg.fillStyle(COLOR_NUMBERS.amberSolid, 1.0);
      enBg.fillRoundedRect(pillX, y - pillH / 2 + 2, pillW / 2 - 2, pillH - 4, 15);
    }

    const enText = this.scene.add
      .text(pillX + 30, y, 'EN', {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '14px',
        color: enSelected ? '#22145A' : COLOR_TOKENS.text.secondary,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    enText.on('pointerdown', () => {
      if (getLocale() !== 'en') {
        setLocale('en');
        this.close();
        this.open();
        // Thông báo scene rebuild nếu có
        if ('buildMainMenu' in this.scene) {
          (this.scene as any).buildMainMenu((this.progressRepo.read().progress.completed));
        }
      }
    });

    this.container.add([rowLabel, pillBg, viBg, viText, enBg, enText]);
  }

  private createToggleRow(
    y: number,
    label: string,
    initialValue: boolean,
    onChange: (val: boolean) => void
  ): void {
    if (!this.container) return;

    let isChecked = initialValue;

    const rowLabel = this.scene.add
      .text(-190, y, label, {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '14px',
        color: COLOR_TOKENS.text.primary,
      })
      .setOrigin(0, 0.5);

    // Switch Track bo tròn
    const trackW = 56;
    const trackH = 28;
    const switchX = 160;

    const track = this.scene.add.graphics();
    const thumb = this.scene.add.graphics();

    const drawSwitch = () => {
      track.clear();
      track.fillStyle(isChecked ? COLOR_NUMBERS.amberSolid : COLOR_NUMBERS.skyTop, 1.0);
      track.fillRoundedRect(switchX - trackW / 2, y - trackH / 2, trackW, trackH, 14);
      track.lineStyle(1.5, isChecked ? COLOR_NUMBERS.amberGlow : COLOR_NUMBERS.iceShadow, 0.8);
      track.strokeRoundedRect(switchX - trackW / 2, y - trackH / 2, trackW, trackH, 14);

      thumb.clear();
      thumb.fillStyle(isChecked ? COLOR_NUMBERS.skyTop : COLOR_NUMBERS.textSecondary, 1.0);
      const thumbX = isChecked ? switchX + 13 : switchX - 13;
      thumb.fillCircle(thumbX, y, 10);
    };

    drawSwitch();

    const hitZone = this.scene.add
      .zone(0, y, 420, 48)
      .setInteractive({ useHandCursor: true });

    hitZone.on('pointerdown', () => {
      isChecked = !isChecked;
      drawSwitch();
      onChange(isChecked);
    });

    this.container.add([rowLabel, track, thumb, hitZone]);
  }

  /**
   * Hộp thoại xác nhận 2 bước cho thao tác xóa tiến trình nguy hiểm
   */
  private showDeleteConfirmation(): void {
    if (!this.container) return;

    const confirmContainer = this.scene.add.container(0, 0);

    const overlay = this.scene.add
      .rectangle(0, 0, 460, 500, COLOR_NUMBERS.navyBackdrop, 0.94)
      .setInteractive();

    const confirmText = this.scene.add
      .text(
        0,
        -40,
        t('reset_confirm_message'),
        {
          fontFamily: TYPO_TOKENS.fontFamily.sans,
          fontSize: '14px',
          color: COLOR_TOKENS.text.primary,
          align: 'center',
          lineSpacing: 6,
        }
      )
      .setOrigin(0.5);

    // Nút Hủy
    const cancelBtnBg = this.scene.add.graphics();
    cancelBtnBg.fillStyle(COLOR_NUMBERS.boardSurfaceTop, 1.0);
    cancelBtnBg.fillRoundedRect(-140, 40, 120, 44, 12);
    cancelBtnBg.lineStyle(1.5, COLOR_NUMBERS.icePrimary, 0.8);
    cancelBtnBg.strokeRoundedRect(-140, 40, 120, 44, 12);

    const cancelBtn = this.scene.add
      .text(-80, 62, t('btn_cancel'), {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '14px',
        color: COLOR_TOKENS.text.primary,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    cancelBtn.on('pointerdown', () => {
      confirmContainer.destroy();
    });

    // Nút Xác nhận xóa
    const deleteBtnBg = this.scene.add.graphics();
    deleteBtnBg.fillStyle(0x7a1a1a, 1.0);
    deleteBtnBg.fillRoundedRect(20, 40, 120, 44, 12);
    deleteBtnBg.lineStyle(1.5, 0xe65a5a, 0.8);
    deleteBtnBg.strokeRoundedRect(20, 40, 120, 44, 12);

    const deleteBtn = this.scene.add
      .text(80, 62, t('btn_confirm_delete'), {
        fontFamily: TYPO_TOKENS.fontFamily.sans,
        fontSize: '13px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    deleteBtn.on('pointerdown', () => {
      this.progressRepo.reset();
      confirmContainer.destroy();
      this.close();
      this.scene.scene.restart();
    });

    confirmContainer.add([overlay, confirmText, cancelBtnBg, cancelBtn, deleteBtnBg, deleteBtn]);
    this.container.add(confirmContainer);
  }

  public close(): void {
    if (this.container) {
      this.container.destroy();
      this.container = undefined;
      this.onCloseCallback?.();
    }
  }
}
