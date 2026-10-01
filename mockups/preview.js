// Xử lý chuyển đổi Tab trên đỉnh
const tabButtons = document.querySelectorAll('.tab-btn');
const screenViews = document.querySelectorAll('.screen-view');
const gameplayStatesBar = document.getElementById('gameplayStatesBar');

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabButtons.forEach((b) => b.classList.remove('active'));
    screenViews.forEach((v) => v.classList.remove('active'));

    btn.classList.add('active');
    const tabName = btn.getAttribute('data-tab');
    const targetView = document.getElementById(`view-${tabName}`);
    if (targetView) targetView.classList.add('active');

    // Chỉ hiện thanh 5 trạng thái khi ở tab gameplay
    if (tabName === 'gameplay') {
      gameplayStatesBar.style.display = 'flex';
    } else {
      gameplayStatesBar.style.display = 'none';
    }
  });
});

// Xử lý 5 trạng thái của Gameplay
const stateChips = document.querySelectorAll('.state-chip');
const dynamicPiecesContainer = document.getElementById('gp-dynamic-pieces');

const RENDER_STATES = {
  // Trạng thái 1: Đã Snap (2 viên thoi vàng chạm đỉnh tại 360, 568)
  snapped: `
    <!-- Mảnh D1 bên trái -->
    <polygon points="280,488 360,568 280,648 200,568" fill="#FFC857" stroke="#FFE8A6" stroke-width="2"/>
    <line x1="280" y1="488" x2="280" y2="648" stroke="#FFE8A6" stroke-width="1" stroke-opacity="0.3"/>
    <line x1="200" y1="568" x2="360" y2="568" stroke="#FFE8A6" stroke-width="1" stroke-opacity="0.3"/>

    <!-- Mảnh D2 bên phải -->
    <polygon points="440,488 520,568 440,648 360,568" fill="#FFC857" stroke="#FFE8A6" stroke-width="2"/>
    <line x1="440" y1="488" x2="440" y2="648" stroke="#FFE8A6" stroke-width="1" stroke-opacity="0.3"/>
    <line x1="360" y1="568" x2="520" y2="568" stroke="#FFE8A6" stroke-width="1" stroke-opacity="0.3"/>

    <!-- Điểm chạm đỉnh tiếp giáp (64, 96 logic) -->
    <circle cx="360" cy="568" r="4" fill="#FFFFFF"/>
  `,

  // Trạng thái 2: Đang kéo (Dragging - Mảnh nhấc lên phóng to 1.06x, có bóng đổ)
  dragging: `
    <!-- Mảnh D1 đã snap nằm sẵn trên bàn -->
    <polygon points="280,488 360,568 280,648 200,568" fill="#FFC857" stroke="#FFE8A6" stroke-width="2"/>

    <!-- Hào quang sáng quanh neo A của mảnh D2 -->
    <circle cx="440" cy="568" r="95" fill="none" stroke="#FFE8A6" stroke-width="2" stroke-dasharray="8,6" opacity="0.8"/>

    <!-- Mảnh D2 đang bị kéo: Phóng to 1.06x tại x=480, y=720 -->
    <!-- Bóng đổ mềm -->
    <polygon points="488,642 573,727 488,812 403,727" fill="#000000" fill-opacity="0.45"/>
    <!-- Thân mảnh -->
    <polygon points="480,635 565,720 480,805 395,720" fill="#FFC857" stroke="#FFE8A6" stroke-width="2.8"/>
  `,

  // Trạng thái 3: Giao nhau 2 lớp (Overlap Inversion - Vùng giao thoa bị triệt tiêu sang màu mặt bia)
  overlap: `
    <!-- Mảnh 1 (Trái) -->
    <polygon points="320,488 400,568 320,648 240,568" fill="#FFC857" stroke="#FFE8A6" stroke-width="2"/>
    <!-- Mảnh 2 (Lồng sâu qua tâm) -->
    <polygon points="400,488 480,568 400,648 320,568" fill="#FFC857" stroke="#FFE8A6" stroke-width="2"/>

    <!-- VÙNG GIAO NHAU TRIỆT TIÊU QUANG HỌC (chuyển về màu mặt bia #101B32) -->
    <polygon points="360,528 400,568 360,608 320,568" fill="#101B32" stroke="#FFE8A6" stroke-width="1.8"/>
    <!-- Nhãn chú thích -->
    <text x="360" y="660" fill="#FFE8A6" font-family="'Be Vietnam Pro', sans-serif" font-size="13" text-anchor="middle">2 Lớp Giao = Triệt Tiêu (Rỗng)</text>
  `,

  // Trạng thái 4: Mảnh tạm (Temporary Placement - Viền nét đứt, opacity 0.6)
  temporary: `
    <!-- Mảnh D1 đã snap -->
    <polygon points="280,488 360,568 280,648 200,568" fill="#FFC857" stroke="#FFE8A6" stroke-width="2"/>

    <!-- Mảnh D2 thả lệch ngoài neo: viền đứt, mờ 60% -->
    <polygon points="490,440 570,520 490,600 410,520" fill="#FFC857" fill-opacity="0.6" stroke="#FFE8A6" stroke-width="2" stroke-dasharray="6,4"/>
    <text x="490" y="415" fill="#9DAFC7" font-family="'Be Vietnam Pro', sans-serif" font-size="12" text-anchor="middle">Chưa đặt — chưa tính vào hình</text>
  `,

  // Trạng thái 5: Hoàn thành (Victory Celebration - Vệt sáng chạy viền, ngôi sao phát sáng)
  victory: `
    <!-- Hai mảnh Song Tinh hoàn chỉnh -->
    <polygon points="280,488 360,568 280,648 200,568" fill="#FFC857" stroke="#FFE8A6" stroke-width="2.5"/>
    <polygon points="440,488 520,568 440,648 360,568" fill="#FFC857" stroke="#FFE8A6" stroke-width="2.5"/>

    <!-- Vệt sáng rực rỡ chạy quanh viền tấm bia -->
    <rect x="102" y="182" width="516" height="772" rx="38" fill="none" stroke="#FFE8A6" stroke-width="3" stroke-opacity="0.8"/>

    <!-- Ngôi sao 4 cánh phát sáng tại tâm (360, 568) -->
    <line x1="360" y1="544" x2="360" y2="592" stroke="#FFFFFF" stroke-width="2.5"/>
    <line x1="336" y1="568" x2="384" y2="568" stroke="#FFFFFF" stroke-width="2.5"/>
    <circle cx="360" cy="568" r="6" fill="#FFFFFF"/>

    <!-- Modal Chúc mừng chiến thắng -->
    <rect x="0" y="0" width="720" height="1280" fill="#050A1A" fill-opacity="0.8"/>
    <rect x="120" y="450" width="480" height="380" rx="28" fill="#101B32" stroke="#68B8DC" stroke-width="6"/>
    <rect x="128" y="458" width="464" height="364" rx="22" fill="none" stroke="#D4A359" stroke-width="1.5" stroke-opacity="0.5"/>

    <text x="360" y="525" fill="#FFC857" font-family="'Playfair Display', serif" font-size="26" font-weight="bold" text-anchor="middle">✦ Cổ Ngữ Thức Tỉnh ✦</text>
    <text x="360" y="585" fill="#EEF4FA" font-family="'Be Vietnam Pro', sans-serif" font-size="15" text-anchor="middle">Ánh sáng tinh tú đã soi chiếu cổ ngữ trọn vẹn!</text>

    <!-- Nút Màn tiếp theo -->
    <rect x="210" y="650" width="300" height="56" rx="18" fill="#FFC857"/>
    <text x="360" y="685" fill="#080E24" font-family="'Be Vietnam Pro', sans-serif" font-size="16" font-weight="bold" text-anchor="middle">Màn tiếp theo →</text>

    <!-- Nút Về màn hình chính -->
    <text x="360" y="760" fill="#9DAFC7" font-family="'Be Vietnam Pro', sans-serif" font-size="14" text-anchor="middle">Về màn hình chính</text>
  `,
};

function renderGameplayState(stateKey) {
  if (dynamicPiecesContainer && RENDER_STATES[stateKey]) {
    dynamicPiecesContainer.innerHTML = RENDER_STATES[stateKey];
  }
}

// Ban đầu hiển thị trạng thái snapped
renderGameplayState('snapped');

stateChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    stateChips.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    const stateKey = chip.getAttribute('data-state');
    renderGameplayState(stateKey);
  });
});
