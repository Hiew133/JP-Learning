# 日本語 — Luyện nghe tiếng Nhật

Ứng dụng luyện **kỹ năng nghe tiếng Nhật** cho người Việt. Người học
luyện bằng đề mẫu (nghe–chọn, nghe–điền, shadowing) hoặc bằng **nội dung của riêng mình**:
tải audio + transcript lên, hoặc lưu video YouTube, rồi để AI tự sinh câu hỏi nghe hiểu,
câu điền từ và transcript có furigana + bản dịch tiếng Việt.

Giao diện song ngữ: tiếng Nhật cho nội dung học, tiếng Việt cho hướng dẫn & giải thích.

## Tính năng

- **聴解クイズ** — Nghe hội thoại (TTS) rồi chọn đáp án, đúng format đề thi nghe.
- **穴埋め問題** — Nghe rồi điền từ còn thiếu vào chỗ trống.
- **シャドーイング** — Nghe từng câu và nhắc lại; có ghi âm giọng để tự so sánh.
- **音声アップロード** — Tải file audio + transcript, AI sinh câu trắc nghiệm & điền từ.
- **YouTube ライブラリ** — Lưu video có phụ đề tiếng Nhật: transcript chạy theo video,
  kèm furigana (kuromoji) và dịch tiếng Việt (Gemini).
- **学習記録** — Thống kê số câu, độ chính xác, chuỗi ngày học (streak) và ôn lại câu sai.
  Tiến độ lưu trong `localStorage` của trình duyệt.

## Kiến trúc

| Phần | Công nghệ |
|------|-----------|
| Frontend | React 19 + Vite + React Router |
| Backend | Express, sql.js (SQLite), Multer (upload audio) |
| AI | Google Gemini (`@google/genai`) — sinh câu hỏi, điền từ, dịch |
| Furigana | kuromoji (phân tích hình thái tiếng Nhật) |
| Phụ đề YouTube | youtube-transcript |

## Yêu cầu

- Node.js 18+ và npm
- Một **Gemini API key** (miễn phí tại https://aistudio.google.com/apikey) — cần cho
  các tính năng AI (upload audio, YouTube, điền từ). Các đề mẫu có sẵn vẫn chạy được mà
  không cần key.

## Cài đặt & chạy

Cần chạy **hai tiến trình**: backend (cổng 3001) và frontend (cổng 5173).

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # rồi mở .env và điền GEMINI_API_KEY
npm run dev                 # chạy tại http://localhost:3001
```

### 2. Frontend (mở terminal thứ hai)

```bash
npm install
cp .env.example .env        # tùy chọn — chỉ cần khi backend chạy ở URL khác
npm run dev                 # mở http://localhost:5173
```

Mở trình duyệt tại **http://localhost:5173**.

## Biến môi trường

**Frontend** (`.env`):

| Biến | Mặc định | Ý nghĩa |
|------|----------|---------|
| `VITE_API_URL` | `http://localhost:3001/api` | URL gốc của backend API |

**Backend** (`backend/.env`):

| Biến | Mặc định | Ý nghĩa |
|------|----------|---------|
| `GEMINI_API_KEY` | — | **Bắt buộc** cho tính năng AI |
| `PORT` | `3001` | Cổng backend lắng nghe |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Origin frontend được phép gọi API (CORS) |

> File `.env` chứa key thật và đã được `.gitignore` — không commit lên repo.

## Lệnh hữu ích

```bash
npm run dev      # frontend dev server
npm run build    # build production vào dist/
npm run preview  # xem thử bản build
npm run lint     # ESLint

# Trong backend/
npm run dev      # backend với nodemon (tự reload)
npm start        # backend production
```

## Ghi chú

- Tính năng nghe dùng **Web Speech API (TTS)** của trình duyệt; cần hệ điều hành có
  giọng đọc tiếng Nhật (`ja-JP`) thì mới phát được audio cho các đề TTS.
- Các route AI của backend có **giới hạn tần suất** (20 lần / 10 phút / IP) để tránh
  bị lạm dụng làm tốn quota Gemini.
- Hướng tới chuẩn truy cập **WCAG 2.1 AA**: văn bản tiếng Nhật được đánh dấu `lang="ja"`,
  có nhãn trợ năng và vùng `aria-live` cho phản hồi đúng/sai.
