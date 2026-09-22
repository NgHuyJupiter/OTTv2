# 🎮 OTTv2 - Rock Paper Scissors Chess

**OTTv2** là một game cờ trực tiếp 2 người chơi trên nền web, kết hợp giữa luật chơi **Kéo – Búa – Giấy (Rock Paper Scissors)** và cơ chế di chuyển của cờ vua, được xây dựng bằng **Node.js**, **Express** và **Socket.IO** theo thời gian thực.

## 🕹️ Cách chơi

- Hai người chơi lần lượt vào phòng: người đầu tiên cầm quân **Đỏ (Red)**, người sau cầm quân **Xanh (Blue)**.
- Bàn cờ có kích thước **9x9**, mỗi bên có một "vùng nhà" riêng ở hai góc chéo của bàn cờ.

### 1. Giai đoạn đặt quân (Placement Phase)
- Sau khi cả hai bấm **Ready**, trò chơi bắt đầu với 30 giây đặt quân.
- Người chơi lần lượt chọn loại quân (**Rock / Paper / Scissors**) và đặt vào vùng nhà của mình theo lượt.

### 2. Giai đoạn di chuyển (Game Phase)
- Mỗi lượt, người chơi di chuyển **1 quân** đi **1 ô** theo bất kỳ hướng nào (kể cả chéo).
- Khi 2 quân chạm nhau, kết quả được quyết định theo luật **Kéo – Búa – Giấy**:

  | Quân     | Thắng     |
  | -------- | --------- |
  | 🪨 Rock  | ✂️ Scissors |
  | 📄 Paper | 🪨 Rock    |
  | ✂️ Scissors | 📄 Paper |

- Hai quân cùng loại không thể ăn nhau.
- Quân thua bị loại khỏi bàn cờ.

### 3. Điều kiện chiến thắng
Một trong hai bên thắng khi:
- 🏁 Đưa một quân tới **góc nhà của đối thủ** (ô `0,0` hoặc `8,8`), **hoặc**
- 💥 **Tiêu diệt toàn bộ** một loại quân của đối thủ.

## ⚙️ Công nghệ sử dụng

| Thành phần | Công nghệ |
| ---------- | --------- |
| Backend    | Node.js, Express |
| Realtime   | Socket.IO |
| Frontend   | HTML5, CSS3, JavaScript thuần |
| Dev tools  | Nodemon |

## 📁 Cấu trúc dự án

```
ottv2/
├── public/
│   ├── index.html   # Giao diện game
│   ├── game.js      # Logic phía client (render bàn cờ, xử lý socket)
│   └── styles.css   # Định dạng giao diện
├── server.js        # Server game (quản lý trạng thái, luật chơi, socket)
├── package.json
└── README.md
```

## 🚀 Cài đặt & Chạy

Yêu cầu: **Node.js >= 14**

```bash
# 1. Clone dự án
git clone https://github.com/NgHuyJupiter/OTTv2.git
cd OTTv2

# 2. Cài đặt dependencies
npm install

# 3. Chạy server
npm start

# Hoặc chạy chế độ dev (tự reload khi có thay đổi)
npm run dev
```

Truy cập game tại: **http://localhost:3000**

> 💡 Mở 2 tab/2 trình duyệt để chơi 2 người.

### Biến môi trường

| Biến  | Mặc định | Mô tả                |
| ----- | -------- | -------------------- |
| `PORT` | `3000`   | Cổng chạy server     |

## 🔌 Sự kiện Socket.IO

| Sự kiện (client → server) | Dữ liệu | Mô tả |
| ------------------------- | ------- | ----- |
| `ready` | – | Báo hiệu sẵn sàng |
| `placePiece` | `{ row, col, pieceType }` | Đặt quân trong giai đoạn placement |
| `movePiece` | `{ fromRow, fromCol, toRow, toCol }` | Di chuyển quân trong game phase |

| Sự kiện (server → client) | Dữ liệu | Mô tả |
| ------------------------- | ------- | ----- |
| `init` | `{ playerColor, gameState }` | Gán màu & gửi trạng thái ban đầu |
| `gameStart` | `{ currentTurn }` | Bắt đầu game khi cả 2 ready |
| `updateBoard` | `board` | Cập nhật bàn cờ |
| `turnChange` | `currentTurn` | Đổi lượt |
| `placementPhaseEnd` | – | Hết giai đoạn đặt quân |
| `gameOver` | `{ winner }` | Thông báo kết quả |
| `resetGame` | – | Reset game (khi có người thoát) |

## 📄 License

MIT
