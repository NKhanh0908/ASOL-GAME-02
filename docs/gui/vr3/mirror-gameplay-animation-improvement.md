# Mirror — Gameplay Animation & Game Feel Improvement

> Tổng hợp các đề xuất từ phần **“Gameplay — nơi animation quan trọng nhất”** trở xuống, tập trung vào animation, motion language, game feel, UX feedback và định hướng experiential identity cho Mirror.

---

## 1. Pick Up Animation

Khi người chơi chạm và nhấc một mảnh ghép, không nên chỉ đơn giản scale mảnh lên ngay lập tức.

Nên dùng một chuỗi animation ngắn theo kiểu:

```text
0 ms       touch
40 ms      scale 1.00 → 0.97
100 ms     scale 0.97 → 1.06
120 ms     shadow expands
```

Ý tưởng là tạo cảm giác:

**anticipation → lift**

Mảnh ghép sẽ có cảm giác như một vật thể thực sự có trọng lượng thay vì chỉ là sprite bám theo ngón tay.

---

## 2. Dragging

Trong quá trình kéo, mảnh ghép không nên bám cứng tuyệt đối vào vị trí ngón tay.

Có thể thêm một độ trễ rất nhỏ để tạo cảm giác đàn hồi:

```text
finger
   ↓
piece follows
8–16 ms delayed
```

Hoặc sử dụng spring interpolation:

```text
position += (target - position) × 0.35
```

Tuy nhiên cần giữ độ chính xác cao.

Mirror nên tạo cảm giác:

> **glass piece nhẹ nhưng chính xác**

Không nên để animation quá mềm hoặc quá “jelly”, vì điều đó có thể làm puzzle mất cảm giác kiểm soát.

---

## 3. Approaching Anchor

Một trong những microinteraction nên ưu tiên là phản hồi khi mảnh tiến gần vùng snap.

Khi piece bước vào snap radius:

```text
anchor
   ◌
   ◉
  ◉◆◉
   ◉
   ◌
```

Có thể hiển thị một **gravity field** hoặc vòng hút nhẹ quanh anchor.

Đồng thời mảnh bắt đầu:

```text
translation → anchor
rotation → stable
glow ↑
```

nhưng chưa snap ngay.

Điều này giúp người chơi **cảm nhận được lực hút trước khi thả mảnh**, khiến snap dễ hiểu và “đã tay” hơn.

---

## 4. Snap Animation

Thay vì chỉ kéo piece trực tiếp vào anchor:

```text
piece → anchor
```

nên sử dụng chuyển động có overshoot:

```text
piece
 ↓
overshoot 4–6 px
 ↓
return
 ↓
settle
```

Timing đề xuất:

```text
0–80 ms      attraction
80–120 ms    overshoot
120–180 ms   settle
```

Kèm theo:

```text
anchor ripple
ring expansion
tiny particles
bell note
haptic
```

Tổng animation nên nằm trong khoảng:

**200–250 ms**

Không nên kéo dài hơn vì snap là thao tác diễn ra thường xuyên.

---

# 5. XOR / Overlap Animation — Signature của Mirror

Đây là mechanic khác biệt nhất của Mirror và cũng nên là nơi đầu tư animation mạnh nhất.

Nếu hiện tại chỉ có:

> overlap → vùng biến mất

thì người chơi có thể hiểu luật, nhưng chưa chắc cảm thấy mechanic thực sự thú vị.

---

## 5.1. Hai lớp — vùng giao biến mất

Ví dụ:

```text
Piece A
████████

Piece B
   ███████

intersection
   ███
```

Không nên làm vùng intersection biến mất tức thì.

Có thể cho một wave ngắn khoảng **100–150 ms** chạy qua vùng giao:

```text
████▒▒░░
   ↓
████    ███
```

Một số hiệu ứng phù hợp:

- highlight chạy dọc đường biên vùng giao;
- vùng intersection fade/collapse về màu nền;
- để lại rim glow rất ngắn khoảng 100 ms.

Visual metaphor:

> **hai năng lượng triệt tiêu lẫn nhau**

---

## 5.2. Ba lớp — vùng giao hiện lại

Khi mảnh thứ ba làm vùng trước đó hiện lại, nên có animation rõ hơn:

```text
dark intersection
      ↓
tiny spark
      ↓
light expands
      ↓
amber restored
```

Duration phù hợp:

**180–250 ms**

Đây nên là một trong những “juicy moments” quan trọng của game.

Người chơi không chỉ nhìn thấy luật parity hoạt động, mà còn **cảm nhận được một vùng cổ ngữ đang được hồi sinh**.

