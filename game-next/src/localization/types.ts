export type SupportedLocale = 'en-US' | 'vi' | 'id' | 'pt-BR' | 'ja';

export interface LocaleMetadata {
  readonly code: SupportedLocale;
  readonly shortLabel: string;
  readonly nativeName: string;
  readonly flagEmoji: string;
}

export type CommonTranslationKey =
  | 'btn_start'
  | 'btn_continue'
  | 'btn_replay'
  | 'btn_select_level'
  | 'version_footer'
  | 'settings_title'
  | 'setting_show_target'
  | 'setting_reduce_motion'
  | 'setting_music'
  | 'setting_sfx'
  | 'setting_haptics'
  | 'setting_language'
  | 'setting_danger_reset'
  | 'reset_confirm_message'
  | 'btn_cancel'
  | 'btn_confirm_delete'
  | 'pause_title'
  | 'pause_resume'
  | 'pause_restart'
  | 'pause_level_select'
  | 'level_select_title'
  | 'chapter_prefix'
  | 'level_prefix'
  | 'toast_level_locked'
  | 'toast_level_polishing'
  | 'map_sealed_continue'
  | 'map_sealed_chapter'
  | 'map_chapter_unlocked'
  | 'map_coming_soon'
  | 'snap_hint'
  | 'match_count'
  | 'victory_title'
  | 'victory_next'
  | 'victory_level_select'
  | 'btn_reset'
  | 'btn_rotate'
  | 'studio_brand'
  | 'lang_modal_title'
  | 'gate_endless'
  | 'gate_coming_soon';

export type CommonTranslations = Record<CommonTranslationKey, string>;

export interface GameTranslations {
  readonly chapters: Record<string, string>;
  readonly levelTitles: Record<string, string>;
  readonly taglines: readonly string[];
  readonly victoryVerses?: Record<string, string>;
  readonly chapterTaglines?: Record<string, string>;
  readonly galaxyTypes?: Record<string, string>;
}

export interface TranslationBundle {
  readonly common: CommonTranslations;
  readonly game: GameTranslations;
}
