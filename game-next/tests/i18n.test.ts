import { describe, expect, test, beforeEach } from 'vitest';
import { getLocale, setLocale, t, getLevelTitle, onLocaleChange } from '../src/presentation/i18n.ts';

describe('i18n translation system', () => {
  beforeEach(() => {
    setLocale('vi');
  });

  test('mặc định là tiếng Việt', () => {
    expect(getLocale()).toBe('vi');
    expect(t('btn_start')).toBe('Bắt đầu');
    expect(t('level_select_title')).toBe('Chòm Sao Tiên Tri');
  });

  test('chuyển sang tiếng Anh thành công', () => {
    setLocale('en');
    expect(getLocale()).toBe('en');
    expect(t('btn_start')).toBe('Start');
    expect(t('level_select_title')).toBe('Prophecy Constellations');
    expect(t('pause_title')).toBe('Paused');
  });

  test('thay thế tham số động trong chuỗi', () => {
    setLocale('vi');
    expect(t('match_count', { matched: 2, total: 3 })).toBe('2/3 mảnh đã khớp');

    setLocale('en');
    expect(t('match_count', { matched: 2, total: 3 })).toBe('2/3 pieces matched');
  });

  test('dịch tên màn chơi theo ngôn ngữ', () => {
    setLocale('vi');
    expect(getLevelTitle('1-1', 'Song Tinh')).toBe('Song Tinh');

    setLocale('en');
    expect(getLevelTitle('1-1', 'Song Tinh')).toBe('Twin Stars');
    expect(getLevelTitle('9-9', 'Không Tồn Tại')).toBe('Không Tồn Tại');
  });

  test('listener nhận được thông báo khi đổi ngôn ngữ', () => {
    let notifiedLocale = '';
    const unsubscribe = onLocaleChange((loc) => {
      notifiedLocale = loc;
    });

    setLocale('en');
    expect(notifiedLocale).toBe('en');

    unsubscribe();
    setLocale('vi');
    expect(notifiedLocale).toBe('en'); // Không còn nhận vì đã unsubscribe
  });
});