---

# 6. Target Comparison

Target trên gameplay screen hiện tại tương đối nhỏ so với board.

Nên biến target thành một **Oracle Medallion** có hai trạng thái.

### Normal

```text
compact oracle medallion
```

### Touch / Hold

```text
scale 1.0 → 1.35
background slightly dims
target silhouette becomes crisp
```

Khi thả tay:

```text
1.35 → 1.0
```

Có thể giữ cơ chế Eye hiện tại nhưng cải thiện transition.

Khi Eye bật:

```text
current result    opacity 100 → 55%
target            opacity 0 → 35%
```

Nhờ vậy người chơi dễ nhìn:

- vùng đang thiếu;
- vùng đang thừa;
- vùng lệch khỏi silhouette mục tiêu.

Điều này không thay đổi gameplay rule, chỉ tăng readability.

---

# 7. Victory Animation

Victory hiện nên được xem như một **ritual hoàn thành cổ ấn**, không chỉ là hiệu ứng confetti rồi hiện modal.

Tổng thời lượng khoảng **2800 ms** vẫn phù hợp.

---

## Phase 1 — Recognition

**0–300 ms**

Khi silhouette đúng:

- Board freeze một nhịp.
- Grid giảm opacity.
- Piece glow tăng nhẹ.

```text
grid opacity ↓
piece glow ↑
```

---

## Phase 2 — Awakening

**300–900 ms**

Một pulse phát ra từ tâm silhouette:

```text
       ✦
     ↗ ↑ ↖
     → ◆ ←
     ↘ ↓ ↙
```

Sau đó:

- board border nhận ánh sáng;
- celestial ring tăng tốc nhẹ;
- glow truyền từ tâm ra ngoài.

---

## Phase 3 — Constellation

**900–1700 ms**

Star particle bay từ silhouette ra không gian xung quanh.

Một số ngôi sao có thể kết nối thành constellation gắn với level.

Không cần quá nhiều particle; chỉ vài điểm sáng có chủ đích.

---

## Phase 4 — Reward

**1700–2200 ms**

Hiển thị tên level:

> **Ngọn Nến**

Bên dưới có thể là một câu lore/ngạn ngữ ngắn, ví dụ:

> “Ánh sáng tồn tại vì bóng tối bao quanh nó.”

Mục tiêu là biến completion thành một moment có ý nghĩa thay vì chỉ báo “đã thắng”.

---

## Phase 5 — CTA

**2200–2800 ms**

CTA xuất hiện:

```text
Màn tiếp theo
```

Có thể fade + slide nhẹ từ dưới lên.

Toàn bộ choreography nên tạo cảm giác:

> **một cổ ấn vừa được hoàn thiện và thức tỉnh**

---

# 8. Motion Language

Không nên để mỗi animation dùng easing khác nhau ngẫu nhiên.

Nên xây một motion system thống nhất.

---

## 8.1. UI Motion

Dùng cho:

- button;
- modal;
- toggle;
- navigation.

Đề xuất:

```text
easeOutCubic
180–220 ms
```

---

## 8.2. Glass Motion

Dùng cho:

- glass panel;
- medallion;
- stele frame.

Đề xuất:

```text
easeOutQuart
250–350 ms
```

---

## 8.3. Magic Motion

Dùng cho:

- rune;
- constellation;
- shimmer;
- glow pulse.

Đề xuất:

```text
easeInOutSine
600–1400 ms
```

---

## 8.4. Physical Piece Motion

Dùng cho:

- drag;
- pickup;
- snap;
- settle.

Đề xuất:

```text
spring
damping ~0.7–0.8
```

Nhờ đó người chơi có thể vô thức phân biệt:

> UI là UI  
> kính là kính  
> phép thuật là phép thuật  
> piece là vật thể.

---

# 9. Typography Hierarchy

Typography hiện tại ổn nhưng hierarchy vẫn có thể rõ hơn.

Gameplay:

```text
Ngọn Nến
Chương III · Màn 3-4
```

Cách này tương đối hợp lý.

Tuy nhiên ở Level Select, những label như:

```text
✦ 3-4 · Ngọn Nến ✦
```

hơi nhiều ornament.

Nên tiết chế và để visual chịu trách nhiệm trang trí.

Ví dụ:

```text
Ngọn Nến
3-4 · Họa Phẩm
```

Nguyên tắc:

> **UI copy nên đơn giản; decoration nằm trong visual.**

Không cần cả text lẫn ornament cùng cạnh tranh sự chú ý.

---

