# 06 — Android, đo lường và nghiệm thu

Nguồn: GDD §2.4, §5.1–5.2. Phụ thuộc: 01–05. Spec này định nghĩa bằng chứng cần thu; các mục tiêu thiết bị/KPI chưa có kết quả đo không được viết thành thành tích đã đạt.

## 1. Build và thiết bị

**QA-01:** Bản Android dùng wrapper riêng trong `game-next/android/`, bundle web local qua Capacitor, khóa hướng dọc theo GDD. Baseline cấu hình để đối chiếu là API tối thiểu 24 và target/compile 36 như GDD/prototype; kiểm tra lại yêu cầu của đúng bộ dependency khi thực hiện spec 01. Nếu công cụ không hỗ trợ baseline này, ghi xung đột và đề xuất quyết định kỹ thuật, không âm thầm nâng hệ điều hành tối thiểu.

Các lệnh nghiệm thu khởi tạo dự kiến:

```text
Trong game-next/: npm ci
                 npm run typecheck
                 npm test
                 npm run content:validate
                 npm run build
                 npm run android:sync
Trong game-next/android/: .\gradlew.bat assembleDebug
```

Lệnh là hợp đồng cho project mới; hiện chưa khẳng định thư mục/script đã tồn tại. Build nội bộ với fixture dùng cờ cấu hình rõ; build release phải validate đủ campaign approved theo spec 04. Android debug APK là đầu ra thử thiết bị, không phải bản đã đủ điều kiện phát hành store.

**QA-02:** Kiểm tra ít nhất một điện thoại thật. Ma trận mục tiêu gồm máy thấp Android 7/API24, RAM 2 GB, vùng khả dụng gần 360 × 640 dp theo giả thuyết GDD; máy Android hiện hành có cutout/gesture bar; thêm emulator để kiểm tỷ lệ và lifecycle nếu cần. Nếu chưa có máy thấp, ghi “chưa đo trên cấu hình tối thiểu”, không dùng kết quả emulator để xác nhận cảm ứng/hiệu năng máy đó.

Mở app cold start khi tắt mạng, vào màn, reset, hoàn thành, đóng/mở lại; không tải font, background, level hoặc thư viện từ CDN trong luồng chơi.

## 2. Kiểm tra hình và thao tác

**QA-03:** Với mỗi loại cơ chế, chụp cùng một bố cục ở bản debug mask và bản hiển thị cuối để đối chiếu: tiếp giáp, hai lớp, ba lớp, xoay sát biên, temporary. Target, thumbnail và chấm thắng phải dùng cùng dữ liệu. Các preview vector/moodboard trong GDD không thay bằng chứng runtime.

**QA-04:** Kiểm safe area ở 16:9 và màn cao hơn: không che nút/khay/mẫu, cell vẫn vuông, chữ đủ đọc, vùng chạm đạt mục tiêu GDD sau scale. Thử một tay, kéo mảnh từ cạnh khay, chạm hai ngón, hủy kéo, đưa app xuống nền và nút Back. Kiểm màn trống hoặc mất texture bằng cold start và đổi scene lặp lại.

## 3. Hiệu năng cần đo

**QA-05:** Mục tiêu ban đầu cho review kỹ thuật: phản hồi hình bắt đầu trong frame kế tiếp sau command, kéo ổn định với mục tiêu 60 FPS trên máy hiện hành, mức sàn thử nghiệm 30 FPS trên máy thấp. Đây là ngân sách đề xuất để đo; nếu không đạt, giảm trang trí/tạo lại texture trong frame rồi kiểm lại trước khi thay luật hoặc độ phân giải bàn.

Ghi device/OS/WebView, resolution, bản build, thời gian mở app, frame time trong 30 giây kéo và chuyển cảnh, bộ nhớ trước/sau 20 lượt vào–ra màn. Không đặt kết luận “không rò bộ nhớ” chỉ từ một screenshot. Chỉ mở rộng profiling khi có trễ, tăng bộ nhớ hoặc một gate cụ thể không đạt; không benchmark vô hạn khi các rủi ro cần thiết đã được kiểm chứng.

## 4. Log playtest cục bộ

**QA-06:** Event có `schemaVersion=1`, `sessionId` ngẫu nhiên cho lần mở app, `attemptId` mới cho mỗi lần vào/chơi lại màn, `eventId` tăng trong session và `elapsedMs` từ đồng hồ monotonic. Không đưa tên người, tọa độ vị trí thật, tài khoản hoặc dữ liệu cá nhân vào log.

| Event | Field bổ sung | Khi gửi |
|---|---|---|
| session_start / session_end | buildVersion, durationActiveMs; endReason | Mở app; kết thúc sạch nếu quan sát được |
| level_start | levelId, contentRevision | Nạp và mở lượt chơi thành công |
| level_complete | levelId, activeMs, resetCount | Đúng một lần khi playing → won |
| level_exit | levelId, activeMs, outcome, reason | Rời màn; outcome cho biết đã thắng hay bỏ dở |
| piece_drop | levelId, pieceId, outcome=snapped/temporary/tray | Sau command thực sự commit |
| piece_rotate | levelId, pieceId, accepted, reason | Sau yêu cầu xoay |
| level_reset | levelId, resetCount | Người chơi yêu cầu reset |
| ftue_step_seen / ftue_step_done | levelId, stepId | Theo trigger trong spec 04 |

