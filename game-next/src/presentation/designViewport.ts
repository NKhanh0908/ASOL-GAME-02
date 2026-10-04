import Phaser from 'phaser';
import { computeDesignView, DESIGN_HEIGHT, DESIGN_WIDTH } from './viewport.ts';
import type { DesignView } from './viewport.ts';

/**
 * Nối hệ toạ độ thiết kế vào một scene.
 *
 * Bộ đệm vẽ của game bằng số pixel vật lý (xem `viewport.ts`), nên nếu scene vẽ
 * thẳng vào đó thì mọi toạ độ 720x1280 sẽ nằm gọn ở góc trên trái. Camera zoom
 * đưa hệ toạ độ thiết kế trở lại: scene vẫn viết `360` là giữa màn, còn phần
 * rasterise diễn ra ở độ phân giải thiết bị.
 *
 * Gọi ở đầu `create()` của mọi scene, trước khi tạo đối tượng.
 */
export function applyDesignViewport(scene: Phaser.Scene): number {
  const designScale = scene.scale.width / DESIGN_WIDTH;
  const camera = scene.cameras.main;

  camera.setZoom(designScale);
  // Giữ khung thiết kế ở chính giữa. Màn hình dài hơn 9:16 sẽ lộ thêm vùng trên
  // và dưới khung — SkyBackdrop phủ nền sao ra đó để không thành dải đen.
  camera.centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);

  installCrispText(scene, designScale);

  return designScale;
}

/**
 * Vùng toạ độ thiết kế mà scene thật sự nhìn thấy, tính từ bộ đệm của game.
 *
 * Suy ra từ kích thước bộ đệm chứ không đọc `camera.worldView`, vì worldView
 * chỉ được cập nhật ở lần preRender đầu tiên — tức là sau `create()`.
 */
export function designViewBounds(scene: Phaser.Scene): DesignView {
  return computeDesignView(scene.scale.width, scene.scale.height);
}

/**
 * Buộc mọi `scene.add.text` rasterise ở độ phân giải thiết bị.
 *
 * Phaser dựng chữ thành texture ở đúng cỡ font rồi mới để camera phóng lên, nên
 * nếu không nâng `resolution` thì chữ là thứ nhòe rõ nhất trên máy dpr cao.
 * Ghi đè factory một lần ở đây thay vì sửa 41 chỗ gọi `.text(...)`; mỗi scene có
 * một GameObjectFactory riêng nên việc ghi đè không rò sang scene khác.
 */
function installCrispText(scene: Phaser.Scene, resolution: number): void {
  const factory = scene.add;
  const original = factory.text.bind(factory);

  factory.text = ((
    x: number,
    y: number,
    text: string | string[],
    style?: Phaser.Types.GameObjects.Text.TextStyle
  ) => original(x, y, text, { resolution, ...style })) as typeof factory.text;
}
