# Khám Phá Yên Thành 3D

Game web 3D phiêu lưu khám phá huyện Yên Thành, Nghệ An.

## Tính năng

- Tạo phòng, nhập mã mời để vào cùng bạn bè; xem tên người chơi trong thế giới
- Chat trực tiếp trong phòng, giới hạn tin nhắn và số người chơi mỗi phòng
- Đường phố và ngõ nối các địa điểm, cầu bắc qua sông Dinh và cầu Bến Hàng ở Phúc Thành; xe máy/ô tô lưu thông, xe tay ga có người lái có thể điều khiển
- Đại lộ giao cắt có vỉa hè, bó vỉa, vạch qua đường, dãy nhà phố nhiều tầng và cửa hàng; mỗi xã có chợ và quán bún mang tên địa phương
- Khu thương mại thị trấn có bệnh viện, karaoke, shop thời trang, nhà thuốc, quán cà phê và tạp hóa; đèn giao thông đổi pha, cảnh sát giữ xe vượt đèn đỏ trong thời gian ngắn
- Bản đồ rộng 2.400 đơn vị trong game, các xã được giãn cách để dễ nhận biết; đường trục dài nối thị trấn với mạng đường liên xã
- Mỗi khu vực có cổng chào, biển địa danh, cụm nhà dân có cửa/cửa sổ/vườn rau, quầy nông sản và ruộng lúa nối với đường làng
- Có địa danh tiêu biểu, đồi núi, rừng, đền chùa và nhà thờ theo từng xã; vị trí là mô phỏng tương đối, không phải bản đồ đo đạc chính xác
- Điểm bắt đầu ngay trước cổng THPT Phan Đăng Lưu ở thị trấn Yên Thành; sân bóng Phong Liên ở thị trấn, đập Vệ Vừng ở Đồng Thành, trại cừu ở Bảo Thành
- Phong cách hoạt hình 3D tươi sáng: nhân vật tóc xoăn, mắt lớn, áo kẻ, quần xanh và chân trần; ánh nắng ấm, bóng mềm, sương xa và đồng cỏ xanh
- THPT Phan Đăng Lưu là trường duy nhất trong game và là công trình cao nhất; sân bóng có khán đài, cầu gỗ và bờ lau sông Dinh, đập, trại cừu
- Cầu Bến Hàng ở Phúc Thành có quầy hàng rong và người dân bán rau quả, thức ăn quê
- Khuôn viên THPT Phan Đăng Lưu được mở rộng, có sân lát gạch, khối lớp học vàng ba tầng với điểm nhấn đỏ, phòng bảo vệ, nhà xe có vạch đỗ, sân bóng đá và bóng chuyền, vườn hoa, đài phun nước, cột cờ Việt Nam
- Khuôn viên trường có tường rào bao quanh, cổng vào và hàng dừa cao ven tường; thầy cô cao ngang nhân vật, có bảng tên và được nhân vật tự động chào khi đến gần; nhấn E cạnh bất kỳ thầy cô nào để trò chuyện theo lựa chọn; 37 học sinh có tên chạy qua lại rải rác trong sân, bên cạnh nhóm học sinh chơi bóng chuyền
- Thêm xóm nhà mái ngói, đình làng và các thửa ruộng lúa
- NPC và đàn cừu chuyển động; khu vực có mô tả và điểm tương tác riêng
- Âm thanh gió, chim, nước ven sông, bước chân và tương tác (có nút tắt/mở)
- Nhân vật 3D góc nhìn thứ ba với camera theo sau, minimap, WASD, Shift để chạy và E để khám phá

## Cấu trúc thư mục

```
yen-thanh-3d/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js       # Khởi tạo + minimap + vòng lặp
│   ├── world.js      # Địa hình, khu vực, NPC, animation
│   ├── player.js     # Nhân vật, điều khiển, âm thanh
│   ├── multiplayer.js # Kết nối phòng, đồng bộ nhân vật và chat
│   └── zones.js      # Dữ liệu khu vực + tương tác
├── server.js         # Máy chủ HTTP + WebSocket
├── package.json
├── assets/
└── README.md
```

## Chạy game và máy chủ nhiều người chơi

Game trực tuyến cần Node.js 18+ và kết nối Internet để tải Three.js từ CDN.

```bash
npm install
npm start
```

Mở http://localhost:3000. Để mời bạn bè qua Internet, triển khai máy chủ này trên một host công khai có hỗ trợ WebSocket (WSS khi dùng HTTPS), rồi gửi liên kết hoặc mã phòng. Phòng tự đóng khi người chơi cuối cùng rời đi; hiện phòng lưu trong bộ nhớ của máy chủ.

Không chạy bằng Live Server nếu muốn chơi nhiều người: máy chủ cần phục vụ cả trang game lẫn kết nối WebSocket.

### Chơi một mình

Có thể mở bằng Live Server và chọn **Chơi một mình**. Các chức năng tạo phòng, mời bạn bè và chat yêu cầu máy chủ Node.js phía trên.

> Không mở trực tiếp file HTML (bị chặn CORS module).

## Điều khiển

| Phím       | Chức năng          |
|------------|--------------------|
| WASD       | Di chuyển          |
| Chuột      | Xoay camera        |
| Shift      | Chạy nhanh         |
| E          | Tương tác          |
| F          | Lên xe máy gần nhất / xuống xe |
| Click      | Khóa / mở chuột    |
| Enter      | Mở khung chat khi đang chơi |
| Chat       | Gõ tin nhắn trong khung trò chuyện |

## Công nghệ

- Three.js r160
- JavaScript ES Module
- Web Audio API (âm thanh tạo trong trình duyệt, không cần tải tệp âm thanh)
- WebSocket (phòng chơi và đồng bộ nhân vật/chat)
- HTML5 Canvas (minimap)