# 10. Những thứ không nên thêm

Để tránh over-design, không nên thêm quá nhiều:

- particle;
- bloom toàn màn;
- lens flare;
- background chuyển động nhanh;
- shader distortion liên tục;
- particle trail dài khi kéo;
- screen shake thường xuyên;
- blur nặng.

Mirror nên giữ cảm giác:

> **mystical + calm + tactile**

Không nên biến thành một game trình diễn VFX.

---

# 11. Khi nào animation nên xuất hiện

Animation nên chia thành ba nhóm.

---

## 11.1. Continuous Animation

Chỉ nên dùng cho:

```text
background stars
nebula drift
celestial ring
selected level pulse
```

Chuyển động phải cực chậm.

---

## 11.2. Interaction Animation

Chỉ xuất hiện khi:

```text
tap
drag
snap
rotate
overlap
reset
```

Đây là feedback trực tiếp cho hành động người chơi.

---

## 11.3. Reward Animation

Mạnh nhất ở:

```text
mechanic discovery
level unlock
chapter completion
victory
```

Reward animation phải hiếm hơn để giữ giá trị cảm xúc.

---

# 12. Priority triển khai

Không cần redesign toàn bộ cùng lúc.

Nên triển khai theo mức ảnh hưởng.

| Priority | Hạng mục | Impact |
|---|---|---:|
| **P0** | Snap animation + attraction | ★★★★★ |
| **P0** | XOR disappearance / restoration animation | ★★★★★ |
| **P0** | Victory choreography | ★★★★★ |
| **P0** | Gameplay visual hierarchy | ★★★★★ |
| **P1** | Level unlock constellation animation | ★★★★☆ |
| **P1** | Target medallion redesign | ★★★★☆ |
| **P1** | Board depth / glass material | ★★★★☆ |
| **P1** | Reduce tray visual weight | ★★★★☆ |
| **P2** | Menu hero XOR animation | ★★★☆☆ |
| **P2** | Background parallax | ★★★☆☆ |
| **P2** | Chapter transition | ★★★☆☆ |
| **P3** | Extra particles / decorative polish | ★★☆☆☆ |

---

# 13. Trải nghiệm cảm xúc mong muốn

## 5 giây đầu ở Menu

Người chơi nên nghĩ:

> “Game này đẹp, thư giãn, hơi huyền bí.”

---

## 10 giây đầu Gameplay

Người chơi nên cảm thấy:

> “Ồ, kéo mảnh khá đã.”

---

## Khi Snap

Người chơi nên có phản ứng:

> “Nice.”

---

## Khi lần đầu gặp XOR

Người chơi nên hiểu:

> “À, hai hình chồng nhau thì phần đó biến mất.”

---

## Khi 3 layer hồi sinh

Người chơi nên nhận ra:

> “Ồ, mechanic này hay.”

---

## Khi Victory

Người chơi nên cảm thấy:

> “Mình vừa hoàn thiện một cổ ấn.”

Nếu đạt được các cảm giác trên, Mirror sẽ không chỉ là một puzzle có UI đẹp mà bắt đầu có **experiential identity riêng**.

---

# 14. Experiential Identity — Celestial Artifact Awakening

Triết lý animation xuyên suốt nên là:

> **Celestial Artifact Awakening**

Flow tổng thể:

```text
Idle
 ↓
Interaction
 ↓
Energy response
 ↓
Alignment
 ↓
Awakening
 ↓
Constellation progression
```

Người chơi không chỉ đang ghép hình.

Fantasy nên được truyền tải thành:

> **đặt các mảnh cổ ngữ → kích hoạt tấm bia → làm hình tượng thức tỉnh → thắp sáng chòm sao**

Nếu UI, animation và feedback cùng phục vụ fantasy này, Mirror có thể nâng đáng kể cảm giác hoàn thiện mà không cần thay đổi gameplay core hoặc thêm quá nhiều asset.

---

# 15. Nguyên tắc tổng kết

Mỗi animation nên trả lời ít nhất một trong ba câu hỏi:

1. **Người chơi vừa làm gì?**
2. **Hệ thống vừa phản hồi điều gì?**
3. **Trạng thái gameplay vừa thay đổi như thế nào?**

Nếu một animation không trả lời được ít nhất một câu trên, khả năng cao nó chỉ là decoration và nên được cân nhắc loại bỏ.

Mục tiêu cuối cùng không phải là:

> “Mirror có nhiều animation.”

Mà là:

> **“Mọi hành động trong Mirror đều có phản hồi đẹp, rõ và có chủ đích.”**
