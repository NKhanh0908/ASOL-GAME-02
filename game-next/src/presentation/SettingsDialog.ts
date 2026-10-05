import { Capacitor } from '@capacitor/core';
import Phaser from 'phaser';
import type { ProgressRepository } from '../application/progressPort.ts';
import { COLOR_NUMBERS, COLOR_TOKENS, TYPO_TOKENS } from './designTokens.ts';
import { designViewBounds } from './designViewport.ts';
import { TEXTURE_KEYS } from './TextureFactory.ts';
import { t, getLocale, setLocale } from './i18n.ts';
import { setMotionScale } from './transitions/motion.ts';
import { audioServices } from './audio/audioServices.ts';

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

    // 2. Tấm bia cài đặt (460 x 560) phong cách thẻ bài chiêm tinh
    const modalW = 460;
    const modalH = 560;
    const panel = this.scene.add.graphics();

    // Lớp bóng đổ mềm
    panel.fillStyle(0x050a1a, 0.65);
    panel.fillRoundedRect(-modalW / 2 + 4, -modalH / 2 + 8, modalW, modalH, 28);

    // Thân thẻ kính saphire đậm
    panel.fillStyle(0x131b4d, 0.98);
    panel.fillRoundedRect(-modalW / 2, -modalH / 2, modalW, modalH, 28);

    // Viền kép ngọc băng và vàng chiêm tinh
    panel.lineStyle(3.5, 0x7fd8ff, 0.9);
    panel.strokeRoundedRect(-modalW / 2, -modalH / 2, modalW, modalH, 28);
    panel.lineStyle(1.2, 0xffd23f, 0.45);
    panel.strokeRoundedRect(-modalW / 2 + 6, -modalH / 2 + 6, modalW - 12, modalH - 12, 22);

    // 3. Tiêu đề
    const title = this.scene.add
      .text(0, -modalH / 2 + 42, t('settings_title'), {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '28px',
        color: '#FFD23F',
        stroke: '#22145A',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Nút đóng "X" dạng kẹo tròn 3D
    const closeBtnBg = this.scene.add.graphics();
    closeBtnBg.fillStyle(0x0e1438, 1.0);
    closeBtnBg.fillCircle(modalW / 2 - 36, -modalH / 2 + 42 + 2, 18);
    closeBtnBg.fillStyle(0x273677, 1.0);
    closeBtnBg.fillCircle(modalW / 2 - 36, -modalH / 2 + 42, 18);
    closeBtnBg.lineStyle(2, 0x7fd8ff, 0.9);
    closeBtnBg.strokeCircle(modalW / 2 - 36, -modalH / 2 + 42, 18);

    const closeBtn = this.scene.add
      .image(modalW / 2 - 36, -modalH / 2 + 42, TEXTURE_KEYS.iconClose)
      .setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.close());

    this.container.add([backdrop, panel, title, closeBtnBg, closeBtn]);

    // 4. Hàng chọn Ngôn ngữ (Language Switcher Row)
    this.createLanguageRow(-modalH / 2 + 100);

    // 5. Các tùy chọn Toggle
    let showTarget = this.progressRepo.read().progress.settings.showTarget;

    // Toggle 1: Bóng mục tiêu
    this.createToggleRow(
      -modalH / 2 + 156,
      t('setting_show_target'),
      showTarget,
      (val) => {
        showTarget = val;
        this.progressRepo.setShowTarget(showTarget);
      }
    );

    // Toggle 2: Giảm chuyển động
    this.createToggleRow(
      -modalH / 2 + 212,
      t('setting_reduce_motion'),
      this.progressRepo.read().progress.settings.reducedMotion,
      (on) => {
        this.progressRepo.setReducedMotion(on);
        setMotionScale(on ? 0 : 1);
      }
    );

    const audio = audioServices(this.scene);
    const audioSettings = this.progressRepo.read().progress.settings;

    // Background music: fades out and pauses when off (spec G §5.1)
    this.createToggleRow(-modalH / 2 + 268, 'Nhạc nền', audioSettings.music, (on) => {
      this.progressRepo.setMusic(on);
      audio.music.setEnabled(on);
    });

    // Sound effects
    this.createToggleRow(-modalH / 2 + 324, 'Hiệu ứng âm thanh', audioSettings.sfx, (on) => {
      this.progressRepo.setSfx(on);
      audio.sfx.setEnabled(on);
    });

    // Toggle 3: Rung phản hồi — Android WebView không đáng tin ở navigator.vibrate,
    // nên hiện khi chạy native (plugin Haptics) hoặc trình duyệt có vibrate
    const canVibrate =
      Capacitor.isNativePlatform() || (typeof navigator !== 'undefined' && 'vibrate' in navigator);
    if (canVibrate) {
      this.createToggleRow(
        -modalH / 2 + 380,
        t('setting_haptics'),
        this.progressRepo.read().progress.settings.haptics,
        (on) => {
          this.progressRepo.setHaptics(on);
        }
      );
    }

    // 6. Khu vực nguy hiểm: Xóa tiến trình chơi (tách biệt dưới đáy dạng badge)
    const dangerY = modalH / 2 - 52;
    const dangerBox = this.scene.add.graphics();
    dangerBox.fillStyle(0x3d101e, 0.45);
    dangerBox.fillRoundedRect(-165, dangerY - 22, 330, 44, 22);
    dangerBox.lineStyle(1.4, 0xe65a5a, 0.65);
    dangerBox.strokeRoundedRect(-165, dangerY - 22, 330, 44, 22);

    const resetProgressBtn = this.scene.add
      .text(0, dangerY, `⚠️  ${t('setting_danger_reset')}`, {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '15px',
        color: '#FFA8A8',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    resetProgressBtn.on('pointerdown', () => {
      this.showDeleteConfirmation();
    });

    this.container.add([dangerBox, resetProgressBtn]);
  }

  /**
   * Hàng chọn ngôn ngữ Song ngữ Tiếng Việt | English với 3D Pill Slider
   */
  private createLanguageRow(y: number): void {
    if (!this.container) return;

    const current = getLocale();

    const rowLabel = this.scene.add
      .text(-190, y, t('setting_language'), {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '17px',
        color: '#FFFFFF',
      })
      .setOrigin(0, 0.5);

    // Pill Selector: [ VI ] [ EN ]
    const pillW = 126;
    const pillH = 38;
    const pillX = 132;

    const pillBg = this.scene.add.graphics();
    pillBg.fillStyle(0x0e153b, 1.0);
    pillBg.fillRoundedRect(pillX - pillW / 2, y - pillH / 2, pillW, pillH, 19);
    pillBg.lineStyle(1.6, 0x3b4a82, 0.85);
    pillBg.strokeRoundedRect(pillX - pillW / 2, y - pillH / 2, pillW, pillH, 19);

    // Tab hoạt động (Active Pill) nổi khối 3D vàng hổ phách
    const activeBg = this.scene.add.graphics();
    const isVi = current === 'vi';
    const activeX = isVi ? pillX - pillW / 2 + 2 : pillX;
    const activeW = pillW / 2 - 2;

    activeBg.fillStyle(0xffa800, 1.0);
    activeBg.fillRoundedRect(activeX, y - pillH / 2 + 2, activeW, pillH - 4, 17);
    activeBg.fillStyle(0xffd54f, 0.95);
    activeBg.fillRoundedRect(activeX + 1, y - pillH / 2 + 2, activeW - 2, (pillH - 4) * 0.6, 15);
    activeBg.lineStyle(1.8, 0x3b2779, 1.0);
    activeBg.strokeRoundedRect(activeX, y - pillH / 2 + 2, activeW, pillH - 4, 17);

    // Nửa bên chọn VI (x: pillX - 30)
    const viText = this.scene.add
      .text(pillX - 31, y, 'VI', {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '16px',
        color: isVi ? '#22145A' : '#7A89B8',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    viText.on('pointerdown', () => {
      if (getLocale() !== 'vi') {
        setLocale('vi');
        this.close();
        this.open();
        if ('buildMainMenu' in this.scene) {
          (this.scene as any).buildMainMenu(this.progressRepo.read().progress.completed);
        }
      }
    });

    // Nửa bên chọn EN (x: pillX + 30)
    const enText = this.scene.add
      .text(pillX + 31, y, 'EN', {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '16px',
        color: !isVi ? '#22145A' : '#7A89B8',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    enText.on('pointerdown', () => {
      if (getLocale() !== 'en') {
        setLocale('en');
        this.close();
        this.open();
        if ('buildMainMenu' in this.scene) {
          (this.scene as any).buildMainMenu(this.progressRepo.read().progress.completed);
        }
      }
    });

    this.container.add([rowLabel, pillBg, activeBg, viText, enText]);
  }

  /**
   * Công tắc gạt 3D Juicy Switch
   */
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
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '16px',
        color: '#FFFFFF',
      })
      .setOrigin(0, 0.5);

    // Switch Track bo tròn dày dặn
    const trackW = 58;
    const trackH = 32;
    const switchX = 158;

    const track = this.scene.add.graphics();
    const thumb = this.scene.add.graphics();

    const drawSwitch = () => {
      track.clear();
      thumb.clear();

      if (isChecked) {
        // Track màu vàng hổ phách nổi khối
        track.fillStyle(0xffa800, 1.0);
        track.fillRoundedRect(switchX - trackW / 2, y - trackH / 2, trackW, trackH, 16);
        track.fillStyle(0xffd54f, 0.95);
        track.fillRoundedRect(switchX - trackW / 2 + 2, y - trackH / 2 + 2, trackW - 4, trackH * 0.55, 14);
        track.lineStyle(2.0, 0x3b2779, 1.0);
        track.strokeRoundedRect(switchX - trackW / 2, y - trackH / 2, trackW, trackH, 16);

        // Thumb tròn to nổi khối ở bên phải
        const thumbX = switchX + 13;
        thumb.fillStyle(0x140d33, 0.4);
        thumb.fillCircle(thumbX, y + 1.5, 12);
        thumb.fillStyle(0x22145a, 1.0);
        thumb.fillCircle(thumbX, y, 12);
        thumb.fillStyle(0xffffff, 0.75);
        thumb.fillCircle(thumbX - 3, y - 3, 3);
      } else {
        // Track tối màu khi tắt
        track.fillStyle(0x0e153b, 1.0);
        track.fillRoundedRect(switchX - trackW / 2, y - trackH / 2, trackW, trackH, 16);
        track.lineStyle(1.8, 0x3b4a82, 0.85);
        track.strokeRoundedRect(switchX - trackW / 2, y - trackH / 2, trackW, trackH, 16);

        // Thumb xám bạc ở bên trái
        const thumbX = switchX - 13;
        thumb.fillStyle(0x6d7ca8, 1.0);
        thumb.fillCircle(thumbX, y, 12);
        thumb.fillStyle(0xffffff, 0.5);
        thumb.fillCircle(thumbX - 3, y - 3, 3);
      }
    };

    drawSwitch();

    const hitZone = this.scene.add
      .zone(0, y, 420, 52)
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
      .rectangle(0, 0, 460, 560, COLOR_NUMBERS.navyBackdrop, 0.94)
      .setInteractive();

    const confirmText = this.scene.add
      .text(
        0,
        -40,
        t('reset_confirm_message'),
        {
          fontFamily: TYPO_TOKENS.fontFamily.display,
          fontSize: '16px',
          color: COLOR_TOKENS.text.primary,
          align: 'center',
          lineSpacing: 8,
        }
      )
      .setOrigin(0.5);

    // Nút Hủy (Khối kính băng)
    const cancelBtnBg = this.scene.add.graphics();
    cancelBtnBg.fillStyle(COLOR_NUMBERS.boardSurfaceTop, 1.0);
    cancelBtnBg.fillRoundedRect(-140, 40, 120, 48, 16);
    cancelBtnBg.lineStyle(1.8, COLOR_NUMBERS.icePrimary, 0.85);
    cancelBtnBg.strokeRoundedRect(-140, 40, 120, 48, 16);

    const cancelBtn = this.scene.add
      .text(-80, 64, t('btn_cancel'), {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '16px',
        color: COLOR_TOKENS.text.primary,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    cancelBtn.on('pointerdown', () => {
      confirmContainer.destroy();
    });

    // Nút Xác nhận xóa (Khối đỏ ruby 3D)
    const deleteBtnBg = this.scene.add.graphics();
    deleteBtnBg.fillStyle(0x7a1a1a, 1.0);
    deleteBtnBg.fillRoundedRect(20, 40, 120, 48, 16);
    deleteBtnBg.lineStyle(1.8, 0xe65a5a, 0.85);
    deleteBtnBg.strokeRoundedRect(20, 40, 120, 48, 16);

    const deleteBtn = this.scene.add
      .text(80, 64, t('btn_confirm_delete'), {
        fontFamily: TYPO_TOKENS.fontFamily.display,
        fontSize: '15px',
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
