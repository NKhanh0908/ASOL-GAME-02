# 05 — Campaign, phiên chơi và lưu offline

Nguồn: GDD §2.3–2.4, §4.1–4.2. Phụ thuộc: 01, 02, 04. Spec này sở hữu navigation/lifecycle và dữ liệu bền vững; không dùng state của Phaser scene làm nguồn tiến độ.

## 1. Tiến trình campaign

**SAVE-01:** Manifest định nghĩa thứ tự 1-1…1-6, 2-1…2-6, 3-1…3-6. Trạng thái gameplay của entry là locked, unlocked hoặc completed; trạng thái nội dung approved là một điều kiện riêng.

- 1-1 mở sẵn khi có dữ liệu approved.
- Một màn mở khi màn liền trước đã hoàn thành; màn đã hoàn thành luôn có thể replay nếu dữ liệu còn khả dụng.
- Màn unlocked nhưng nội dung chưa approved không được khởi chạy. Bản nội bộ ghi “Nội dung đang hoàn thiện”; release build không được có tình huống này.
- Màn cuối hoàn thành dẫn về menu hoặc thông báo kết thúc campaign, không tự quay vòng sang 1-1.
- Harness chọn level trực tiếp phục vụ test không cập nhật tiến độ campaign. Không có nút skip trong menu người chơi.

**SAVE-02:** Một chuyển tiếp `playing → won` tạo đúng một yêu cầu ghi completion. Command result cung cấp `becameWon`; render, animation callback và việc đọc state không được ghi lại. Repository cũng xử lý idempotent: complete một ID đã có không tạo bản sao.

## 2. Schema và namespace

**SAVE-03:** Namespace mới `mirror.rebuild.*`, không đọc hoặc ghi vào save của prototype. Cùng ID level nhưng nội dung mới không mặc nhiên kế thừa completion cũ. Bản khởi tạo không có migration từ prototype.

```json
{
  "version": 1,
  "campaignRevision": "oracle-v1",
  "completed": ["1-1", "1-2"],
  "settings": { "showTarget": true }
}
```

Key chính: `mirror.rebuild.progress.v1`. `campaignRevision` thuộc manifest. Bản schema chỉ lưu completion/settings; pose, selected piece và preview không lưu qua việc OS đóng tiến trình. Không có dữ liệu mua hàng, tài khoản hoặc định danh cá nhân.

**SAVE-04:** Loader kiểm tra object, version/revision và kiểu trường trước khi dùng. Chuẩn hóa ID trùng và loại ID không thuộc manifest kèm chẩn đoán. Completion hợp lệ là một tiền tố liên tục của thứ tự campaign; sau một khoảng trống, bỏ phần đuôi bất thường thay vì mở khóa xuyên màn. Các trường bổ sung không được thực thi hoặc sử dụng làm đường dẫn.

## 3. Kết quả load/save và phục hồi

| Tình huống | Kết quả | Thông báo / tác động |
|---|---|---|
| Chưa có save | Tiến độ rỗng, showTarget=true | Mở 1-1, không báo lỗi |
| JSON lỗi, sai kiểu, version/revision không hỗ trợ | Bắt đầu tiến độ mới trong phiên | “Không đọc được tiến độ cũ”; giữ raw cũ để điều tra, không crash |
| Settings lỗi nhưng completed hợp lệ | Giữ completion, dùng settings mặc định | Chẩn đoán nội bộ |
| ID dư/trùng hoặc completion có khoảng trống | Dùng tiền tố hợp lệ, đánh dấu recovered | Báo ngắn một lần nếu tiến độ bị loại |
| Ghi thất bại / quota / storage bị chặn | Giữ completion trong bộ nhớ | Cho chơi tiếp; báo “Tiến độ chưa lưu được trên máy” |

**SAVE-05:** Khi save chính bị hỏng/không tương thích, thử giữ nguyên raw vào key `mirror.rebuild.progress.recovery` trước lần ghi thay thế đầu tiên. Chỉ giữ một bản recovery; nếu backup không ghi được thì chuyển phiên sang memory-only, không ghi đè raw gốc. Không tự hứa sẽ khôi phục được dữ liệu hỏng. Mã hóa không thuộc yêu cầu MVP; bảo toàn dữ liệu và báo lỗi rõ là yêu cầu bắt buộc.

Save failure dùng snapshot memory mới nhất cho phần còn lại của phiên; một lần load lại không được làm mất completion vừa đạt. Việc thử ghi lại diễn ra ở hành động lưu tiếp theo hoặc khi người dùng thử lại, không lặp liên tục theo frame. Repository trả `persisted` hoặc `memory-only` để UI phản ánh đúng.

## 4. Vòng đời màn và ứng dụng

**SAVE-06:** Application quản lý route `menu`, `playing`, `paused`, `completed`, `campaign-finished`. Session core chỉ cần `playing/won`; pause không làm thay đổi mask hoặc tiêu chí thắng.

| Sự kiện | Điều phối |
|---|---|
| Menu/Back khi đang chơi | Hủy drag, mở pause, giữ session |
| Tiếp tục | Đóng pause; tiếp tục đúng pose/turns |
| Chơi lại | Reset session, tạo attempt mới; không xóa completion đã lưu |
| Về chọn màn khi chưa xong | Thông báo bỏ bố cục hiện tại, chỉ rời khi chọn xác nhận |
| App xuống nền | Hủy drag, tạm dừng input và thời gian playtest; giữ state đã commit trong bộ nhớ |
| App trở lại, process còn sống | Hiện pause để người chơi chủ động tiếp tục |
| OS đóng process rồi mở lại | Vào menu với completion/settings đã lưu; màn đang giải bắt đầu lại |
| Back khi ở menu | Chuyển cho hành vi hệ thống Android; không giả lập thắng/reset |

**SAVE-07:** Scene nhận completion đã lưu trước khi cho điều hướng Màn tiếp. Nếu ghi lỗi, vẫn cho đi tiếp với tiến độ trong bộ nhớ và thông báo tương ứng. Thao tác Next chọn successor trong manifest đã approved; không gọi tăng index rồi modulo về đầu.

## 5. Settings và tách dữ liệu

**SAVE-08:** `showTarget` áp dụng cho lớp bóng mờ trên board; thumbnail mẫu luôn còn để đọc mục tiêu. Đổi setting không tác động targetMask hoặc phép chấm. Nếu sau này thêm rung, bổ sung field mặc định qua schema tương thích; không phát hành toggle khi chưa có adapter hỗ trợ. Custom Level nếu được đưa vào phạm vi sau phải có repository/key riêng, không dùng completion campaign.

## 6. Ca nghiệm thu

- Hoàn thành 1-1 → về menu → đóng/mở app: 1-1 completed, 1-2 unlocked nếu approved; 1-3 locked.
- Hai callback hoặc nhiều render sau thắng chỉ lưu một ID; replay không tạo duplicate.
- Không mở được màn qua route giả/ID chưa unlocked; harness không ghi campaign.
- Save sai JSON, version/revision lạ, duplicate/unknown ID, prefix có lỗ đều có kết quả xác định theo mục 3.
- Quota failure vẫn giữ tiến độ trong phiên, UI không tuyên bố đã lưu bền vững; raw hỏng không bị âm thầm ghi đè nếu backup thất bại.
- Pause/background khi đang kéo khôi phục pose trước kéo; đóng/mở pause không reset màn.
- Process death mất bố cục đang giải theo thiết kế, nhưng giữ màn hoàn thành/settings đã persist.
- Hoàn thành 3-6 không tự sang 1-1; không có hint hoặc skip phát sinh từ lỗi nội dung.
