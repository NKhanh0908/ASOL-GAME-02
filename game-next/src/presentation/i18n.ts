/**
 * Hệ thống đa ngôn ngữ (i18n) cho Mirror.
 * Hỗ trợ chuyển đổi tức thì giữa Tiếng Việt ('vi') và Tiếng Anh ('en').
 * Lưu trạng thái vào localStorage ('mirror.rebuild.locale').
 */

export type Locale = 'vi' | 'en';

const LOCALE_STORAGE_KEY = 'mirror.rebuild.locale';

export const TRANSLATIONS = {
  vi: {
    // MenuScene
    menu_subtitle: 'Ghép bóng hình · Bí ẩn giao thoa',
    btn_start: 'Bắt đầu',
    btn_continue: 'Tiếp tục',
    btn_replay: 'Chơi lại',
    btn_select_level: 'Chọn màn chơi',
    version_footer: 'Mirror v0.2.1 · Bản Thử Nghiệm Android',

    // SettingsDialog
    settings_title: 'Cài Đặt Chiêm Tinh',
    setting_show_target: 'Hình mẫu mờ trên bàn',
    setting_reduce_motion: 'Giảm chuyển động xoay',
    setting_haptics: 'Rung phản hồi khi snap',
    setting_language: 'Ngôn ngữ',
    setting_danger_reset: 'Xóa toàn bộ tiến trình chơi',
    reset_confirm_message: 'Bạn có chắc chắn muốn xóa toàn bộ tiến trình chơi?\nThao tác này không thể hoàn tác.',
    btn_cancel: 'Hủy',
    btn_confirm_delete: 'Xác nhận xóa',

    // PauseDialog
    pause_title: 'Tạm Dừng',
    pause_resume: 'Tiếp tục chơi',
    pause_restart: 'Chơi lại màn này',
    pause_level_select: 'Về danh sách màn chơi',

    // LevelSelectScene
    level_select_title: 'Chòm Sao Tiên Tri',
    level_prefix: 'Màn',

    // Gameplay & HUD
    snap_hint: 'Thả để khớp',
    match_count: '{matched}/{total} mảnh đã khớp',
    victory_title: 'Hoàn thành',
    victory_next: 'Màn tiếp theo',
    victory_level_select: 'Chọn màn',

    // Studio
    studio_brand: 'Alpaca Solutions',
  },
  en: {
    // MenuScene
    menu_subtitle: 'Silhouette Match · Parity Mystery',
    btn_start: 'Start',
    btn_continue: 'Continue',
    btn_replay: 'Replay',
    btn_select_level: 'Select Level',
    version_footer: 'Mirror v0.2.1 · Android Preview',

    // SettingsDialog
    settings_title: 'Astrology Settings',
    setting_show_target: 'Ghost silhouette on board',
    setting_reduce_motion: 'Reduce motion',
    setting_haptics: 'Haptic feedback on snap',
    setting_language: 'Language',
    setting_danger_reset: 'Reset all game progress',
    reset_confirm_message: 'Are you sure you want to reset all game progress?\nThis action cannot be undone.',
    btn_cancel: 'Cancel',
    btn_confirm_delete: 'Confirm Reset',

    // PauseDialog
    pause_title: 'Paused',
    pause_resume: 'Resume',
    pause_restart: 'Restart Level',
    pause_level_select: 'Level Select',

    // LevelSelectScene
    level_select_title: 'Prophecy Constellations',
    level_prefix: 'Level',

    // Gameplay & HUD
    snap_hint: 'Release to snap',
    match_count: '{matched}/{total} pieces matched',
    victory_title: 'Completed',
    victory_next: 'Next Level',
    victory_level_select: 'Select Level',

    // Studio
    studio_brand: 'Alpaca Solutions',
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.vi;

/** Bản đồ tên màn chơi tiếng Anh tương ứng với campaign */
export const LEVEL_TITLES_EN: Record<string, string> = {
  '1-1': 'Twin Stars',
  '1-2': 'Prophecy Tower',
  '1-3': 'Omen Bird Wings',
  '1-4': 'Lighthouse',
  '1-5': 'Starship',
  '1-6': 'Dawn Crown',

  '2-1': 'Skyward Arrow',
  '2-2': 'Butterfly Shadow',
  '2-3': 'Crystal Heart',
  '2-4': 'Prophecy Eye',
  '2-5': 'Hourglass',
  '2-6': 'Amulet Seal',

  '3-1': 'Sun & Moon Eclipse',
  '3-2': 'Prophecy Temple',
  '3-3': 'Celestial Koi',
  '3-4': 'The Candle',
  '3-5': 'Sunset Sailboat',
  '3-6': 'Sacred Cat',
  '3-7': 'Lotus Flower',
  '3-8': 'Solar Eclipse Pyramid',
  '3-9': 'Eight-Pointed Star',
  '3-10': 'Celestial Mandala',

  '4-1': 'Wind Compass',
  '4-2': 'Celestial Blade',
  '4-3': 'Astrological Bow',
  '4-4': 'Wheel of Fate',
  '4-5': 'Celestial Cross',
  '4-6': 'Grand Prophecy Seal',
};

let currentLocale: Locale = (() => {
  if (typeof window === 'undefined') return 'vi';
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved === 'vi' || saved === 'en') return saved;
  } catch {
    // Không truy cập được localStorage
  }
  return 'vi';
})();

const listeners = new Set<(locale: Locale) => void>();

/** Lấy ngôn ngữ hiện tại */
export function getLocale(): Locale {
  return currentLocale;
}

/** Đổi ngôn ngữ và thông báo tới các component đăng ký lắng nghe */
export function setLocale(locale: Locale): void {
  if (locale !== 'vi' && locale !== 'en') return;
  currentLocale = locale;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Tránh lỗi nếu bị chặn cookie/storage
  }
  listeners.forEach((listener) => listener(locale));
}

/** Đăng ký lắng nghe thay đổi ngôn ngữ */
export function onLocaleChange(listener: (locale: Locale) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Lấy chuỗi bản dịch theo key */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const dict = TRANSLATIONS[currentLocale] || TRANSLATIONS.vi;
  let text: string = dict[key] || TRANSLATIONS.vi[key] || key;

  if (params) {
    for (const [paramKey, paramVal] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
    }
  }

  return text;
}

/** Lấy tên màn chơi theo ngôn ngữ hiện tại */
export function getLevelTitle(levelId: string, fallbackTitle: string): string {
  if (currentLocale === 'en' && LEVEL_TITLES_EN[levelId]) {
    return LEVEL_TITLES_EN[levelId];
  }
  return fallbackTitle;
}
