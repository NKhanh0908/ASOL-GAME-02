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
    btn_start: 'Bắt đầu',
    btn_continue: 'Tiếp tục',
    btn_replay: 'Chơi lại',
    btn_select_level: 'Chọn màn chơi',
    version_footer: 'Mirror v0.2.1 · Nơi các vì sao hội tụ',

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
    chapter_prefix: 'Chương',
    level_prefix: 'Màn',
    toast_level_locked: 'Màn {id} chưa mở khóa',
    toast_level_polishing: 'Màn {id} đang được tinh chỉnh',

    // Gameplay & HUD
    snap_hint: 'Thả để khớp',
    match_count: '{matched}/{total} mảnh đã khớp',
    victory_title: 'Hoàn thành',
    victory_next: 'Màn tiếp theo',
    victory_level_select: 'Chọn màn',
    btn_reset: 'Đặt lại',
    btn_rotate: 'Xoay',

    // Studio
    studio_brand: 'Alpaca Solutions',
  },
  en: {
    // MenuScene
    btn_start: 'Start',
    btn_continue: 'Continue',
    btn_replay: 'Replay',
    btn_select_level: 'Select Level',
    version_footer: 'Mirror v0.2.1 · Where The Stars Gather',

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
    chapter_prefix: 'Chapter',
    level_prefix: 'Level',
    toast_level_locked: 'Level {id} is locked',
    toast_level_polishing: 'Level {id} is being polished',

    // Gameplay & HUD
    snap_hint: 'Release to snap',
    match_count: '{matched}/{total} pieces matched',
    victory_title: 'Completed',
    victory_next: 'Next Level',
    victory_level_select: 'Select Level',
    btn_reset: 'Reset',
    btn_rotate: 'Rotate',

    // Studio
    studio_brand: 'Alpaca Solutions',
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.vi;

/**
 * Các mẩu thiên văn ngắn thay cho dòng phụ đề cố định dưới logo menu.
 * Mỗi lần dựng lại menu sẽ bốc ngẫu nhiên một câu, để người chơi biết thêm
 * một điều về bầu trời. Giữ mỗi câu dưới ~46 ký tự để vừa một dòng 15px.
 */
export const MENU_TAGLINES: Record<Locale, readonly string[]> = {
  vi: [
    'Ánh sáng Mặt Trời mất 8 phút để tới Trái Đất',
    'Một ngày trên sao Kim dài hơn một năm của nó',
    'Mặt Trăng rời xa Trái Đất 3,8 cm mỗi năm',
    'Dải Ngân Hà có hơn 100 tỷ ngôi sao',
    'Sao Hỏa đỏ vì bụi oxit sắt phủ khắp bề mặt',
    'Sao Thổ có mật độ còn nhỏ hơn nước',
    'Một năm ánh sáng dài gần 9.500 tỷ km',
    'Một thìa sao neutron nặng hàng tỷ tấn',
    'Mặt Trời chiếm 99,8% khối lượng Hệ Mặt Trời',
    'Sao chổi Halley ghé qua mỗi 76 năm',
    'Vũ trụ đã 13,8 tỷ năm tuổi',
    'Thiên hà Tiên Nữ đang tiến về Dải Ngân Hà',
    'Sao Mộc có hơn 90 mặt trăng đã xác nhận',
    'Không gì thoát khỏi chân trời sự kiện hố đen',
    'Sao Bắc Cực gần như đứng yên trên bầu trời',
    'Mây trên sao Kim làm từ axit sunfuric',
    'Olympus Mons trên sao Hỏa cao gần 22 km',
    'Vết Đỏ Lớn của sao Mộc rộng hơn Trái Đất',
    'Một năm sao Hải Vương bằng 165 năm Trái Đất',
    'Nguyên tố trong cơ thể bạn sinh ra từ các vì sao',
  ],
  en: [
    'Sunlight takes 8 minutes to reach Earth',
    'A day on Venus is longer than its year',
    'The Moon drifts 3.8 cm farther every year',
    'The Milky Way holds over 100 billion stars',
    'Mars is red from iron oxide dust',
    'Saturn is less dense than water',
    'One light year is about 9,500 billion km',
    'A spoonful of neutron star weighs billions of tons',
    'The Sun holds 99.8% of the solar system mass',
    'Comet Halley passes by every 76 years',
    'The universe is 13.8 billion years old',
    'Andromeda is drifting toward the Milky Way',
    'Jupiter has more than 90 confirmed moons',
    'Nothing escapes a black hole event horizon',
    'Polaris barely moves in the night sky',
    'Venus has clouds made of sulfuric acid',
    'Olympus Mons on Mars is nearly 22 km tall',
    'Jupiter Great Red Spot is wider than Earth',
    'One year on Neptune lasts 165 Earth years',
    'The atoms in your body were forged in stars',
  ],
};

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

/** Bốc ngẫu nhiên một mẩu thiên văn theo ngôn ngữ hiện tại */
export function getRandomMenuTagline(): string {
  const list = MENU_TAGLINES[currentLocale] ?? MENU_TAGLINES.vi;
  return list[Math.floor(Math.random() * list.length)];
}

/** Lấy tên màn chơi theo ngôn ngữ hiện tại */
export function getLevelTitle(levelId: string, fallbackTitle: string): string {
  if (currentLocale === 'en' && LEVEL_TITLES_EN[levelId]) {
    return LEVEL_TITLES_EN[levelId];
  }
  return fallbackTitle;
}

/** Tên các chương theo ngôn ngữ */
export const CHAPTER_NAMES: Record<Locale, Record<number, string>> = {
  vi: {
    1: 'Khởi Nguyên',
    2: 'Giao Thoa',
    3: 'Họa Phẩm',
    4: 'Luân Chuyển',
  },
  en: {
    1: 'Genesis',
    2: 'Intersections',
    3: 'Pictures',
    4: 'Rotations',
  },
};

/** Lấy tên chương theo ngôn ngữ hiện tại */
export function getChapterName(chapter: number, fallbackName?: string): string {
  return CHAPTER_NAMES[currentLocale]?.[chapter] ?? fallbackName ?? CHAPTER_NAMES.vi[chapter] ?? `Chapter ${chapter}`;
}

/** Lấy nhãn đầy đủ của chương (ví dụ: "Chương I · Khởi Nguyên" hoặc "Chapter I · Genesis") */
export function getChapterLabel(chapter: number, fallbackName?: string): string {
  const roman = ['I', 'II', 'III', 'IV'][chapter - 1] ?? String(chapter);
  const prefix = t('chapter_prefix');
  const name = getChapterName(chapter, fallbackName);
  return `${prefix} ${roman} · ${name}`;
}

