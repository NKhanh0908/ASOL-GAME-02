import Phaser from 'phaser';
import { campaignManifest } from '../content/manifest.ts';
import { levelAccess } from '../domain/campaign.ts';
import { createProgressRepository } from '../infrastructure/progressRepository.ts';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const progressRepo = createProgressRepository(localStorage, campaignManifest, 'oracle-v1');
    const { progress } = progressRepo.read();

    // 1. Tiêu đề
    this.add
      .text(360, 60, 'MIRROR · CHỌN CỔ NGỮ', {
        fontFamily: 'sans-serif',
        fontSize: '28px',
        color: '#FFC857',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(360, 95, 'Giải đố bóng hình & Quy luật giao thoa', {
        fontFamily: 'sans-serif',
        fontSize: '15px',
        color: '#9DAFC7',
      })
      .setOrigin(0.5);

    // 2. Danh sách 18 màn theo 3 chương
    let startY = 150;
    const chapters = [
      { id: 1, name: 'Chương 1: Khởi nguyên (Ghép tiếp giáp)' },
      { id: 2, name: 'Chương 2: Giao thoa (Triệt tiêu & Hồi sinh)' },
      { id: 3, name: 'Chương 3: Luân chuyển (Xoay định hướng)' },
    ];

    for (const ch of chapters) {
      // Header chương
      this.add
        .text(48, startY, ch.name, {
          fontFamily: 'sans-serif',
          fontSize: '18px',
          color: '#68B8DC',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5);
      startY += 36;

      const levelsInChapter = campaignManifest.filter((m) => m.chapter === ch.id);

      // Vẽ lưới 2 cột x 3 hàng cho 6 màn
      for (let i = 0; i < levelsInChapter.length; i++) {
        const item = levelsInChapter[i];
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cardX = 48 + col * 316;
        const cardY = startY + row * 92;

        const access = levelAccess(campaignManifest, progress.completed, item.id);
        // Trong M1, màn 1-1 ở trạng thái validated được mở chơi
        const isPlayable = access.unlocked && (access.available || item.id === '1-1');

        let statusText = '🔒 ĐÃ KHÓA';
        let statusColor = '#4A5568';
        let borderColor = 0x22324e;

        if (access.completed) {
          statusText = '✓ ĐÃ XONG';
          statusColor = '#FFC857';
          borderColor = 0xffc857;
        } else if (isPlayable) {
          statusText = '▶ SẴN SÀNG';
          statusColor = '#68B8DC';
          borderColor = 0x68b8dc;
        } else if (access.unlocked && !access.available) {
          statusText = 'Đang hoàn thiện';
          statusColor = '#9DAFC7';
          borderColor = 0x334460;
        }

        const cardBg = this.add.graphics();
        cardBg.fillStyle(0x101b32, 0.95);
        cardBg.fillRoundedRect(cardX, cardY, 304, 80, 8);
        cardBg.lineStyle(1.5, borderColor, isPlayable || access.completed ? 0.8 : 0.4);
        cardBg.strokeRoundedRect(cardX, cardY, 304, 80, 8);

        this.add
          .text(cardX + 16, cardY + 22, `${item.id} ${item.title}`, {
            fontFamily: 'sans-serif',
            fontSize: '16px',
            color: isPlayable || access.completed ? '#EEF4FA' : '#6A7D9B',
            fontStyle: 'bold',
          })
          .setOrigin(0, 0.5);

        this.add
          .text(cardX + 16, cardY + 54, statusText, {
            fontFamily: 'sans-serif',
            fontSize: '13px',
            color: statusColor,
          })
          .setOrigin(0, 0.5);

        if (isPlayable) {
          const hitArea = this.add
            .zone(cardX + 152, cardY + 40, 304, 80)
            .setInteractive({ useHandCursor: true });
          hitArea.on('pointerdown', () => {
            this.scene.start('PlayScene', { levelId: item.id });
          });
        }
      }

      startY += 3 * 92 + 30;
    }
  }
}