Thời gian active không tính pause/background. `session_end`/`level_exit` có thể thiếu nếu OS đóng process; công cụ phân tích phải báo lượt chưa kết thúc, không tự coi thời gian thiếu là 0 hoặc giả người chơi hoàn thành. Completion được lưu ngay lúc thắng, không đợi event kết thúc.

Khi reset, ghi `level_reset` và `level_exit(reason=reset)` cho attempt cũ, rồi tạo attemptId mới và `level_start`. Bộ đếm resetCount thuộc lượt ghé level được giữ qua reset, chỉ về 0 khi rời route rồi vào lại. Khi bấm Màn tiếp, attempt thắng ghi `level_exit(outcome=completed)` trước khi mở level mới. Ghi `session_end` là best effort khi đóng sạch; background chỉ tạm dừng đồng hồ và không tự tạo session mới.

**QA-07:** Recorder là port tùy chọn: bản playtest lưu cục bộ tối đa 2.000 event và 1 MiB, xóa event cũ theo lượt khi vượt giới hạn; ghi theo batch sau thao tác/đổi scene, không ở mỗi pointermove/frame. Khi storage lỗi, dừng ghi bền vững, giữ bộ đệm có giới hạn và báo chẩn đoán nội bộ; game tiếp tục chạy. Không có network uploader. Export log chỉ là công cụ debug/playtest do người thử chủ động sử dụng.

## 5. Đánh giá trải nghiệm

Theo ngưỡng GDD: ít nhất 4/5 người mới bắt đầu kéo trong 10 giây; ít nhất 3/5 hiểu hai lớp trống, ba lớp hiện và hoàn thành 2-3. Ghi số người cần trợ giúp, cách họ giải thích quy luật và điểm mắc kẹt; không suy hiểu luật chỉ từ việc thắng do thử ngẫu nhiên.

Trong beta, báo completion 1-1…1-3 mục tiêu ≥80%, 2-3 ≥60% cùng tử/mẫu. Một attempt là một `level_start`; reset bắt đầu attempt mới nhưng bộ đếm resetCount được giữ trong cùng lượt ghé level cho tới khi rời route. Báo riêng tỷ lệ theo attempt và tỷ lệ theo người thử để reset nhiều không che lấp attrition. Thời lượng phiên mục tiêu 2–5 phút là giả thuyết cần kiểm lại.

D1 cần một đợt tuyển người có theo dõi quay lại ngày sau; sessionId cục bộ mới mỗi lần mở không đủ để suy số người duy nhất. Dùng bảng theo dõi playtest ẩn danh do nhóm tổng hợp hoặc phê duyệt một thiết kế đo beta riêng trước khi triển khai định danh bền vững. Không tự bổ sung analytics trực tuyến.

Giữ quyết định không hint/skip. Nếu chạm ngưỡng mắc kẹt trong GDD §2.4, mở yêu cầu sửa level/FTUE và thử lại; ngưỡng không tự bật một tính năng mới.

## 6. Gate và evidence

| Gate | Bằng chứng tối thiểu |
|---|---|
| M0 | Lockfile/tool versions, kết quả typecheck/test/build, APK debug mở offline, fixture core đúng |
| M1 | Một màn mới approved; video drag/snap/temporary/win, save/reopen, xử lý Back/background; spec 02/03/05 đạt các ca liên quan |
| M2 | Sáu màn nền tảng đã duyệt dữ liệu, evidence hai/ba lớp và FTUE; fixture xoay/biên; ghi rõ harness và phần campaign còn thiếu |
| M3 | Đủ 18 màn approved, lượt chơi hết campaign, replay, save lỗi, safe area, máy mục tiêu và báo cáo playtest |

**QA-08:** Evidence lưu trong `docs/testing/mirror-rebuild/` khi triển khai, ghi ngày, commit/build ID, dependency versions, thiết bị và expected/actual cho lỗi. Bản thiếu máy thật hoặc dữ liệu màn phải ghi giới hạn rõ. Chỉ ký gate khi bằng chứng đáp ứng phạm vi gate; việc soạn xong bộ spec không làm bất kỳ gate runtime nào PASS.

## 7. Điều kiện chuyển sang kế hoạch

Review bộ spec và quyết định kỹ thuật trong 01; xác nhận các cách diễn giải GDD ở README. Sau review, viết kế hoạch M0–M1 có nhiệm vụ và test tương ứng ID yêu cầu. Authoring 18 màn và art pass đầy đủ là các gói tiếp theo, tránh gộp tất cả vào một bước khởi tạo không thể kiểm chứng.
